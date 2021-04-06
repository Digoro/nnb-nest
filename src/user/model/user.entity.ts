import { Exclude } from "class-transformer";
import { Min } from "class-validator";
import { Order } from "src/payment/model/order.entity";
import { Product, ProductRequest, ProductReview } from "src/product/model/product.entity";
import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Magazine } from '../../post/model/magazine.entity';
import { BasicEntity } from "../../shared/model/basic.entity";
import { Gender, Role } from "./user.interface";
const bcrypt = require('bcrypt');

@Entity({ name: 'user' })
export class User extends BasicEntity {
    @Column({ unique: true, length: 254 })
    email: string;

    @Exclude()
    @Column({ nullable: true, type: 'text' })
    password: string;

    @Column({ nullable: true, length: 20 })
    name: string;

    @Column({ nullable: true, unique: true, length: 15, name: 'phone_number' })
    phoneNumber: string;

    @Column({ nullable: true, length: 254 })
    provider: string;

    @Column({ nullable: true, type: 'text', name: 'thirdparty_id' })
    thirdpartyId: string;

    @Column({ default: 0 })
    point: number;

    @Column({ nullable: true })
    birthday: Date;

    @Column({ length: 20 })
    nickname: string;

    @Column({ nullable: true, type: 'enum', enum: Gender, default: Gender.MALE })
    gender: Gender;

    @Column({ name: 'profile_photo', type: 'text', default: 'https://nonunbub.s3.ap-northeast-2.amazonaws.com/users/empty_profile.png' })
    profilePhoto: string;

    @Column({ nullable: true, length: 30 })
    catchphrase: string;

    @Column({ nullable: true, length: 500 })
    introduction: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @OneToMany(() => Product, productEntity => productEntity.host)
    products: Product[];

    @OneToMany(() => UserCouponMap, map => map.user)
    userCouponMap: UserCouponMap[];

    coupons: Coupon[];

    @OneToMany(() => UserProductLike, entity => entity.user)
    productLikes: UserProductLike[];

    @OneToMany(() => UserUserLike, entity => entity.followingId)
    followingLikes: UserUserLike[];

    @OneToMany(() => UserUserLike, entity => entity.followedId)
    followedLikes: UserUserLike[];

    @OneToMany(() => ProductRequest, entity => entity.user)
    productRequests: ProductRequest[];

    @OneToMany(() => ProductReview, entity => entity.user)
    productReviews: ProductReview[];

    @OneToMany(() => Magazine, entity => entity.author)
    magazines: Magazine[];

    @OneToMany(() => Order, entity => entity.user)
    orders: Order[];

    @BeforeInsert()
    async beforeInsert() {
        if (this.password) this.password = await bcrypt.hash(this.password, 12);
    }

    comparePassword(attempPassword: string): boolean {
        return bcrypt.compare(attempPassword, this.password);
    }
}

@Entity({ name: 'coupon' })
export class Coupon extends BasicEntity {
    @Column({ length: 50 })
    name: string;

    @Column({ length: 500 })
    contents: string;

    @Column()
    @Min(0)
    price: number;

    @Column()
    expireDuration: Date;

    @OneToMany(() => UserCouponMap, map => map.coupon)
    userCouponMap: UserCouponMap[];

    @OneToMany(() => Order, entity => entity.coupon)
    orders: Order[];
}

@Entity({ name: 'user_coupon_map' })
export class UserCouponMap extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @PrimaryColumn()
    userId: number;
    @ManyToOne(() => User, user => user.userCouponMap)
    @JoinColumn({ name: 'userId' })
    user: User;

    @PrimaryColumn()
    couponId: number;
    @ManyToOne(() => Coupon, coupon => coupon.userCouponMap)
    @JoinColumn({ name: 'couponId' })
    coupon: Coupon;

    @Column({ name: 'is_used', default: false })
    isUsed: boolean;
}

@Entity({ name: 'user_user_like' })
export class UserUserLike extends BasicEntity {
    @ManyToOne(() => User, entitiy => entitiy.followingLikes)
    @JoinColumn({ name: 'following_id' })
    followingId: number;

    @ManyToOne(() => User, entitiy => entitiy.followedLikes)
    @JoinColumn({ name: 'followed_id' })
    followedId: number;
}

@Entity({ name: 'user_product_like' })
export class UserProductLike extends BasicEntity {
    @PrimaryColumn()
    userId: number;
    @ManyToOne(() => User, entity => entity.productLikes)
    @JoinColumn({ name: 'userId' })
    user: User;

    @PrimaryColumn()
    productId: number;
    @ManyToOne(() => Product, entity => entity.userLikes, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;
}