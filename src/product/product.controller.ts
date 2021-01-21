import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ProductCreateDto, ProductUpdateDto } from './model/product.dto';
import { Product } from './model/product.entity';
import { ProductService } from './product.service';
import { UserIsHostGuard } from './user-is-host-guard';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() product: ProductCreateDto, @Request() request): Promise<Product> {
    const userId = request.user.id;
    return this.productService.create(userId, product);
  }

  @Get()
  index(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('hostId') hostId: number): Promise<Pagination<Product>> {
    limit = limit > 100 ? 100 : limit;
    if (!hostId) {
      return this.productService.paginateAll({ page: Number(page), limit: Number(limit) });
    } else {
      return this.productService.paginateByHost({ page: Number(page), limit: Number(limit) }, hostId);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const product = await this.productService.findById(id);
    if (!product) throw new NotFoundException()
    return product;
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
