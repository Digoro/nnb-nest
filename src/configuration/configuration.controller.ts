import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { Role } from 'src/user/model/user.interface';
import { ConfigurationService } from './configuration.service';
import { Configuration } from './model/configuration.entity';

@ApiTags('configurations')
@Controller('api/configurations')
export class ConfigurationController {
    constructor(
        private configurationService: ConfigurationService
    ) { }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get('')
    create(): Promise<Configuration[]> {
        return this.configurationService.getAll();
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put(':id')
    updateOne(@Param('id') id: number, @Body() body: { value: any }): Promise<Configuration> {
        return this.configurationService.update(id, body.value)
    }
}
