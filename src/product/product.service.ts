import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { ProductEntity } from 'src/product/model/product.entity';
import { User } from 'src/user/model/user.interface';
import { Repository } from 'typeorm';
import { ProductCreateDto, ProductUpdateDto } from './model/product.dto';
import { Product } from './model/product.interface';

@Injectable()
export class ProductService {

  constructor(
    @InjectRepository(ProductEntity) private productRepository: Repository<ProductEntity>
  ) { }

  async create(user: User, product: ProductCreateDto): Promise<Product> {
    product.host = user;
    return await this.productRepository.save(product);
  }

  async paginateAll(options: IPaginationOptions): Promise<Pagination<Product>> {
    return await paginate<Product>(this.productRepository, options, { relations: ['host'] })
  }

  async paginateByHost(options: IPaginationOptions, hostId: number): Promise<Pagination<Product>> {
    return await paginate<Product>(this.productRepository, options, { where: [{ host: hostId }], relations: ['host'] })
  }

  async findById(id: number): Promise<Product> {
    return await (this.productRepository.findOne({ id }, {
      relations: ['host']
    }));
  }

  async update<T>(id: number, productForUpdate: T): Promise<any> {
    const user = await this.findById(id);
    return await this.productRepository.save(Object.assign(user, productForUpdate))
  }

  async updateOne(id: number, product: ProductUpdateDto): Promise<any> {
    return await this.update(id, product);
  }

  async deleteOne(id: number): Promise<any> {
    return await this.productRepository.delete(id);
  }
}
