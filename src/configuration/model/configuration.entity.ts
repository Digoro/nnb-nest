import { Column, Entity } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";

@Entity({ name: 'configuration' })
export class Configuration extends BasicEntity {
    @Column()
    key: string;

    @Column()
    value: string;
}