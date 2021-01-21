import { Exclude } from "class-transformer";
import { ProductEntity } from "src/product/model/product.entity";
import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";
import { Gender, Role } from "./user.interface";
const bcrypt = require('bcrypt');

@Entity({ name: 'user' })
export class UserEntity extends BasicEntity {
    @Column({ unique: true, length: 254 })
    email: string;

    @Exclude()
    @Column({ nullable: true, length: 254 })
    password: string;

    @Column({ nullable: true, length: 254 })
    name: string;

    @Column({ nullable: true, unique: true, length: 15, name: 'phone_number' })
    phoneNumber: string;

    @Column({ nullable: true, length: 254 })
    provider: string;

    @Column({ nullable: true, length: 254, name: 'thirdparty_id' })
    thirdpartyId: string;

    @Column({ default: 0 })
    point: number;

    @Column({ nullable: true })
    birthday: Date;

    @Column({ length: 254 })
    nickname: string;

    @Column({ nullable: true, type: 'enum', enum: Gender, default: Gender.MALE })
    gender: Gender;

    @Column({ name: 'profile_photo', length: 254 })
    profilePhoto: string;

    @Column({ nullable: true, length: 254 })
    catchphrase: string;

    @Column({ nullable: true, length: 254 })
    introduction: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @OneToMany(() => ProductEntity, productEntity => productEntity.host)
    products: ProductEntity[];

    @ManyToMany(() => CouponEntity)
    @JoinTable({
        name: 'user_coupon_map',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'coupon_id', referencedColumnName: 'id' }
    })
    coupons: CouponEntity[];

    @OneToMany(() => UserProductLikeEntity, entity => entity.userId)
    productLikes: UserProductLikeEntity[];

    @OneToMany(() => UserUserLikeEntity, entity => entity.followingId)
    followingLikes: UserUserLikeEntity[];

    @OneToMany(() => UserUserLikeEntity, entity => entity.followedId)
    followedLikes: UserUserLikeEntity[];

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 12);
    }

    comparePassword(attempPassword: string): boolean {
        return bcrypt.compare(attempPassword, this.password);
    }
}

@Entity({ name: 'coupon' })
export class CouponEntity extends BasicEntity {
    @Column({ length: 254 })
    name: string;

    @Column({ length: 254 })
    contents: string;

    @Column()
    price: number;

    @Column()
    expireDuration: Date;
}

@Entity({ name: 'user_user_like' })
export class UserUserLikeEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => UserEntity, entitiy => entitiy.followingLikes)
    @JoinColumn({ name: 'following_id' })
    followingId: number;

    @ManyToOne(() => UserEntity, entitiy => entitiy.followedLikes)
    @JoinColumn({ name: 'followed_id' })
    followedId: number;
}

@Entity({ name: 'user_product_like' })
export class UserProductLikeEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => UserEntity, entitiy => entitiy.productLikes)
    @JoinColumn({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => ProductEntity, entity => entity.userLikes)
    @JoinColumn({ name: 'product_id' })
    productId: number;
}