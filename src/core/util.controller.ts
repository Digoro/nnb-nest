import { Controller, Get, HttpService } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('util')
@Controller('api/util')
export class UtilController {
  constructor(
    private http: HttpService
  ) { }

  @Get('ip')
  async getClientIp() {
    const response = await this.http.get('https://api.ipify.org/?format=json').toPromise();
    return response['data'];
  }
}
