import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ProductEntity } from './model/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    AuthModule
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule { }
