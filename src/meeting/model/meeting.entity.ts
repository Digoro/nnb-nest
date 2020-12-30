import { UserEntity } from 'src/user/model/user.entity';
import { BeforeInsert, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'meeting' })
export class MeetingEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    price: number;

    @Column()
    program: string;

    @Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP" })
    updatedAt: Date;

    @BeforeInsert()
    updateTimestamp() {
        this.updatedAt = new Date;
    }

    @ManyToOne(type => UserEntity, userEntity => userEntity.meetings)
    host: UserEntity;
}