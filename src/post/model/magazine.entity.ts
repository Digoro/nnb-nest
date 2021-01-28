import { Column, Entity, ManyToOne } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";
import { User } from '../../user/model/user.entity';

@Entity({ name: 'magazine' })
export class Magazine extends BasicEntity {
    @Column({ length: 254 })
    title: string;

    @Column({ length: 254 })
    catchphrase: string;

    @Column({ name: 'representation_photo', length: 254 })
    representationPhoto: string;

    @ManyToOne(() => User, entity => entity.magazine)
    author: User;

    @Column({ length: 254 })
    contents: string;
}