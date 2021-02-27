import { Column, Entity } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";
const bcrypt = require('bcrypt');

@Entity({ name: 'configuration' })
export class Configuration extends BasicEntity {
    @Column()
    key: string;

    @Column()
    value: string;
}