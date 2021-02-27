import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { Product, ProductRequest } from 'src/product/model/product.entity';
import { Repository } from 'typeorm';
import { PaginationSearchDto } from './../shared/model/dto';
import { ProductRequestCreateDto } from './model/product.dto';

@Injectable()
export class ProductRequestService {
  constructor(
    private authService: AuthService,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductRequest) private productRequestRepository: Repository<ProductRequest>,
  ) { }

  async search(search: PaginationSearchDto): Promise<Pagination<ProductRequest>> {
    const options = { page: search.page, limit: search.limit };
    const requests = await paginate<ProductRequest>(this.productRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.product', 'product')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhotos')
      .leftJoinAndSelect('request.user', 'user')
      , options)
    return requests
  }

  async isChecked(productId: number, userId: number): Promise<boolean> {
    const count = await this.productRequestRepository.count({ productId: productId, userId: userId });
    return count > 0;
  }

  async request(userId: number, productRequestDto: ProductRequestCreateDto): Promise<ProductRequest> {
    const user = await this.authService.findById(userId);
    const product = await this.productRepository.findOne(productRequestDto.productId);
    if (user && product) {
      const productRequest = productRequestDto.toEntity(user, product);
      const newRequest = await this.productRequestRepository.save(productRequest)
      return newRequest;
    } else {
      throw new BadRequestException()
    }
  }

  async findOne(id: number): Promise<ProductRequest> {
    return await this.productRequestRepository.findOne({ id });
  }

  async check(id: number, isChecked: boolean): Promise<any> {
    const productRequest = await this.findOne(id);
    if (!productRequest) throw new BadRequestException();
    productRequest.isChecked = isChecked;
    if (isChecked) productRequest.checkedAt = new Date();
    const original = await this.findOne(id);
    return await this.productRequestRepository.save(Object.assign(original, productRequest))
  }
}
