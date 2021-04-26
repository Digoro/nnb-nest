import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { Configuration } from './model/configuration.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Configuration
        ]),
        AuthModule,
        SharedModule
    ],
    providers: [
        ConfigurationService
    ],
    controllers: [
        ConfigurationController
    ]
})
export class ConfigurationModule { }