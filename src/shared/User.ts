import { Harbor } from "./Harbor";
import { Job } from "./Job";
import { Position } from "./Position";

export interface User {
    registrationNumber?: String;
    firstName?: String;
    lastName?: String;
    cin?: String;
    birthDate?: string;
    phoneNumber?: string;
    recruitmentDate?: Date;
    startingDate?: Date;
    takePositionFrom?: Date;
    grade?: String;
    employment?: String;
    college?: String;
    position?: Position;
    job?: Job;
    harbor?: Harbor;
    role?: string; //transient
}
