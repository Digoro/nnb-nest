import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ProductController } from './controller/product.controller';
import { ProductEntity } from './model/product.entity';
import { ProductService } from './service/product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    AuthModule
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule { }
