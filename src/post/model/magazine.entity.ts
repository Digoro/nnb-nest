import { Column, Entity, ManyToOne } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";
import { User } from '../../user/model/user.entity';

@Entity({ name: 'magazine' })
export class Magazine extends BasicEntity {
    @Column({ length: 50 })
    title: string;

    @Column({ length: 50 })
    catchphrase: string;

    @Column({ name: 'representation_photo', type: 'text' })
    representationPhoto: string;

    @ManyToOne(() => User, entity => entity.magazines)
    author: User;

    @Column({ type: 'text' })
    contents: string;
}