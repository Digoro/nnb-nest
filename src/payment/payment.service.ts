import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Payment } from 'src/payment/model/payment.entity';
import { Like, Repository } from 'typeorm';
import { PaymentCreateDto, PaymentSearchDto, PaymentUpdateDto } from './model/payment.dto';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment) private paymentRepository: Repository<Payment>
    ) { }

    async create(paymentDto: PaymentCreateDto): Promise<Payment> {
        return await this.paymentRepository.save(this.paymentRepository.create(paymentDto));
    }

    async paginate(search: PaymentSearchDto): Promise<Pagination<Payment>> {
        return await paginate<Payment>(this.paymentRepository, search)
    }

    async paginateByUsername(options: IPaginationOptions, name: string): Promise<Pagination<Payment>> {
        return await paginate(this.paymentRepository, options, { where: [{ name: Like(`%${name}%`) }] })
    }

    async findById(id: number): Promise<Payment> {
        return await this.paymentRepository.findOne(id);
    }

    async updateOne(id: number, paymentDto: PaymentUpdateDto): Promise<any> {
        const payment = await this.findById(id);
        if (!payment) throw new BadRequestException()
        return this.paymentRepository.save(Object.assign(payment, paymentDto))
    }

    async deleteOne(id: number): Promise<any> {
        return await this.paymentRepository.delete(id);
    }
}
