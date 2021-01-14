import { BaseEntity, BeforeUpdate, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class BasicEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP", name: 'crated_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP", name: 'updated_at' })
    updatedAt: Date;

    @BeforeUpdate()
    updateTimestamp() {
        this.updatedAt = new Date;
    }
}