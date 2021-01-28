import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { BandController } from './band.controller';
import { BandService } from './band.service';
import { MagazineController } from './magazine.controller';
import { MagazineService } from './magazine.service';
import { Magazine } from './model/magazine.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Magazine,
        ]),
        AuthModule,
        HttpModule
    ],
    providers: [
        MagazineService,
        BandService
    ],
    controllers: [
        MagazineController,
        BandController
    ]
})
export class MagazineModule { }