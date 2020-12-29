import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./user.interface";
const bcrypt = require('bcrypt');

@Entity({ name: 'user' })
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    role: Role;
}