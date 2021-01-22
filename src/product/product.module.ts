import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { AnalysisHashtag, Category, Hashtag, Product, ProductOption, ProductRepresentationPhoto, RequestProduct } from './model/product.entity';
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
      RequestProduct
    ]),
    AuthModule
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule { }
