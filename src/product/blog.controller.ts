import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { ErrorInfo } from 'src/shared/model/error-info';
import { Role } from 'src/user/model/user.interface';
import { BlogService } from './blog.service';
import { BlogCreateDto, BlogSearchDto, BlogUpdateDto } from './model/product.dto';
import { Blog } from './model/product.entity';

@ApiTags('blogs')
@Controller('api/blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) { }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  create(@Body() blog: BlogCreateDto): Promise<Blog> {
    return this.blogService.create(blog);
  }

  @Get()
  index(@Query() search: BlogSearchDto): Promise<Pagination<Blog>> {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.blogService.paginate(search);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const blog = await this.blogService.findById(id);
    if (!blog) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0036', '존재하지 않습니다.'))
    return blog;
  }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put(':id')
  update(@Param('id') id: number, @Body() blog: BlogUpdateDto) {
    return this.blogService.updateOne(id, blog);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.blogService.deleteOne(id);
  }
}
