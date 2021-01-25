import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductReview } from 'src/product/model/product.entity';
import { ProductReviewCreateDto, ProductReviewSearchDto, ProductReviewUpdateDto } from './model/product.dto';
import { ProductService } from './product.service';
import { UserIsReviewAuthorGuard } from './user-is-review-author-guard copy';

@Controller('api/reviews/products')
export class ProductReviewController {
  constructor(private readonly productService: ProductService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post('')
  createReview(@Body() review: ProductReviewCreateDto, @Request() request): Promise<ProductReview> {
    const userId = request.user.id;
    return this.productService.createReview(userId, review);
  }

  @Get('')
  indexReview(@Query() search: ProductReviewSearchDto): any {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.productService.paginateProductReview(search);
  }

  @Get(':id')
  async findReviewOne(@Param('id') id: number) {
    const review = await this.productService.findProductReviewById(id);
    if (!review) throw new NotFoundException()
    return review;
  }

  @UseGuards(AuthGuard('jwt'), UserIsReviewAuthorGuard)
  @Put(':id')
  updateReview(@Param('id') id: number, @Body() review: ProductReviewUpdateDto) {
    return this.productService.updateProductReview(id, review);
  }

  @UseGuards(AuthGuard('jwt'), UserIsReviewAuthorGuard)
  @Delete(':id')
  removeReview(@Param('id') id: number) {
    return this.productService.deleteProductReview(id);
  }
}
