import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { Payment } from 'src/payment/model/payment.entity';
import { Review } from 'src/product/model/review.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { Repository } from 'typeorm';
import { KakaotalkMessageType, KakaotalkService } from './../shared/service/kakaotalk.service';
import { SlackMessageType, SlackService } from './../shared/service/slack.service';
import { ReviewCreateDto, ReviewSearchDto, ReviewUpdateDto } from './model/review.dto';
import { ProductService } from './product.service';

@Injectable()
export class ReviewService {
  reviewRelations = ['user', 'payment'];

  constructor(
    private authService: AuthService,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    private productService: ProductService,
    private kakaotalkService: KakaotalkService,
    private slackService: SlackService
  ) { }

  async create(userId: number, reviewDto: ReviewCreateDto): Promise<Review> {
    const user = await this.authService.findById(userId);
    const payment = await this.paymentRepository.findOne(reviewDto.paymentId);
    const parent = await this.reviewRepository.findOne({ id: reviewDto.parentId });
    const findReview = await this.reviewRepository.findOne({ user, payment, parent });
    if (findReview) {
      return this.update(findReview.id, reviewDto)
    }
    else {
      const review = reviewDto.toEntity(user, payment, parent);
      const newReview = await this.reviewRepository.save(review);
      return newReview;
    }
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
    const items = result.items;

    for (const parent of items) {
      const children = await this.reviewRepository.findOne({ where: [{ parent: parent.id }], relations: ['user', 'parent'] });
      if (children) items.push(children)
    }
    return {
      items: items,
      meta: { ...result.meta }
    };
  }

  async paginateByHost(search: ReviewSearchDto, host: number): Promise<Pagination<Review>> {
    const options = { page: search.page, limit: search.limit }
    delete search.page;
    delete search.limit;

    const hostedProducts = await this.productService.getHostedProducts(host);
    if (hostedProducts.length === 0) {
      return {
        items: [],
        meta: {
          itemCount: 0,
          totalItems: 0,
          itemsPerPage: 1,
          totalPages: 1,
          currentPage: 1,
        }
      };
    } else {
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
      const items = result.items;

      for (const parent of items) {
        const children = await this.reviewRepository.findOne({ where: [{ parent: parent.id }], relations: ['user', 'parent'] });
        if (children) items.push(children)
      }
      return {
        items: items,
        meta: { ...result.meta }
      };
    }
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

  async requestReview(paymentId: number) {
    const payment = await this.paymentRepository.findOne(paymentId, {
      relations: ['order', 'order.product', 'order.product.representationPhotos', 'order.coupon', 'order.orderItems',
        'order.orderItems.productOption', 'order.user', 'order.nonMember', 'paymentCancel']
    });
    const response = await this.kakaotalkService.send(KakaotalkMessageType.REQUEST_REVIEW, payment);
    const code = response.data.code;
    if (code === -99) {
      //todo
      const errorInfo = new ErrorInfo('NE002', 'NEI0013', '리뷰 요청 알림톡 전송에 오류가 발생하였습니다.', response.data)
      await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
      throw new InternalServerErrorException(errorInfo);
    } else {
      payment.isRequestReview = true;
      return await this.paymentRepository.save(payment);
    }
  }
}
