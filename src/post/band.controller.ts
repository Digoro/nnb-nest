import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BandService } from './band.service';

@ApiTags('band')
@Controller('api/band')
export class BandController {
    constructor(private readonly bandService: BandService) { }

    @Get('list')
    index(@Query('after') after: string): Promise<any> {
        return this.bandService.list(after);
    }

    @Get('post')
    findOne(@Query('postKey') postKey: string): Promise<any> {
        return this.bandService.findByPostId(postKey);
    }

    @Get('comments')
    getComments(@Query('postKey') postKey: string): Promise<any> {
        return this.bandService.getComments(postKey);
    }
}
