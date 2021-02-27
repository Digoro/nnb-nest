import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ProductCreateDto, ProductManageDto, ProductSearchDto, ProductUpdateDto } from './model/product.dto';
import { Product } from './model/product.entity';
import { ProductService } from './product.service';
import { UserIsProductHostGuard } from './user-is-product-host-guard';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Get()
  search(@Query() search: ProductSearchDto): Promise<Pagination<Product>> {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.productService.search(search);
  }

  @Get('product/:productId')
  async findOne(@Param('productId') productId: number) {
    return await this.productService.findById(productId);
  }

  @Get('product/:productId/user/:userId')
  async findOneByUser(@Param('productId') productId: number, @Param('userId') userId: number) {
    const product = await this.productService.findById(productId, userId);
    return product;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/likes')
  getLikeProducts(@Query() search: ProductSearchDto, @Request() request): Promise<Pagination<Product>> {
    const userId = request.user.id;
    return this.productService.getLikeProducts(userId, search);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() product: ProductCreateDto, @Request() request): Promise<Product> {
    const userId = request.user.id;
    return this.productService.create(userId, product);
  }

  @UseGuards(AuthGuard('jwt'), UserIsProductHostGuard)
  @Put(':id')
  update(@Param('id') id: number, @Body() product: ProductUpdateDto) {
    return this.productService.updateOne(id, product);
  }

  @UseGuards(AuthGuard('jwt'), UserIsProductHostGuard)
  @Put('/management/:id')
  manage(@Param('id') id: number, @Body() product: ProductManageDto) {
    return this.productService.manage(id, product);
  }

  @UseGuards(AuthGuard('jwt'), UserIsProductHostGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productService.deleteOne(id);
  }
}
