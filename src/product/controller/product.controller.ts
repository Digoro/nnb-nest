import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Observable } from 'rxjs';
import { UserIsHostGuard } from '../guard/user-is-host-guard';
import { ProductCreateDto } from '../model/product.dto';
import { ProductService } from '../service/product.service';
import { Product } from './../../product/model/product.interface';
import { ProductUpdateDto } from './../model/product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() product: ProductCreateDto, @Request() request) {
    const user = request.user;
    return this.productService.create(user, product);
  }

  @Get()
  index(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('hostId') hostId: number
  ): Observable<Pagination<Product>> {
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
