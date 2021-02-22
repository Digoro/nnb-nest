import { Controller, Get, Query } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { PaginationSearchDto } from '../shared/model/dto';
import { HashtagService } from './hashtag.service';
import { Hashtag } from './model/product.entity';

@Controller('api/hashtags')
export class HashtagController {
  constructor(private readonly hashtagService: HashtagService) { }

  @Get()
  search(@Query() search: PaginationSearchDto): Promise<Pagination<Hashtag>> {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.hashtagService.paginate(search);
  }
}
