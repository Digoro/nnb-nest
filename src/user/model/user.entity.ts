import { Exclude } from "class-transformer";
import { ProductEntity } from "src/product/model/product.entity";
import { BeforeInsert, Column, Entity, OneToMany } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";
import { Gender, Role } from "./user.interface";
const bcrypt = require('bcrypt');

@Entity({ name: 'users' })
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
    points: number;

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

    @OneToMany(type => ProductEntity, productEntity => productEntity.host)
    products: ProductEntity[];

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 12);
    }

    comparePassword(attempPassword: string): boolean {
        return bcrypt.compare(attempPassword, this.password);
    }
}