import { Controller, Get, Query } from '@nestjs/common';
import { BandService } from './band.service';

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
