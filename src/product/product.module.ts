import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UserProductLike } from 'src/user/model/user.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './categoy.service';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { HashtagController } from './hashtag.controller';
import { HashtagService } from './hashtag.service';
import { Category, Event, Hashtag, Product, ProductCategoryMap, ProductHashtagMap, ProductOption, ProductRepresentationPhoto, ProductRequest, ProductReview } from './model/product.entity';
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
      UserProductLike
    ]),
    AuthModule
  ],
  controllers: [
    ProductController,
    EventController,
    CategoryController,
    ProductReviewController,
    HashtagController,
    ProductRequestController
  ],
  providers: [
    ProductService,
    EventService,
    CategoryService,
    ProductReviewService,
    HashtagService,
    ProductRequestService,
  ]
})
export class ProductModule { }
