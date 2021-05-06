import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Payment } from 'src/payment/model/payment.entity';
import { Review } from 'src/product/model/review.entity';
import { SharedModule } from 'src/shared/shared.module';
import { UserProductLike } from 'src/user/model/user.entity';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './categoy.service';
import { EventReviewController } from './event-review.controller';
import { EventReviewService } from './event-review.service';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { HashtagController } from './hashtag.controller';
import { HashtagService } from './hashtag.service';
import { Blog, Category, Event, EventProductMap, EventReview, Hashtag, Product, ProductCategoryMap, ProductHashtagMap, ProductOption, ProductRepresentationPhoto, ProductRequest, ProductReview } from './model/product.entity';
import { ProductRequestController } from './product-request.controller';
import { ProductRequestService } from './product-request.service';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Payment,
      Review,
      ProductRepresentationPhoto,
      Category,
      ProductOption,
      Hashtag,
      ProductRequest,
      Event,
      Blog,
      ProductReview,
      ProductCategoryMap,
      ProductHashtagMap,
      UserProductLike,
      EventReview,
      EventProductMap
    ]),
    AuthModule,
    SharedModule
  ],
  controllers: [
    ProductController,
    EventController,
    CategoryController,
    ProductReviewController,
    EventReviewController,
    BlogController,
    HashtagController,
    ProductRequestController,
    ReviewController
  ],
  providers: [
    ProductService,
    EventService,
    BlogService,
    CategoryService,
    ProductReviewService,
    EventReviewService,
    HashtagService,
    ProductRequestService,
    ReviewService
  ]
})
export class ProductModule { }
