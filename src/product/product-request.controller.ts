import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { Role } from 'src/user/model/user.interface';
import { PaginationSearchDto } from './../shared/model/dto';
import { ProductRequestCreateDto } from './model/product.dto';
import { ProductRequest } from './model/product.entity';
import { ProductRequestService } from './product-request.service';

@Controller('api/product-requests')
export class ProductRequestController {
  constructor(
    private readonly productRequestService: ProductRequestService
  ) { }

  @Get('')
  search(@Query() search: PaginationSearchDto): Promise<Pagination<ProductRequest>> {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.productRequestService.search(search);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('isChecked/:productId')
  isChecked(@Param('productId') productId: number, @Request() request): Promise<boolean> {
    const userId = request.user.id;
    return this.productRequestService.isChecked(productId, userId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('')
  productRequest(@Body() productRequestDto: ProductRequestCreateDto, @Request() request): Promise<ProductRequest> {
    const userId = request.user.id;
    return this.productRequestService.request(userId, productRequestDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put(':id')
  checkProductRequest(@Param('id') id: number, @Body() body: { isChecked: boolean }): Promise<ProductRequest> {
    return this.productRequestService.check(id, body.isChecked);
  }
}
