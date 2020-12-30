import { Meeting } from "src/meeting/model/meeting.interface";

export interface User {
    id?: number;
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    meetings?: Meeting[];
}

export enum Role {
    ADMIN = 'admin',
    EDITOR = 'editor',
    USER = 'user',
}