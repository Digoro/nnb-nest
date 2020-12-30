import { User } from 'src/user/model/user.interface';
export interface Meeting {
    id?: number;
    title?: string;
    price?: number;
    program?: string;
    createdAt?: Date;
    updatedAt?: Date;
    host: User;
}