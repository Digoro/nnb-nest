import { Controller, Get, HttpService, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('util')
@Controller('api/util')
export class UtilController {
  constructor(
    private http: HttpService
  ) { }

  @Get('ip')
  getClientIp(@Req() request) {
    return {
      ip: request.headers['x-forwarded-for'],
      host: request.headers['x-forwarded-host'],
      port: request.headers['x-forwarded-port'],
      realIp: request.headers['x-real-ip'],
    }
  }
}
