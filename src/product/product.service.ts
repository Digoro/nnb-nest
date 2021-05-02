import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { Product, ProductCategoryMap } from 'src/product/model/product.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { SlackMessageType, SlackService } from 'src/shared/service/slack.service';
import { UserProductLike } from 'src/user/model/user.entity';
import { getConnection, LessThanOrEqual, Repository } from 'typeorm';
import { Order, OrderItem } from './../payment/model/order.entity';
import { ProductCreateDto, ProductManageDto, ProductSearchDto, ProductUpdateDto } from './model/product.dto';
import { Category, Hashtag, ProductHashtagMap, ProductOption, ProductRepresentationPhoto } from './model/product.entity';
import { ProductStatus } from './model/product.interface';
var moment = require('moment')

@Injectable()
export class ProductService {
  basicProductRelations = ['host', 'representationPhotos', 'options', 'productRequests', 'productRequests.user'];
  productReviewRelations = ['user', 'product'];

  constructor(
    private authService: AuthService,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(UserProductLike) private userProductLikeRepository: Repository<UserProductLike>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(Hashtag) private hashtagRepository: Repository<Hashtag>,
    @InjectRepository(ProductOption) private productOptionRepository: Repository<ProductOption>,
    private slackService: SlackService
  ) { }

  async create(userId: number, productDto: ProductCreateDto): Promise<Product> {
    const queryRunner = await getConnection().createQueryRunner()
    try {
      await queryRunner.startTransaction();
      const manager = queryRunner.manager;
      const user = await this.authService.findById(userId);
      const product = productDto.toEntity(user);
      const newProduct = await manager.save(Product, product);

      for (const id of productDto.categories) {
        const category = await this.categoryRepository.findOne({ id });
        const map = new ProductCategoryMap();
        map.categoryId = id;
        map.category = category;
        map.productId = newProduct.id;
        map.product = newProduct;
        await manager.save(ProductCategoryMap, map);
      }

      for (const tag of productDto.hashtags) {
        let hashtag: Hashtag;
        if (tag.name) hashtag = await this.hashtagRepository.findOne({ name: tag.name });
        else if (tag.id) hashtag = await this.hashtagRepository.findOne({ id: tag.id });
        if (!hashtag) hashtag = await manager.save(Hashtag, tag);
        const map = new ProductHashtagMap();
        map.hashtagId = hashtag.id;
        map.hashtag = hashtag;
        map.productId = newProduct.id;
        map.product = newProduct;
        await manager.save(ProductHashtagMap, map);
      }

      for (const photo of productDto.representationPhotos) {
        photo.product = newProduct;
        await manager.save(ProductRepresentationPhoto, photo);
      }

      for (const option of productDto.options) {
        option.product = newProduct;
        await manager.save(ProductOption, option);
      }

      await queryRunner.commitTransaction();
      return newProduct;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      const errorInfo = new ErrorInfo('NE002', 'NEI0005', '상품 등록에 오류가 발생하였습니다.', e)
      await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
      throw new InternalServerErrorException(errorInfo);
    } finally {
      await queryRunner.release();
    }
  }

