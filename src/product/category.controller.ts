import { Controller, Get, Query } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { PaginationSearchDto } from './../shared/model/dto';
import { CategoryService } from './categoy.service';
import { Category } from './model/product.entity';

@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Get()
  search(@Query() search: PaginationSearchDto): Promise<Pagination<Category>> {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.categoryService.paginate(search);
  }
}
