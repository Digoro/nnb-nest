import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { SharedModule } from 'src/shared/shared.module';
import { UserProductLike } from 'src/user/model/user.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './categoy.service';
import { EventReviewController } from './event-review.controller';
import { EventReviewService } from './event-review.service';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { HashtagController } from './hashtag.controller';
import { HashtagService } from './hashtag.service';
import { Category, Event, EventReview, Hashtag, Product, ProductCategoryMap, ProductHashtagMap, ProductOption, ProductRepresentationPhoto, ProductRequest, ProductReview } from './model/product.entity';
import { ProductRequestController } from './product-request.controller';
import { ProductRequestService } from './product-request.service';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductRepresentationPhoto,
      Category,
      ProductOption,
      Hashtag,
      ProductRequest,
      Event,
      ProductReview,
      ProductCategoryMap,
      ProductHashtagMap,
      UserProductLike,
      EventReview
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
    HashtagController,
    ProductRequestController
  ],
  providers: [
    ProductService,
    EventService,
    CategoryService,
    ProductReviewService,
    EventReviewService,
    HashtagService,
    ProductRequestService,
  ]
})
export class ProductModule { }
