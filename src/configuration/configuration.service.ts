import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from './model/configuration.entity';

@Injectable()
export class ConfigurationService {
    constructor(
        @InjectRepository(Configuration) private configurationRepository: Repository<Configuration>,
    ) { }

    async getAll(): Promise<Configuration[]> {
        return await this.configurationRepository.find();
    }

    async update(id: number, value: any): Promise<Configuration> {
        const config = await this.configurationRepository.findOne(id);
        config.value = value;
        return await this.configurationRepository.save(config);
    }
}
