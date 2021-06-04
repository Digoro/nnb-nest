import { Column, Entity } from "typeorm";
import { BasicEntity } from '../../shared/model/basic.entity';

@Entity({ name: 'alliance' })
export class Alliance extends BasicEntity {
    @Column({ length: 1000 })
    key: string;

    @Column({ length: 1000 })
    company: string;

    @Column()
    discountPrice: number;
}
