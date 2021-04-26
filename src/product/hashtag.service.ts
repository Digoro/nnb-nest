import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { PaginationSearchDto } from '../shared/model/dto';
import { Hashtag } from './model/product.entity';

@Injectable()
export class HashtagService {
  constructor(
    @InjectRepository(Hashtag) private hashtagRepository: Repository<Hashtag>,
  ) { }

  async paginate(search: PaginationSearchDto): Promise<Pagination<Hashtag>> {
    const options = { page: search.page, limit: search.limit }
    return await paginate<Hashtag>(this.hashtagRepository, options)
  }
}
