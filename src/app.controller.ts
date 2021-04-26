import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor() { }

  @Get()
  getHello(): string {
    return 'hello nest'
  }
}
