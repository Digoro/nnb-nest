import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { Meeting } from '../model/meeting.interface';
import { MeetingService } from '../service/meeting.service';

@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) { }

  @Post()
  create(@Body() meeting: Meeting) {
    return this.meetingService.create(meeting);
  }

  @Get()
  findAll() {
    return this.meetingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() meeting: Meeting) {
    return this.meetingService.update(+id, meeting);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingService.remove(+id);
  }
}
