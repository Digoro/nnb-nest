import { BadRequestException, HttpService, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as FormData from 'form-data';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Payment } from 'src/payment/model/payment.entity';
import { Coupon, User } from 'src/user/model/user.entity';
import { getConnection, Repository } from 'typeorm';
import { Product, ProductOption } from './../product/model/product.entity';
import { Order, OrderItem } from './model/order.entity';
import { PaymentSearchDto, PaymentUpdateDto, PaypleCreateDto } from './model/payment.dto';
import { PayMethod, PaypleUserDefine, PG } from './model/payment.interface';
const moment = require('moment');

@Injectable()
export class PaymentService {
    private PAYPLE_CST_ID: string;
    private PAYPLE_CST_KEY: string;
    relations = ['order', 'order.product', 'order.product.representationPhotos', 'order.orderItems', 'order.orderItems.productOption', 'order.user'];

    constructor(
        @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(ProductOption) private productOptionRepository: Repository<ProductOption>,
        @InjectRepository(Coupon) private couponRepository: Repository<Coupon>,
        private configService: ConfigService,
        private http: HttpService
    ) {
        this.PAYPLE_CST_ID = configService.get('PAYPLPE_CST_ID');
        this.PAYPLE_CST_KEY = configService.get('PAYPLE_CST_KEY');
    }

    private getPayMethod(payMethod: string): PayMethod {
        switch (payMethod) {
            case 'card': {
                return PayMethod.CARD;
            }
            case 'transfer': {
                return PayMethod.TRANSFER;
            }
        }
    }

    async pay(paypleDto: PaypleCreateDto): Promise<Payment> {
        const queryRunner = await getConnection().createQueryRunner();

        try {
            await queryRunner.startTransaction();
            const userDefine = JSON.parse(decodeURIComponent(paypleDto.PCD_USER_DEFINE1)) as PaypleUserDefine;
            const order = new Order();
            const user = await this.userRepository.findOne({ id: userDefine.userId })
            const product = await this.productRepository.findOne({ id: userDefine.mid })
            const coupon = await this.couponRepository.findOne({ id: userDefine.couponId })
            order.user = user;
            order.product = product;
            order.coupon = coupon;
            order.point = 0;
            order.orderAt = new Date();
            const newOrder = await queryRunner.manager.save(Order, order);

            for (const option of userDefine.options) {
                const o = await this.productOptionRepository.findOne({ id: option.oid })
                const orderItem = new OrderItem();
                orderItem.order = newOrder;
                orderItem.productOption = o;
                orderItem.count = option.optionCount;
                await queryRunner.manager.save(OrderItem, orderItem);
            }

            const payment = new Payment();
            payment.order = newOrder;
            payment.pgName = PG.PAYPLE;
            payment.pgOrderId = paypleDto.PCD_PAY_OID;
            payment.payAt = moment(paypleDto.PCD_PAY_TIME, 'YYYYMMDDHHmmss').toDate();
            payment.totalPrice = +paypleDto.PCD_PAY_TOTAL;
            payment.payMethod = this.getPayMethod(paypleDto.PCD_PAY_TYPE);
            payment.payPrice = +paypleDto.PCD_PAY_TOTAL;
            payment.payCommissionPrice = 0;
            payment.result = paypleDto.PCD_PAY_RST === 'success';
            payment.resultMessage = paypleDto.PCD_PAY_MSG;
            payment.cardName = paypleDto.PCD_PAY_CARDNAME;
            payment.cardNum = paypleDto.PCD_PAY_CARDNUM;
            payment.cardReceipt = paypleDto.PCD_PAY_CARDRECEIPT;
            payment.bankName = paypleDto.PCD_PAY_BANKNAME;
            payment.bankNum = paypleDto.PCD_PAY_BANKNUM;

            queryRunner.commitTransaction();
            return await queryRunner.manager.save(Payment, payment);
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException();
        } finally {
            await queryRunner.release();
        }
    }

    async paginate(search: PaymentSearchDto): Promise<Pagination<Payment>> {
        return await paginate<Payment>(this.paymentRepository, search)
    }

    async paginateByUserId(userId: number, search: PaymentSearchDto): Promise<Pagination<Payment>> {
        const options = { page: search.page, limit: search.limit };
        return await paginate(this.paymentRepository, options, {
            where: [{}],
            relations: this.relations
        })
    }

    async findById(id: number): Promise<Payment> {
        return await this.paymentRepository.findOne(id, {
            relations: this.relations
        });
    }

    async updateOne(id: number, paymentDto: PaymentUpdateDto): Promise<any> {
        const payment = await this.findById(id);
        if (!payment) throw new BadRequestException()
        return this.paymentRepository.save(Object.assign(payment, paymentDto))
    }

    async deleteOne(id: number): Promise<any> {
        return await this.paymentRepository.delete(id);
    }

    async authPayple(payWork: string): Promise<any> {
        const cstId = this.PAYPLE_CST_ID;
        const custKey = this.PAYPLE_CST_KEY;
        // const cstId = 'test';
        // const custKey = 'abcd1234567890';
        const url = "https://testcpay.payple.kr/php/auth.php";

        const form = new FormData();
        form.append('cst_id', cstId);
        form.append('custKey', custKey);
        if (payWork === 'PCD_PAYCANCEL_FLAG') {
            form.append('PCD_PAYCANCEL_FLAG', 'Y')
        } else if (payWork !== '') {
            form.append('PCD_PAY_WORK', payWork)
        }

        const result = await this.http.post(url, form, {
            headers: {
                ...form.getHeaders(),
                referer: 'localhost:8080'
            }
        }).toPromise();
        return result.data;
    }
}
