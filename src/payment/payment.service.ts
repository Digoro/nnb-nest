import { BadRequestException, HttpService, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as FormData from 'form-data';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Payment } from 'src/payment/model/payment.entity';
import { PaginationSearchDto } from 'src/shared/model/dto';
import { SlackMessageType, SlackService } from 'src/shared/service/slack.service';
import { NonMember, User } from 'src/user/model/user.entity';
import { getConnection, Repository } from 'typeorm';
import { Product, ProductOption } from './../product/model/product.entity';
import { ErrorInfo } from './../shared/model/error-info';
import { Coupon, UserCouponMap } from './../user/model/user.entity';
import { Order, OrderItem } from './model/order.entity';
import { PaymentCancel } from './model/payment-cancel.entity';
import { NonMemberPaymentCreateDto, PaymentCancelDto, PaymentCreateDto, PaymentSearchDto, PaymentUpdateDto, PaypleCreateDto } from './model/payment.dto';
import { PayMethod, PaypleUserDefine, PG } from './model/payment.interface';
const moment = require('moment');

@Injectable()
export class PaymentService {
    private PAYPLE_CST_ID: string;
    private PAYPLE_CST_KEY: string;
    private PAYPLE_API_URL: string;
    private PAYPLE_REFUND_KEY: string;
    relations = ['order', 'order.product', 'order.product.representationPhotos', 'order.coupon', 'order.orderItems',
        'order.orderItems.productOption', 'order.user', 'order.nonMember'];
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
        private http: HttpService,
        private slackService: SlackService
    ) {
        this.PAYPLE_CST_ID = configService.get('PAYPLPE_CST_ID');
        this.PAYPLE_CST_KEY = configService.get('PAYPLE_CST_KEY');
        this.PAYPLE_API_URL = configService.get('PAYPLE_API_URL');
        this.PAYPLE_REFUND_KEY = configService.get('PAYPLE_REFUND_KEY');
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
        if (paypleDto.PCD_PAY_RST === 'close') {
            const errorInfo = new ErrorInfo('NE003', 'NEI0034', '결제를 취소하였습니다.', paypleDto.PCD_HTTP_REFERER);
            throw new BadRequestException(errorInfo);
        }
        Logger.log("##paypleDto##");
        Logger.log(JSON.stringify(paypleDto));
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
            Logger.log("##moment payAt##");
            Logger.log(moment(paypleDto.PCD_PAY_TIME, 'YYYYMMDDHHmmss').subtract(9, 'hours').toDate());
            payment.payAt = moment(paypleDto.PCD_PAY_TIME, 'YYYYMMDDHHmmss').subtract(9, 'hours').toDate();
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
            const errorInfo = new ErrorInfo('NE002', 'NEI0011', '결제정보를 저장하는데 오류가 발생하였습니다.', e);
            await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
            throw new InternalServerErrorException(errorInfo);
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
            const errorInfo = new ErrorInfo('NE002', 'NEI0012', '결제정보를 저장하는데 오류가 발생하였습니다.', e)
            await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
            throw new InternalServerErrorException(errorInfo);
        } finally {
            await queryRunner.release();
        }
    }

    async payNonMember(dto: NonMemberPaymentCreateDto) {
        const queryRunner = await getConnection().createQueryRunner();
        try {
            await queryRunner.startTransaction();
            const order = new Order();
            const nonMember = dto.order.nonMember.toEntity();
            const newNonMember = await queryRunner.manager.save(NonMember, nonMember);
            const product = await this.productRepository.findOne({ id: dto.order.productId });
            order.nonMember = newNonMember;
            order.product = product;
            order.coupon = null;
            order.point = 0;
            order.orderAt = dto.order.orderAt;
            const newOrder = await queryRunner.manager.save(Order, order);

            for (const item of dto.order.orderItems) {
                const orderItem = new OrderItem();
                orderItem.order = newOrder;
                const productOption = await this.productOptionRepository.findOne({ id: item.productOptionId });
                orderItem.productOption = productOption;
                orderItem.count = item.count;
                await queryRunner.manager.save(OrderItem, orderItem);
            }
            const payment = dto.toEntity2(newOrder);
            const result = await queryRunner.manager.save(Payment, payment);
            await queryRunner.commitTransaction();
            await this.slackService.sendMessage(SlackMessageType.PAYMENT, payment)
            await this.sendAlimtalk(result);
            return result;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            const errorInfo = new ErrorInfo('NE002', 'NEI0012', '결제정보를 저장하는데 오류가 발생하였습니다.', e)
            await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
            throw new InternalServerErrorException(errorInfo);
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
        Logger.log("##payment##");
        Logger.log(payment);
        let receiverPhoneNumber: string;
        let receiverName: string;
        let nickname: string;
        if (payment.order.user) {
            receiverPhoneNumber = payment.order.user.phoneNumber;
            receiverName = payment.order.user.name;
            nickname = payment.order.user.nickname;
        } else {
            receiverPhoneNumber = payment.order.nonMember.phoneNumber;
            receiverName = payment.order.nonMember.name;
            nickname = payment.order.nonMember.name;
        }
        const orderNumber = payment.id;
        const totalPrice = payment.totalPrice;
        const payAt = moment(payment.payAt).add(9, 'hours').format('YYYY년MM월DD일 HH시mm분');
        const productTitle = payment.order.product.title;
        const orderItems = await this.orderItemRepository.find({ where: [{ order: payment.order.id }], relations: ['productOption'] })
        Logger.log("##orderItems##");
        Logger.log(JSON.stringify(orderItems));
        let productOptions = orderItems.map(item => item.productOption.name).join(", ");
        const productOptionDate = moment(orderItems[0].productOption.date).add(9, 'hours').format('YYYY년MM월DD일 HH시mm분');
        Logger.log("##productOptionDate##");
        Logger.log(JSON.stringify(productOptionDate));
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
            const errorInfo = new ErrorInfo('NE002', 'NEI0013', '결제 알림톡 전송에 오류가 발생하였습니다.', response.data)
            await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
            throw new InternalServerErrorException(errorInfo);
        }
        return true;
    }

    async paginate(search: PaginationSearchDto, hostId?: number): Promise<Pagination<Payment>> {
        const options = { page: search.page, limit: search.limit };
        let query = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect("payment.order", 'order')
            .leftJoinAndSelect("order.user", 'user')
            .leftJoinAndSelect("order.nonMember", 'nonMember')
            .leftJoinAndSelect('order.product', 'product')
            .leftJoin('product.host', 'host')
            .leftJoinAndSelect('order.coupon', 'coupon')
            .leftJoinAndSelect('product.representationPhotos', 'representationPhotos')
            .leftJoinAndSelect('order.orderItems', 'orderItems')
            .leftJoinAndSelect('orderItems.productOption', 'productOption')
            .leftJoinAndSelect('payment.paymentCancel', 'paymentCancel')
            .orderBy('payment.payAt', 'DESC')
        if (hostId) query = query.where('host.id = :hostId', { hostId })
        const payments = await paginate<Payment>(query, options)
        return payments;
    }

    async paginateByUser(userId: number, dto: PaymentSearchDto): Promise<Pagination<Payment>> {
        const options = { page: dto.page, limit: dto.limit };
        const query = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect("payment.order", 'order')
            .leftJoinAndSelect("order.user", 'user')
            .leftJoinAndSelect('order.product', 'product')
            .leftJoinAndSelect('order.coupon', 'coupon')
            .leftJoinAndSelect('product.representationPhotos', 'representationPhotos')
            .leftJoinAndSelect('order.orderItems', 'orderItems')
            .leftJoinAndSelect('orderItems.productOption', 'productOption')
            .leftJoinAndSelect('payment.reviews', 'reviews')
            .where('user.id = :userId', { userId })
            .orderBy('payment.payAt', 'DESC')
        if (dto.isLast) {
            query.andWhere('productOption.date < :now', { now: new Date() })
        } else {
            query.andWhere('productOption.date > :now', { now: new Date() })
        }
        const payments = await paginate<Payment>(query, options)
        return payments;
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
        if (!payment) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0029', '존재하지 않습니다.'))
        return this.paymentRepository.save(Object.assign(payment, paymentDto))
    }

    async deleteOne(id: number): Promise<any> {
        return await this.paymentRepository.delete(id);
    }

    async cancelPayple(dto: PaymentCancelDto): Promise<any> {
        const payment = await this.paymentRepository.findOne(dto.payment, { relations: ['order', 'order.user', 'order.nonMember', 'order.coupon'] });
        if (payment.order.user) {
            const auth = await this.authPayple('PCD_PAYCANCEL_FLAG');
            const authKey = auth.AuthKey;
            const cstId = auth.cst_id;
            const custKey = auth.custKey;
            const host = auth.PCD_PAY_HOST;
            const url = auth.PCD_PAY_URL;
            const data = {
                PCD_CST_ID: cstId,
                PCD_CUST_KEY: custKey,
                PCD_AUTH_KEY: authKey,
                PCD_REFUND_KEY: this.PAYPLE_REFUND_KEY,
                PCD_PAYCANCEL_FLAG: 'Y',
                PCD_PAY_OID: payment.pgOrderId,
                PCD_PAY_DATE: moment().format('YYYYMMDD'),
                PCD_REFUND_TOTAL: dto.refundPrice
            }
            const headers = { referer: this.configService.get('SITE_HOST') }
            const result = await this.http.post(`${host}${url}`, data, { headers }
            ).toPromise();

            if (result.data.PCD_PAY_RST === 'success') {
                const cancel = await this.cancel(dto, result.data.PCD_REFUND_TOTAL, payment);
                return cancel;
            } else {
                const errorInfo = new ErrorInfo('NE002', 'NEI0006', '결제 취소가 실패하였습니다.', result.data.PCD_PAY_MSG)
                throw new BadRequestException(errorInfo);
            }
        } else {
            const cancel = await this.cancel(dto, dto.refundPrice, payment);
            return cancel;
        }
    }

    async cancel(dto: PaymentCancelDto, refundPrice: number, payment: Payment) {
        const queryRunner = await getConnection().createQueryRunner();
        try {
            await queryRunner.startTransaction();
            const cancel = new PaymentCancel();
            cancel.reason = dto.reason;
            cancel.refundPrice = refundPrice;
            cancel.cancelAt = new Date();
            cancel.refundCoupon = dto.refundCoupon;
            cancel.refundPoint = dto.refundPoint;
            cancel.payment = payment;
            const newCancel = await queryRunner.manager.save(PaymentCancel, cancel);
            if (payment.order.user) {
                if (dto.refundCoupon && payment.order.coupon) {
                    const coupon = payment.order.coupon;
                    const user = payment.order.user;
                    const map = await queryRunner.manager.findOne(UserCouponMap, { user, coupon, isUsed: true });
                    map.isUsed = false
                    await queryRunner.manager.save(UserCouponMap, map);
                }
                if (dto.refundPoint && payment.order.point) {
                    const point = payment.order.point;
                    const user = payment.order.user;
                    user.point = user.point + point;
                    await queryRunner.manager.save(User, user);
                }
            }
            await queryRunner.commitTransaction();
            return newCancel;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            //todo
            const errorInfo = new ErrorInfo('NE002', 'NEI0011', '결제 취소 데이터를 저장하는데 오류가 발생했습니다.', e);
            await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
            throw new InternalServerErrorException(errorInfo);
        } finally {
            await queryRunner.release();
        }
    }

    async authPayple(payWork: string): Promise<any> {
        const form = new FormData();
        form.append('cst_id', this.PAYPLE_CST_ID);
        form.append('custKey', this.PAYPLE_CST_KEY);
        if (payWork === 'PCD_PAYCANCEL_FLAG') {
            form.append('PCD_PAYCANCEL_FLAG', 'Y')
        } else if (payWork !== '') {
            form.append('PCD_PAY_WORK', payWork)
        }

        const result = await this.http.post(this.PAYPLE_API_URL, form, {
            headers: { ...form.getHeaders(), referer: this.configService.get('SITE_HOST') }
        }).toPromise();
        return result.data;
    }
}
