import { BadRequestException, HttpService, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as FormData from 'form-data';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Payment } from 'src/payment/model/payment.entity';
import { PaginationSearchDto } from 'src/shared/model/dto';
import { User } from 'src/user/model/user.entity';
import { getConnection, Repository } from 'typeorm';
import { Product, ProductOption } from './../product/model/product.entity';
import { Coupon, UserCouponMap } from './../user/model/user.entity';
import { Order, OrderItem } from './model/order.entity';
import { PaymentCreateDto, PaymentUpdateDto, PaypleCreateDto } from './model/payment.dto';
import { PayMethod, PaypleUserDefine, PG } from './model/payment.interface';
const moment = require('moment');

@Injectable()
export class PaymentService {
    private PAYPLE_CST_ID: string;
    private PAYPLE_CST_KEY: string;
    private PAYPLE_API_URL: string;
    relations = ['order', 'order.product', 'order.product.representationPhotos', 'order.coupon', 'order.orderItems', 'order.orderItems.productOption', 'order.user'];
    private readonly logger = new Logger();

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
        this.PAYPLE_API_URL = configService.get('PAYPLE_API_URL');
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

            if (coupon) {
                const userCoupon = await queryRunner.manager.findOne(UserCouponMap, { userId: user.id, couponId: coupon.id });
                userCoupon.isUsed = true;
                await queryRunner.manager.save(UserCouponMap, userCoupon);
            }

