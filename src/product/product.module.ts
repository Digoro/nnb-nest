import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { AnalysisHashtagEntity, CategoryEntity, HashtagEntity, ProductEntity, ProductOptionEntity, ProductRepresentationPhotoEntity } from './model/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductRepresentationPhotoEntity,
      CategoryEntity,
      ProductOptionEntity,
      HashtagEntity,
      AnalysisHashtagEntity
    ]),
    AuthModule
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule { }
