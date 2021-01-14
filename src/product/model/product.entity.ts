import { UserEntity } from "src/user/model/user.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BasicEntity } from './../../shared/model/basic.entity';

@Entity({ name: 'products' })
export class ProductEntity extends BasicEntity {
    @Column()
    title: string;

    @Column()
    price: number;

    @Column()
    programs: string;

    @ManyToOne(type => UserEntity, userEntity => userEntity.products)
    @JoinColumn({ name: 'host_id' })
    host: UserEntity;
}