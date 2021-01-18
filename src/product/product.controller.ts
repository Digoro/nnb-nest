import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ProductCreateDto, ProductUpdateDto } from './model/product.dto';
import { Product } from './model/product.interface';
import { ProductService } from './product.service';
import { UserIsHostGuard } from './user-is-host-guard';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() product: ProductCreateDto, @Request() request): Promise<Product> {
    const user = request.user;
    return this.productService.create(user, product);
  }

  @Get()
  index(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('hostId') hostId: number): Promise<Pagination<Product>> {
    limit = limit > 100 ? 100 : limit;
    if (hostId === null || hostId === undefined) {
      return this.productService.paginateAll({ page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/products' });
    } else {
      return this.productService.paginateByHost({ page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/products' }, hostId);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'), UserIsHostGuard)
  @Put(':id')
  update(@Param('id') id: number, @Body() product: ProductUpdateDto) {
    return this.productService.updateOne(id, product);
  }

  @UseGuards(AuthGuard('jwt'), UserIsHostGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productService.deleteOne(id);
  }
}
