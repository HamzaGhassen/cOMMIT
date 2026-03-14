
import { Gender } from 'src/app/enums/Gender';
import { User } from './User';

export interface Agent{
    id? : number;
    user?: User;

    gender?:Gender;
    email? : String;
    phoneNumber? : String;

    username? : String;
    password? : String;
    role? : String;
}
