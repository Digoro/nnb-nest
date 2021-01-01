import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProductEntity } from 'src/product/model/product.entity';
import { User } from 'src/user/model/user.interface';
import { Repository } from 'typeorm';
import { ProductCreateDto, ProductUpdateDto } from '../model/product.dto';
import { Product } from './../../product/model/product.interface';

@Injectable()
export class ProductService {

  constructor(
    @InjectRepository(ProductEntity) private productRepository: Repository<ProductEntity>
  ) { }

  create(user: User, product: ProductCreateDto): Observable<Product> {
    product.host = user;
    return from(this.productRepository.save(product));
  }

  paginateAll(options: IPaginationOptions): Observable<Pagination<Product>> {
    return from(paginate<Product>(this.productRepository, options, {
      relations: ['host']
    }))
  }

  paginateByHost(options: IPaginationOptions, hostId: number): Observable<Pagination<Product>> {
    return from(paginate<Product>(this.productRepository, options, {
      where: [
        { host: hostId }
      ],
      relations: ['host']
    }))
  }

  findById(id: number): Observable<Product> {
    return from(this.productRepository.findOne({ id }, {
      relations: ['host']
    }));
  }

  update<T>(id: number, productForUpdate: T) {
    return this.findById(id).pipe(
      switchMap(user => {
        return this.productRepository.save(Object.assign(user, productForUpdate))
      })
    )
  }

  updateOne(id: number, product: ProductUpdateDto): Observable<any> {
    return from(this.update(id, product))
  }

  deleteOne(id: number): Observable<any> {
    return from(this.productRepository.delete(id));
  }
}