            for (const option of userDefine.options) {
                const o = await this.productOptionRepository.findOne({ id: option.id })
                const orderItem = new OrderItem();
                orderItem.order = newOrder;
                orderItem.productOption = o;
                orderItem.count = option.count;
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

            const result = await queryRunner.manager.save(Payment, payment);
            await queryRunner.commitTransaction();
            return result;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException();
        } finally {
            await queryRunner.release();
        }
    }

    async join(dto: PaymentCreateDto) {
        const queryRunner = await getConnection().createQueryRunner();

        try {
            await queryRunner.startTransaction();

            const order = new Order();
            const user = await this.userRepository.findOne({ id: dto.order.userId });
            const product = await this.productRepository.findOne({ id: dto.order.productId });
            const coupon = await this.couponRepository.findOne({ id: dto.order.couponId });
            order.user = user;
            order.product = product;
            order.coupon = coupon;
            order.point = dto.order.point;
            order.orderAt = dto.order.orderAt;
            const newOrder = await this.orderRepository.save(order);

            for (const item of dto.order.orderItems) {
                const orderItem = new OrderItem();
                orderItem.order = newOrder;
                const productOption = await this.productOptionRepository.findOne({ id: item.productOptionId });
                orderItem.productOption = productOption;
                orderItem.count = item.count;
                await this.orderItemRepository.save(orderItem);
            }

            const payment = dto.toEntity(newOrder);
            const result = await this.paymentRepository.save(payment);
            await queryRunner.commitTransaction();
            return result;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException();
        } finally {
            await queryRunner.release();
        }
    }

    async getAlimtalkToken() {
        const url = "https://kakaoapi.aligo.in/akv10/token/create/30/s/"
        const form = new FormData();
        form.append('apikey', this.configService.get('ALIMTALK_API_KEY'))
        form.append('userid', this.configService.get('ALIMTALK_USER_ID'))
        const response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise()
        return response.data.token;
    }

    async sendAlimtalk(payment: Payment, receiver?: string) {
        const receiverPhoneNumber = payment.order.user.phoneNumber;
        const receiverName = payment.order.user.name;
        const nickname = payment.order.user.nickname;
        const orderNumber = payment.id;
        const totalPrice = payment.totalPrice;
        const payAt = moment(payment.payAt).format('YYYY년MM월DD일 HH시mm분');
        const productTitle = payment.order.product.title;
        const orderItems = await this.orderItemRepository.find({ where: [{ order: payment.order.id }], relations: ['productOption'] })
        let productOptions = orderItems.map(item => item.productOption.name).join(", ");
        let productOptionDate;
        if (orderItems.length > 0) productOptionDate = moment(orderItems[0].productOption.date).format('YYYY년MM월DD일 HH시mm분');
        else {
            productOptions = '홈 - 내모임에서 확인해주세요.'
            productOptionDate = '홈 - 내모임에서 확인해주세요.'
        }
        const productId = payment.order.product.id;
        const token = await this.getAlimtalkToken();
        const url = "https://kakaoapi.aligo.in/akv10/alimtalk/send/"
        const temp = "TD_0323"
        const subject = "노는법 예약확인 메시지"
        const message = `[노는법 참여 확정]
${nickname}님의 노는법 참여 예약이 완료되었습니다.

▶결제정보◀
주문 번호: ${orderNumber}
결제 금액: ${totalPrice}
결제일: ${payAt}

▶예약정보◀
상품명: ${productTitle}
옵션명: ${productOptions}
참여일: ${productOptionDate}

* 유의사항과 준비물을 꼭 확인하세요!
* 예약 취소시 환불 규정에 따라 수수료가 부과될 수 있습니다.
* 문의하실 내용이 있으시면 노는법 담당자에게 연락바랍니다.
* 고객님의 오늘 가장 젊은 순간을, 노는법이 함께 하겠습니다.
* 담당자 연락처: 010-6687-1917`
        const sender = this.configService.get('ALIMTALK_SENDER_PHONE')
        const button = {
            button: [{
                name: "예약한 상품 확인하기",
                linkType: "WL",
                linkTypeName: "웹링크",
                linkMo: `https://nonunbub.com/tabs/meeting-detail/${productId}`,
                linkPc: `https://nonunbub.com/tabs/meeting-detail/${productId}`
            }]
        };
        const form = new FormData();
        form.append('apikey', this.configService.get('ALIMTALK_API_KEY'));
        form.append('userid', this.configService.get('ALIMTALK_USER_ID'));
        form.append('token', token);
        form.append('senderkey', this.configService.get('ALIMTALK_SENDER_KEY'));
        form.append('tpl_code', temp);
        form.append('sender', sender);
        receiver ? form.append('receiver_1', receiver) : form.append('receiver_1', receiverPhoneNumber);
        form.append('recvname_1', receiverName);
        form.append('subject_1', subject);
        form.append('message_1', message);
        form.append('button_1', JSON.stringify(button));
        form.append('failover', "Y");
        form.append('fsubject_1', subject);
        form.append('fmessage_1', message);
        form.append('testMode', "N");
        const response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise();
        const code = response.data.code;
        if (code === -99) {
            throw new InternalServerErrorException();
        }
        return true;
    }

    async paginate(search: PaginationSearchDto, hostId?: number): Promise<Pagination<Payment>> {
        const options = { page: search.page, limit: search.limit };
        let query = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect("payment.order", 'order')
            .leftJoinAndSelect("order.user", 'user')
            .leftJoinAndSelect('order.product', 'product')
            .leftJoin('product.host', 'host')
            .leftJoinAndSelect('order.coupon', 'coupon')
            .leftJoinAndSelect('product.representationPhotos', 'representationPhotos')
            .leftJoinAndSelect('order.orderItems', 'orderItems')
            .leftJoinAndSelect('orderItems.productOption', 'productOption')
            .orderBy('payment.payAt', 'DESC')
        if (hostId) query = query.where('host.id = :hostId', { hostId })
        const products = await paginate<Payment>(query, options)
        return products;
    }

    async paginateByUser(userId: number, search: PaginationSearchDto): Promise<Pagination<Payment>> {
        const options = { page: search.page, limit: search.limit };
        const products = await paginate<Payment>(this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect("payment.order", 'order')
            .leftJoinAndSelect("order.user", 'user')
            .leftJoinAndSelect('order.product', 'product')
            .leftJoinAndSelect('order.coupon', 'coupon')
            .leftJoinAndSelect('product.representationPhotos', 'representationPhotos')
            .leftJoinAndSelect('order.orderItems', 'orderItems')
            .leftJoinAndSelect('orderItems.productOption', 'productOption')
            .where('user.id = :userId', { userId })
            .orderBy('payment.payAt', 'DESC'), options)
        return products;
    }

    async findOneByProduct(productId: number, hostId: number): Promise<number> {
        return await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoin("payment.order", 'order')
            .leftJoin("order.product", 'product')
            .leftJoin("product.host", 'host')
            .where('product.id = :productId', { productId })
            .andWhere('host.id = :hostId', { hostId })
            .getCount()
    }

    async findOneByOwner(id: number): Promise<Payment> {
        return await this.paymentRepository.findOne(id, {
            relations: this.relations
        });
    }

    async updateOne(id: number, paymentDto: PaymentUpdateDto): Promise<any> {
        const payment = await this.findOneByOwner(id);
        if (!payment) throw new BadRequestException()
        return this.paymentRepository.save(Object.assign(payment, paymentDto))
    }

    async deleteOne(id: number): Promise<any> {
        return await this.paymentRepository.delete(id);
    }

    async authPayple(payWork: string): Promise<any> {
        const cstId = this.PAYPLE_CST_ID;
        const custKey = this.PAYPLE_CST_KEY;
        const url = this.PAYPLE_API_URL;

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
                referer: this.configService.get('SITE_HOST')
            }
        }).toPromise();
        return result.data;
    }
}
