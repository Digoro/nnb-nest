import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AnalysisHashtag, Category, Event, Hashtag, Product, ProductOption, ProductRepresentationPhoto, ProductRequest, ProductReview } from './model/product.entity';
import { ProductReviewController } from './product-review.controller';
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
      AnalysisHashtag,
      ProductRequest,
      Event,
      ProductReview
    ]),
    AuthModule
  ],
  controllers: [
    ProductController,
    EventController,
    ProductReviewController
  ],
  providers: [
    ProductService,
    EventService
  ]
})
export class ProductModule { }
