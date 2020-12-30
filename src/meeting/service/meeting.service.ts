import { Injectable } from '@nestjs/common';
import { Meeting } from '../model/meeting.interface';

@Injectable()
export class MeetingService {
  create(meeting: Meeting) {
    return 'This action adds a new meeting';
  }

  findAll() {
    return `This action returns all meeting`;
  }

  findOne(id: number) {
    return `This action returns a #${id} meeting`;
  }

  update(id: number, meeting: Meeting) {
    return `This action updates a #${id} meeting`;
  }

  remove(id: number) {
    return `This action removes a #${id} meeting`;
  }
}
