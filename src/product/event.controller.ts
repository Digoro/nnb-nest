import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { Role } from 'src/user/model/user.interface';
import { EventService } from './event.service';
import { EventCreateDto, EventSearchDto, EventUpdateDto } from './model/product.dto';
import { Event } from './model/product.entity';

@ApiTags('events')
@Controller('api/events')
export class EventController {
  constructor(private readonly eventService: EventService) { }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  create(@Body() event: EventCreateDto): Promise<Event> {
    return this.eventService.create(event);
  }

  @Get()
  index(@Query() search: EventSearchDto): Promise<Pagination<Event>> {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.eventService.paginate(search);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const event = await this.eventService.findById(id);
    if (!event) throw new NotFoundException()
    return event;
  }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put(':id')
  update(@Param('id') id: number, @Body() event: EventUpdateDto) {
    return this.eventService.updateOne(id, event);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.eventService.deleteOne(id);
  }
}
