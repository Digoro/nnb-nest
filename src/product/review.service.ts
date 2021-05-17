import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { Payment } from 'src/payment/model/payment.entity';
import { Review } from 'src/product/model/review.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { Repository } from 'typeorm';
import { ReviewCreateDto, ReviewSearchDto, ReviewUpdateDto } from './model/review.dto';
import { ProductService } from './product.service';

@Injectable()
export class ReviewService {
  reviewRelations = ['user', 'payment'];

  constructor(
    private authService: AuthService,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    private productService: ProductService
  ) { }

  async create(userId: number, reviewDto: ReviewCreateDto): Promise<Review> {
    const user = await this.authService.findById(userId);
    const payment = await this.paymentRepository.findOne(reviewDto.paymentId);
    const findReview = await this.reviewRepository.findOne({ user, payment });
    //todo
    if (findReview) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0015', '이미 리뷰를 작성했습니다.'));
    const review = reviewDto.toEntity(user, payment);
    const newReview = await this.reviewRepository.save(review);
    return newReview;
  }

  async paginate(search: ReviewSearchDto): Promise<Pagination<Review>> {
    const options = { page: search.page, limit: search.limit }
    delete search.page;
    delete search.limit;

    const query = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.payment', 'payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.product', 'product')
      .where('product.id = :id', { id: search.productId })
      .andWhere('review.parentId is null')
      .orderBy('review.createdAt', 'DESC')
    const result = await paginate<Review>(query, options);
    return result;
  }

  async paginateByHost(search: ReviewSearchDto, host: number): Promise<Pagination<Review>> {
    const options = { page: search.page, limit: search.limit }
    delete search.page;
    delete search.limit;

    const hostedProducts = await this.productService.getHostedProducts(host);
    const ids = hostedProducts.map(product => product.id);
    const query = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.payment', 'payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.productOption', 'productOption')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
      .where('product.id IN (:ids)', { ids })
      .andWhere('review.parentId is null')
      .orderBy('review.createdAt', 'DESC')
    const result = await paginate<Review>(query, options);
    return result;
  }

  async findOne(id: number): Promise<Review> {
    return await this.reviewRepository.findOne({ id }, { relations: this.reviewRelations });
  }

  async getBestByProduct(productId: number): Promise<Review> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.user', 'user')
      .innerJoinAndSelect('review.payment', 'payment')
      .innerJoinAndSelect('payment.order', 'order')
      .innerJoinAndSelect('order.product', 'product')
      .where('product.id = :productId', { productId })
      .orderBy('review.score', 'DESC')
      .addOrderBy('review.createdAt', 'DESC')
      .getOne();
    return result;
  }

  async findOneByPayment(paymentId: number): Promise<Review> {
    return await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.payment', 'payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.productOption', 'productOption')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
      .where('payment.id = :paymentId', { paymentId })
      .getOne()
  }

  async update(id: number, reviewDto: ReviewUpdateDto): Promise<any> {
    const review = await this.findOne(id);
    return await this.reviewRepository.save(Object.assign(review, reviewDto))
  }

  async delete(id: number): Promise<any> {
    return await this.reviewRepository.delete(id);
  }
}