  async updateOne(id: number, dto: ProductUpdateDto): Promise<any> {
    const queryRunner = await getConnection().createQueryRunner()
    try {
      await queryRunner.startTransaction();
      const manager = queryRunner.manager;
      const photos = dto.representationPhotos;
      delete dto.representationPhotos;
      const product = await manager.findOne(Product, id);

      if (dto.addedOptions && dto.removedOptions) {
        for (const option of dto.addedOptions) {
          const newOption = option.toEntity(product);
          await manager.save(ProductOption, newOption);
        }
        for (const option of dto.removedOptions) {
          const count = await manager.createQueryBuilder(Order, 'order')
            .leftJoin(OrderItem, 'item', 'order.id = item.order')
            .where('order.product = :productId', { productId: product.id })
            .andWhere('item.productOption = :productOptionId', { productOptionId: option.id })
            .getCount()
          if (count === 0) {
            await manager.delete(ProductOption, { id: option.id });
          } else {
            option.isOld = true;
            await manager.save(ProductOption, option);
          }
        }
      }
      const newProduct = await manager.save(Product, Object.assign(product, dto));

      if (photos) {
        await manager.delete(ProductRepresentationPhoto, { product: newProduct });
        for (const photo of photos) {
          const newPhoto = new ProductRepresentationPhoto();
          newPhoto.photo = photo.photo;
          newPhoto.product = newProduct;
          newPhoto.sortOrder = newProduct.sortOrder;
          await manager.save(ProductRepresentationPhoto, newPhoto);
        }
      }

      if (dto.categories) {
        await manager.delete(ProductCategoryMap, { productId: id });
        for (const id of dto.categories) {
          const category = await manager.findOne(Category, { id });
          const map = new ProductCategoryMap();
          map.categoryId = id;
          map.category = category;
          map.productId = newProduct.id;
          map.product = newProduct;
          await manager.save(ProductCategoryMap, map);
        }
      }

      if (dto.hashtags) {
        await manager.delete(ProductHashtagMap, { productId: id });
        for (const tag of dto.hashtags) {
          let hashtag: Hashtag;
          if (tag.name) hashtag = await manager.findOne(Hashtag, { name: tag.name });
          else if (tag.id) hashtag = await manager.findOne(Hashtag, { id: tag.id });
          if (!hashtag) hashtag = await manager.save(Hashtag, tag);
          const map = new ProductHashtagMap();
          map.hashtagId = hashtag.id;
          map.hashtag = hashtag;
          map.productId = newProduct.id;
          map.product = newProduct;
          await manager.save(ProductHashtagMap, map);
        }
      }
      await queryRunner.commitTransaction();
      return newProduct;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      const errorInfo = new ErrorInfo('NE002', 'NEI0006', '상품 수정에 오류가 발생하였습니다.', e)
      await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
      throw new InternalServerErrorException(errorInfo);
    } finally {
      await queryRunner.release();
    }
  }

  async search(search: ProductSearchDto): Promise<Pagination<Product>> {
    try {
      if (search.categoryId !== undefined) return await this.searchByCategory(search);
      if (search.hashtag !== undefined) return await this.searchByHashtag(search);
      if (search.from !== undefined && search.to !== undefined) return await this.searchByFromTo(search);
      if (search.hostId !== undefined) return await this.searchHosted(search);
      else return await this.searchByOthers(search);
    } catch (e) {
      return {
        items: [], meta: {
          currentPage: 1,
          itemCount: 0,
          itemsPerPage: search.limit,
          totalItems: 0,
          totalPages: 0
        }
      }
    }
  }

  async manage(id: number, dto: ProductManageDto) {
    if (dto.status !== undefined) {
      const product = await this.productRepository.findOne(id);
      product.status = dto.status;
      return await this.productRepository.save(product);
    } else if (dto.sortOrder !== undefined) {
      const product = await this.productRepository.findOne(id);
      product.sortOrder = dto.sortOrder;
      return await this.productRepository.save(product);
    }
  }

  async searchHosted(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const query = this.productRepository
      .createQueryBuilder('product')
      .addSelect('product.description')
      .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
      .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
      .where('product.host = :hostId', { hostId: search.hostId })
      .orderBy('product.sortOrder', 'ASC')
    if (search.status !== ProductStatus.ALL) {
      query.andWhere('product.status = :status', { status: search.status })
    }
    const products = await paginate<Product>(query, options)

    const items = products.items.map(product => {
      const hashtags = product.productHashtagMap.map(map => map.hashtag);
      product.hashtags = hashtags;
      delete product.productHashtagMap;
      return product;
    })
    return { items, meta: products.meta };
  }

  async searchByOthers(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const query = this.productRepository
      .createQueryBuilder('product')
      .addSelect('product.description')
      .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
      .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
      .leftJoinAndSelect("product.productCategoryMap", 'productCategoryMap')
      .leftJoinAndSelect("productCategoryMap.category", 'category')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
      .orderBy('product.sortOrder', 'ASC')
    if (search.status !== ProductStatus.ALL) {
      query.where('product.status = :status', { status: search.status })
    }
    const products = await paginate<Product>(query, options)
    const items = products.items.map(product => {
      const hashtags = product.productHashtagMap.map(map => map.hashtag);
      const categories = product.productCategoryMap.map(map => map.category);
      product.hashtags = hashtags;
      product.categories = categories;
      delete product.productHashtagMap;
      delete product.productCategoryMap;
      return product;
    })
    return { items, meta: products.meta };
  }

  async getHostedProducts(hostId: number): Promise<Product[]> {
    return await this.productRepository.find({
      where: [{ host: hostId }],
      order: { sortOrder: 'ASC' }
    })
  }

