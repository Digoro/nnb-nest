import { Column, Entity } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";

@Entity({ name: 'auth_sms' })
export class AuthSms extends BasicEntity {
    @Column({ name: 'phone_number' })
    phoneNumber: string;

    @Column({ name: 'auth_number' })
    authNumber: string;
}