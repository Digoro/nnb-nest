import { Test, TestingModule } from '@nestjs/testing';
import { MeetingService } from '../service/meeting.service';
import { MeetingController } from './meeting.controller';

describe('MeetingController', () => {
  let controller: MeetingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingController],
      providers: [MeetingService],
    }).compile();

    controller = module.get<MeetingController>(MeetingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
