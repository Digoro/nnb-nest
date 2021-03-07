import { Column, Entity } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";

@Entity({ name: 'auth_sms' })
export class AuthSms extends BasicEntity {
    @Column({ name: 'phone_number' })
    phoneNumber: string;

    @Column({ name: 'auth_number' })
    authNumber: string;
}

@Entity({ name: 'find_password' })
export class FindPassword extends BasicEntity {
    @Column({ name: 'validation_code' })
    validationCode: string;

    @Column()
    email: string;

    @Column({ name: 'expiration_at' })
    expirationAt: Date;
}