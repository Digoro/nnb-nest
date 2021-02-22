import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { PaginationSearchDto } from './../shared/model/dto';
import { Category } from './model/product.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
  ) { }

  async paginate(search: PaginationSearchDto): Promise<Pagination<Category>> {
    const options = { page: search.page, limit: search.limit }
    return await paginate<Category>(this.categoryRepository, options)
  }
}
