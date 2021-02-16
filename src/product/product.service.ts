import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { Product, ProductCategoryMap, ProductRequest, ProductReview } from 'src/product/model/product.entity';
import { PaginationWithChildren } from 'src/shared/model/pagination';
import { UserProductLike } from 'src/user/model/user.entity';
import { getConnection, Repository } from 'typeorm';
import { ProductCreateDto, ProductRequestCreateDto, ProductReviewCreateDto, ProductReviewSearchDto, ProductReviewUpdateDto, ProductSearchDto, ProductUpdateDto } from './model/product.dto';
import { Category, Hashtag, ProductHashtagMap, ProductOption, ProductRepresentationPhoto } from './model/product.entity';

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
    @InjectRepository(ProductRequest) private productRequestRepository: Repository<ProductRequest>,
    @InjectRepository(ProductReview) private productReviewRepository: Repository<ProductReview>
  ) { }

  async create(userId: number, productDto: ProductCreateDto): Promise<Product> {
    const queryRunner = await getConnection().createQueryRunner()
    try {
      await queryRunner.startTransaction();
      const user = await this.authService.findById(userId);
      const cheapestPrice = this.getChepastPrice(productDto.options).price;
      const cheapestDiscountPrice = this.getChepastPrice(productDto.options).discountPrice;
      const product = productDto.toEntity(user, cheapestPrice, cheapestDiscountPrice);
      const newProduct = await queryRunner.manager.save(product);

      for (const id of productDto.categoryIds) {
        const category = await this.categoryRepository.findOne({ id });
        const map = new ProductCategoryMap();
        map.categoryId = id;
        map.category = category;
        map.productId = newProduct.id;
        map.product = newProduct;
        await queryRunner.manager.save(map);
      }

      for (const tag of productDto.hashtags) {
        let hashtag: Hashtag;
        hashtag = await this.hashtagRepository.findOne({ name: tag.name });
        if (!hashtag) hashtag = await queryRunner.manager.save(Hashtag, tag);
        const map = new ProductHashtagMap();
        map.hashtagId = hashtag.id;
        map.hashtag = hashtag;
        map.productId = newProduct.id;
        map.product = newProduct;
        await queryRunner.manager.save(map);
      }

      for (const photo of productDto.representationPhotos) {
        photo.product = newProduct;
        await queryRunner.manager.save(ProductRepresentationPhoto, photo);
      }

      for (const option of productDto.options) {
        option.product = newProduct;
        await queryRunner.manager.save(ProductOption, option);
      }

      queryRunner.commitTransaction();
      return newProduct;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  private getChepastPrice(options: ProductOption[]): ProductOption {
    return options.reduce((a, b) => {
      if (a.discountPrice < b.discountPrice) return a;
      else return b;
    })
  }

  async search(search: ProductSearchDto): Promise<Pagination<Product>> {
    if (search.categoryId) return await this.searchByCategory(search);
    if (search.hashtag) return await this.searchByHashtag(search);
    if (search.from && search.to) return await this.searchByFromTo(search);
    else return await this.searchByOthers(search);
  }

  async searchByOthers(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const products = await paginate<Product>(
      this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
        .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
        .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
        .where('product.status = :status', { status: search.status })
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

  async searchByHashtag(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const hashtag = await this.hashtagRepository.findOne({ name: search.hashtag });
    const products = await paginate<Product>(
      this.productRepository
        .createQueryBuilder('product')
        .leftJoin(ProductHashtagMap, 'map', 'map.productId = product.id')
        .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
        .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
        .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
        .where('product.status = :status', { status: search.status })
        .andWhere('map.hashtagId = :hashtagId', { hashtagId: hashtag.id })
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

  async searchByFromTo(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const products = await paginate<Product>(
      this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
        .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
        .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
        .leftJoin(ProductOption, 'option', 'option.product_id = product.id')
        .where('product.status = :status', { status: search.status })
        .andWhere('option.date between :from and :to', { from: search.from, to: search.to })
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

  async searchByCategory(search: ProductSearchDto): Promise<Pagination<Product>> {
    const options = { page: search.page, limit: search.limit };
    const products = await paginate<Product>(
      this.productRepository
        .createQueryBuilder('product')
        .leftJoin(ProductCategoryMap, 'map', 'map.productId = product.id')
        .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
        .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
        .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
        .where('product.status = :status', { status: search.status })
        .andWhere('map.categoryId = :categoryId', { categoryId: search.categoryId })
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

  async findById(id: number, userId?: number): Promise<Product> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
      .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
      .leftJoinAndSelect("product.productCategoryMap", 'productCategoryMap')
      .leftJoinAndSelect("productCategoryMap.category", 'category')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
      .leftJoinAndSelect('product.productRequests', 'productRequests')
      .leftJoinAndSelect('product.options', 'productOptions')
      .leftJoinAndSelect('product.host', 'user')
      .where('product.id = :id', { id })
      .orderBy('product.createdAt', 'DESC')
      .getOne()

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
    return product;
  }

  async updateOne(id: number, productDto: ProductUpdateDto): Promise<any> {
    //TODO: ManyToMany relations(category, hashtag)
    const product = await this.findById(id);
    return await this.productRepository.save(Object.assign(product, productDto))
  }

  async deleteOne(id: number): Promise<any> {
    return await this.productRepository.delete(id);
  }

  async productRequest(userId: number, productRequestDto: ProductRequestCreateDto): Promise<ProductRequest> {
    const user = await this.authService.findById(userId);
    const product = await this.productRepository.findOne(productRequestDto.productId);
    if (user && product) {
      const productRequest = productRequestDto.toEntity(user, product);
      const newRequest = await this.productRequestRepository.save(productRequest)
      return newRequest;
    } else {
      throw new BadRequestException()
    }
  }

  async findProductRequestById(id: number): Promise<ProductRequest> {
    return await this.productRequestRepository.findOne({ id });
  }

  async checkProductRequest(id: number, isChecked: boolean): Promise<any> {
    const productRequest = await this.findProductRequestById(id);
    if (!productRequest) throw new BadRequestException();
    productRequest.isChecked = isChecked;
    if (isChecked) productRequest.checkedAt = new Date();
    const original = await this.findProductRequestById(id);
    return await this.productRequestRepository.save(Object.assign(original, productRequest))
  }

  async createReview(userId: number, reviewDto: ProductReviewCreateDto): Promise<ProductReview> {
    const user = await this.authService.findById(userId);
    const product = await this.findById(reviewDto.productId);
    const parent = reviewDto.parentId ? await this.findProductReviewById(reviewDto.parentId) : undefined;
    const review = reviewDto.toEntity(user, product, parent);
    const newReview = await this.productReviewRepository.save(review);
    return newReview;
  }

  async paginateProductReview(search: ProductReviewSearchDto): Promise<PaginationWithChildren<ProductReview>> {
    const options = { page: search.page, limit: search.limit }
    delete search.page
    delete search.limit
    const result = await paginate<ProductReview>(this.productReviewRepository, options, {
      where: [{ ...search, parent: null }],
      relations: this.productReviewRelations,
      order: { createdAt: 'DESC' }
    })
    const parents = result.items;
    for (const parent of parents) {
      const children = await this.productReviewRepository.find({ where: [{ parent: parent.id }], relations: ['user', 'parent'] });
      if (children.length > 0) parents.push(...children)
    }
    const count = await this.productReviewRepository.count({ where: [search] });
    return {
      items: parents,
      meta: { ...result.meta, totalItemsWithChildren: count }
    };
  }

  async findProductReviewById(id: number): Promise<ProductReview> {
    return await this.productReviewRepository.findOne({ id }, { relations: this.productReviewRelations });
  }

  async updateProductReview(id: number, reviewDto: ProductReviewUpdateDto): Promise<any> {
    const review = await this.findProductReviewById(id);
    return await this.productReviewRepository.save(Object.assign(review, reviewDto))
  }

  async deleteProductReview(id: number): Promise<any> {
    const review = await this.productReviewRepository.findOne({ id }, { relations: ['children'] });
    if (review.children.length > 0) {
      const dto = new ProductReviewUpdateDto();
      dto.comment = '삭제된 댓글입니다.';
      return await this.updateProductReview(id, dto);
    } else {
      return await this.productReviewRepository.delete(id);
    }
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
