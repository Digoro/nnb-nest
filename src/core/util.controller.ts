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
    try {
      const ips = request.headers['x-forwarded-for'];
      const ip = ips.split(', ');
      return { ip }
    } catch {
      return { ip: '' }
    }
  }
}
