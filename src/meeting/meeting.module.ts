import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingController } from './controller/meeting.controller';
import { MeetingEntity } from './model/meeting.entity';
import { MeetingService } from './service/meeting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeetingEntity])
  ],
  controllers: [MeetingController],
  providers: [MeetingService]
})
export class MeetingModule { }
