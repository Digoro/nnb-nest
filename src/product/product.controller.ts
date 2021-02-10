import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { Role } from 'src/user/model/user.interface';
import { ProductCreateDto, ProductRequestCreateDto, ProductSearchDto, ProductUpdateDto } from './model/product.dto';
import { Product, ProductRequest } from './model/product.entity';
import { ProductService } from './product.service';
import { UserIsProductHostGuard } from './user-is-product-host-guard';

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
  search(@Query() search: ProductSearchDto): Promise<Pagination<Product>> {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.productService.search(search);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const product = await this.productService.findById(id);
    if (!product) throw new NotFoundException()
    return product;
  }

  @UseGuards(AuthGuard('jwt'), UserIsProductHostGuard)
  @Put(':id')
  update(@Param('id') id: number, @Body() product: ProductUpdateDto) {
    return this.productService.updateOne(id, product);
  }

  @UseGuards(AuthGuard('jwt'), UserIsProductHostGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productService.deleteOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('requests')
  productRequest(@Body() productRequestDto: ProductRequestCreateDto, @Request() request): Promise<ProductRequest> {
    const userId = request.user.id;
    return this.productService.productRequest(userId, productRequestDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put('requests/:id')
  checkProductRequest(@Param('id') id: number, @Body() isChecked: boolean): Promise<ProductRequest> {
    return this.productService.checkProductRequest(id, isChecked);
  }
}
