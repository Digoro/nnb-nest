import { User } from 'src/user/model/user.interface';

export class Product {
    id: number;
    title: string;
    price: number;
    programs: string;
    host: User;
}
