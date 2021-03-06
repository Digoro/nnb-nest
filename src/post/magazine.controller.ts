import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ErrorInfo } from 'src/shared/model/error-info';
import { Role } from 'src/user/model/user.interface';
import { RolesGuard } from '../auth/guard/roles-guard';
import { MagazineService } from './magazine.service';
import { MagazineCreateDto, MagazineSearchDto, MagazineUpdateDto } from './model/magazine.dto';
import { Magazine } from './model/magazine.entity';

@ApiTags('magazines')
@Controller('api/magazines')
export class MagazineController {
    constructor(private readonly magazineService: MagazineService) { }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post()
    create(@Body() event: MagazineCreateDto, @Request() request): Promise<Magazine> {
        const userId = request.user.id;
        return this.magazineService.create(userId, event);
    }

    @Get()
    index(@Query() search: MagazineSearchDto): Promise<Pagination<Magazine>> {
        let limit = +search.limit;
        limit = limit > 100 ? 100 : limit;
        return this.magazineService.paginate(search);
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        const magazine = await this.magazineService.findById(id);
        if (!magazine) throw new NotFoundException(new ErrorInfo('NE001', 'NEI0010', '존재하지 않습니다.'))
        return magazine;
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put(':id')
    update(@Param('id') id: number, @Body() magazine: MagazineUpdateDto) {
        return this.magazineService.updateOne(id, magazine);
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.magazineService.deleteOne(id);
    }
}
