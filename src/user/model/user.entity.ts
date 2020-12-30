import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MeetingEntity } from './../../meeting/model/meeting.entity';
import { Role } from "./user.interface";

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

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @OneToMany(type => MeetingEntity, meetingEntity => meetingEntity.host)
    meetings: MeetingEntity[];
}