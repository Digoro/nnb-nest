import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alliance } from './model/alliance';

@Injectable()
export class AllianceService {
  constructor(
    @InjectRepository(Alliance) private allianceRepository: Repository<Alliance>,
  ) { }

  async getAll(): Promise<Alliance[]> {
    return await this.allianceRepository.createQueryBuilder().getMany();
  }

  async get(key: string): Promise<Alliance> {
    return await this.allianceRepository.findOne({ key });
  }
}
