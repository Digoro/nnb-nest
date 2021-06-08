import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { Payment } from 'src/payment/model/payment.entity';
import { ReviewPhoto } from 'src/product/model/review.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { getConnection, Repository } from 'typeorm';
import { KakaotalkMessageType, KakaotalkService } from './../shared/service/kakaotalk.service';
import { SlackMessageType, SlackService } from './../shared/service/slack.service';
import { ReviewCreateDto, ReviewSearchDto, ReviewUpdateDto } from './model/review.dto';
import { Review } from './model/review.entity';
import { ProductService } from './product.service';

@Injectable()
export class ReviewService {
  reviewRelations = ['user', 'payment', 'photos'];

  constructor(
    private authService: AuthService,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewPhoto) private reviewPhotoRepository: Repository<ReviewPhoto>,
    private productService: ProductService,
    private kakaotalkService: KakaotalkService,
    private slackService: SlackService
  ) { }

  async create(userId: number, dto: ReviewCreateDto): Promise<Review> {
    const queryRunner = await getConnection().createQueryRunner()
    try {
      await queryRunner.startTransaction();
      const manager = queryRunner.manager;
      const user = await this.authService.findById(userId);
      const payment = await this.paymentRepository.findOne(dto.paymentId, {
        relations: ['order', 'order.user', 'order.product', 'order.product.host']
      });
      const userReview = await this.reviewRepository.findOne({ id: dto.parentId });
      const hostComment = await this.reviewRepository.findOne({ user, payment, parent: userReview });
      let review: Review;
      // 호스트 답글 수정
      if (hostComment) {
        review = await manager.save(Review, Object.assign(hostComment, dto));
      }
      // 사용자 리뷰 / 호스트 답글 추가
      else {
        const newReviewOrComment = dto.toEntity(user, payment, userReview);
        review = await manager.save(Review, newReviewOrComment);
        if (dto.photos) {
          for (const photo of dto.photos) {
            photo.review = review;
            await manager.save(ReviewPhoto, photo);
          }
        }
        if (!dto.parentId && payment.order.product.host.phoneNumber) {
          await this.kakaotalkService.send(KakaotalkMessageType.ADD_REVIEW, payment)
        } else if (dto.parentId && !hostComment) {
          await this.kakaotalkService.send(KakaotalkMessageType.ADD_REVIEW_COMMENT, payment)
        }
      }
      await queryRunner.commitTransaction();
      return review;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      const errorInfo = new ErrorInfo('NE002', 'NEI0005', '리뷰 등록에 오류가 발생했습니다..', e)
      await this.slackService.send(SlackMessageType.SERVICE_ERROR, errorInfo)
      throw new InternalServerErrorException(errorInfo);
    } finally {
      await queryRunner.release();
    }
  }

  // 사용자 리뷰 수정
  async update(id: number, dto: ReviewUpdateDto): Promise<any> {
    const review = await this.findOne(id);
    await this.reviewPhotoRepository.delete({ review });
    await this.reviewRepository.save(Object.assign(review, dto))

    const newReview = await this.findOne(id);
    for (const photo of dto.photos) {
      photo.review = newReview;
      await this.reviewPhotoRepository.save(photo);
    }
    return newReview;
  }

  async paginate(search: ReviewSearchDto): Promise<Pagination<Review>> {
    const options = { page: search.page, limit: search.limit }
    delete search.page;
    delete search.limit;

    const query = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.photos', 'reviewPhotos')
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
        .leftJoinAndSelect('review.photos', 'reviewPhotos')
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
      .leftJoinAndSelect('review.photos', 'reviewPhotos')
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
      .leftJoinAndSelect('review.photos', 'reviewPhotos')
      .leftJoinAndSelect('review.payment', 'payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.productOption', 'productOption')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
      .where('payment.id = :paymentId', { paymentId })
      .getOne()
  }

  async delete(id: number): Promise<any> {
    return await this.reviewRepository.delete(id);
  }

  async requestReview(paymentId: number) {
    const payment = await this.paymentRepository.findOne(paymentId, {
      relations: ['order', 'order.product', 'order.user']
    });
    await this.kakaotalkService.send(KakaotalkMessageType.REQUEST_REVIEW, payment);
    payment.isRequestReview = true;
    return await this.paymentRepository.save(payment);
  }
}