  async searchByHashtag(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const hashtag = await this.hashtagRepository.findOne({ name: search.hashtag });
    const products = await paginate<Product>(
      this.productRepository
        .createQueryBuilder('product')
        .addSelect('product.description')
        .leftJoin(ProductHashtagMap, 'map', 'map.productId = product.id')
        .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
        .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
        .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
        .where('product.status = :status', { status: search.status })
        .andWhere('map.hashtagId = :hashtagId', { hashtagId: hashtag.id })
        .orderBy('product.sortOrder', 'ASC')
      , options
    )
    const items = products.items.map(product => {
      const hashtags = product.productHashtagMap.map(map => map.hashtag);
      product.hashtags = hashtags;
      delete product.productHashtagMap;
      return product;
    })
    return { items, meta: products.meta };
  }

  async searchByFromTo(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const products = await paginate<Product>(
      this.productRepository
        .createQueryBuilder('product')
        .addSelect('product.description')
        .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
        .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
        .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
        .leftJoin(ProductOption, 'option', 'option.product_id = product.id')
        .where('product.status = :status', { status: search.status })
        .andWhere('option.date between :from and :to', { from: search.from, to: search.to })
        .orderBy('product.sortOrder', 'ASC')
      , options
    )
    const items = products.items.map(product => {
      const hashtags = product.productHashtagMap.map(map => map.hashtag);
      product.hashtags = hashtags;
      delete product.productHashtagMap;
      return product;
    })
    return { items, meta: products.meta };
  }

  async searchByCategory(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const products = await paginate<Product>(
      this.productRepository
        .createQueryBuilder('product')
        .addSelect('product.description')
        .leftJoin(ProductCategoryMap, 'map', 'map.productId = product.id')
        .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
        .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
        .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
        .where('product.status = :status', { status: search.status })
        .andWhere('map.categoryId = :categoryId', { categoryId: search.categoryId })
        .orderBy('product.sortOrder', 'ASC')
      , options
    )
    const items = products.items.map(product => {
      const hashtags = product.productHashtagMap.map(map => map.hashtag);
      product.hashtags = hashtags;
      delete product.productHashtagMap;
      return product;
    })
    return { items, meta: products.meta };
  }

  async findById(id: number, userId?: number): Promise<Product> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .addSelect('product.description')
      .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
      .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
      .leftJoinAndSelect("product.productCategoryMap", 'productCategoryMap')
      .leftJoinAndSelect("productCategoryMap.category", 'category')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
      .leftJoinAndSelect('product.productRequests', 'productRequests')
      .leftJoinAndSelect('productRequests.uid', 'user')
      .leftJoinAndSelect('product.options', 'productOptions', 'productOptions.isOld = :isOld', { isOld: false })
      .leftJoinAndSelect('product.host', 'user')
      .where('product.id = :id', { id })
      .orderBy('product.createdAt', 'DESC')
      .getOne();

    if (!product) throw new NotFoundException(new ErrorInfo('NE001', 'NEI0033', '존재하지 않습니다.'))
    const hashtags = product.productHashtagMap.map(map => map.hashtag);
    const categories = product.productCategoryMap.map(map => map.category);
    const likes = await this.userProductLikeRepository.count({ where: { productId: id } })
    product.hashtags = hashtags;
    product.categories = categories;
    product.likes = likes;
    if (userId) {
      const isSetLike = await this.userProductLikeRepository.findOne({ userId, productId: id })
      product.isSetLike = !!isSetLike;
    }
    delete product.productHashtagMap;
    delete product.productCategoryMap;

    await this.deleteOldProductOptions(product);

    return product;
  }

  async deleteOldProductOptions(product: Product) {
    const now = new Date();
    const oldProductOptions = await this.productOptionRepository.find({
      product,
      date: LessThanOrEqual(now),
      isOld: false
    });
    await oldProductOptions.forEach(async (option) => {
      option.isOld = true;
      await this.productOptionRepository.save(option);
    })
  }

  async deleteOne(id: number): Promise<any> {
    return await this.productRepository.delete(id);
  }

  async getLikeProducts(userId: number, search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const products = await paginate<Product>(
      this.productRepository
        .createQueryBuilder('product')
        .leftJoin(UserProductLike, 'likes', 'likes.productId = product.id')
        .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
        .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
        .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
        .where('product.status = :status', { status: search.status })
        .andWhere('likes.userId = :userId', { userId })
        .orderBy('product.createdAt', 'DESC')
      , options
    )
    const items = products.items.map(product => {
      const hashtags = product.productHashtagMap.map(map => map.hashtag);
      product.hashtags = hashtags;
      delete product.productHashtagMap;
      return product;
    })
    return { items, meta: products.meta };
  }
}
