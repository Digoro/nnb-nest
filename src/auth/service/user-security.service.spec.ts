import { Test, TestingModule } from '@nestjs/testing';
import { UserSecurityService } from './user-security.service';

describe('UserSecurityService', () => {
  let service: UserSecurityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSecurityService],
    }).compile();

    service = module.get<UserSecurityService>(UserSecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
