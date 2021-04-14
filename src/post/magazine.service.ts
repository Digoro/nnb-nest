import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { ErrorInfo } from 'src/shared/model/error-info';
import { Repository } from 'typeorm';
import { MagazineCreateDto, MagazineSearchDto, MagazineUpdateDto } from './model/magazine.dto';
import { Magazine } from './model/magazine.entity';

@Injectable()
export class MagazineService {
    constructor(
        private authService: AuthService,
        @InjectRepository(Magazine) private magazineRepository: Repository<Magazine>,
    ) { }

    async create(userId: number, magazineDto: MagazineCreateDto): Promise<Magazine> {
        const user = await this.authService.findById(userId);
        const magazine = magazineDto.toEntity(user);
        const newMagazine = await this.magazineRepository.save(magazine);
        return newMagazine;
    }

    async paginate(search: MagazineSearchDto): Promise<Pagination<Magazine>> {
        const options = { page: search.page, limit: search.limit }
        return await paginate<Magazine>(this.magazineRepository, options)
    }

    async findById(id: number): Promise<Magazine> {
        return await this.magazineRepository.findOne({ id });
    }

    async updateOne(id: number, magazineDto: MagazineUpdateDto): Promise<any> {
        const magazine = await this.findById(id);
        if (!magazine) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0030', '존재하지 않습니다.'))
        return await this.magazineRepository.save(Object.assign(magazine, magazineDto))
    }

    async deleteOne(id: number): Promise<any> {
        return await this.magazineRepository.delete(id);
    }
}
