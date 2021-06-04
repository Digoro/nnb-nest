import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllianceService } from './alliance.service';
import { Alliance } from './model/alliance';

@ApiTags('alliance')
@Controller('api/alliances')
export class AllianceController {
  constructor(
    private allianceService: AllianceService
  ) { }

  @Get('')
  getAll(): Promise<Alliance[]> {
    return this.allianceService.getAll();
  }

  @Get(':key')
  get(@Param('key') key: string): Promise<Alliance> {
    return this.allianceService.get(key);
  }
}
