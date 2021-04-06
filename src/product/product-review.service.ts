import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { ProductReview } from 'src/product/model/product.entity';
import { PaginationWithChildren } from 'src/shared/model/pagination';
import { In, Repository } from 'typeorm';
import { ProductReviewCreateDto, ProductReviewSearchDto, ProductReviewUpdateDto } from './model/product.dto';
import { ProductService } from './product.service';

@Injectable()
export class ProductReviewService {
  basicProductRelations = ['host', 'representationPhotos', 'options', 'productRequests', 'productRequests.user'];
  productReviewRelations = ['user', 'product'];

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    @InjectRepository(ProductReview) private productReviewRepository: Repository<ProductReview>
  ) { }

  async create(userId: number, reviewDto: ProductReviewCreateDto): Promise<ProductReview> {
    const user = await this.authService.findById(userId);
    const product = await this.productService.findById(reviewDto.productId);
    const parent = reviewDto.parentId ? await this.findOne(reviewDto.parentId) : undefined;
    const review = reviewDto.toEntity(user, product, parent);
    const newReview = await this.productReviewRepository.save(review);
    return newReview;
  }

  async paginate(search: ProductReviewSearchDto): Promise<PaginationWithChildren<ProductReview>> {
    const options = { page: search.page, limit: search.limit }
    delete search.page;
    delete search.limit;

    //profile page
    if (search.user) {
      const hostedProducts = await this.productService.getHostedProducts(search.user);
      const ids = hostedProducts.map(product => product.id);
      delete search.user;
      const result = await paginate<ProductReview>(this.productReviewRepository, options, {
        where: [{ parent: null, product: In(ids) }],
        relations: this.productReviewRelations,
        order: { createdAt: 'DESC' }
      })
      const items = result.items;
      for (const parent of items) {
        const children = await this.productReviewRepository.find({ where: [{ parent: parent.id }], relations: ['user', 'parent'] });
        if (children.length > 0) items.push(...children)
      }
      const count = await this.productReviewRepository.count({ where: [{ product: In(ids) }] });
      return {
        items: items,
        meta: { ...result.meta, totalItemsWithChildren: count }
      };
    }
    //product-detail page
    else {
      const result = await paginate<ProductReview>(this.productReviewRepository, options, {
        where: [{ ...search, parent: null }],
        relations: this.productReviewRelations,
        order: { createdAt: 'DESC' }
      })
      const items = result.items;
      for (const parent of items) {
        const children = await this.productReviewRepository.find({ where: [{ parent: parent.id }], relations: ['user', 'parent'] });
        if (children.length > 0) items.push(...children)
      }
      const count = await this.productReviewRepository.count({ where: [search] });
      return {
        items: items,
        meta: { ...result.meta, totalItemsWithChildren: count }
      };
    }
  }

  async findOne(id: number): Promise<ProductReview> {
    return await this.productReviewRepository.findOne({ id }, { relations: this.productReviewRelations });
  }

  async update(id: number, reviewDto: ProductReviewUpdateDto): Promise<any> {
    const review = await this.findOne(id);
    return await this.productReviewRepository.save(Object.assign(review, reviewDto))
  }

  async delete(id: number): Promise<any> {
    const review = await this.productReviewRepository.findOne({ id }, { relations: ['children'] });
    if (review.children.length > 0) {
      const dto = new ProductReviewUpdateDto();
      dto.comment = '삭제된 댓글입니다.';
      return await this.update(id, dto);
    } else {
      return await this.productReviewRepository.delete(id);
    }
  }
}
