import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Blog } from 'src/product/model/product.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { Repository } from 'typeorm';
import { BlogCreateDto, BlogSearchDto, BlogUpdateDto } from './model/product.dto';
import { BlogType } from './model/product.interface';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog) private blogRepository: Repository<Blog>,
  ) { }

  async create(blogDto: BlogCreateDto): Promise<Blog> {
    const blog = blogDto.toEntity();
    const newBlog = await this.blogRepository.save(blog);
    return newBlog;
  }

  async paginate(search: BlogSearchDto): Promise<Pagination<Blog>> {
    const options = { page: search.page, limit: search.limit }
    const query = this.blogRepository
      .createQueryBuilder('blog')
      .orderBy('blog.createdAt', 'DESC')
    if (search.type !== BlogType.ALL) {
      query.where('blog.type = :type', { type: search.type })
    }
    const blogs = await paginate<Blog>(query, options);
    return blogs;
  }

  async findById(id: number): Promise<Blog> {
    return await this.blogRepository.findOne({ id });
  }

  async updateOne(id: number, dto: BlogUpdateDto): Promise<any> {
    const blog = await this.findById(id);
    if (!blog) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0035', '존재하지 않습니다.'))
    return await this.blogRepository.save(Object.assign(blog, dto))
  }

  async deleteOne(id: number): Promise<any> {
    return await this.blogRepository.delete(id);
  }
}
