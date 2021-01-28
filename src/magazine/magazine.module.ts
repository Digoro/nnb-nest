import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { MagazineController } from './magazine.controller';
import { MagazineService } from './magazine.service';
import { Magazine } from './model/magazine.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Magazine,
        ]),
        AuthModule
    ],
    providers: [
        MagazineService,
    ],
    controllers: [
        MagazineController,
    ]
})
export class MagazineModule { }