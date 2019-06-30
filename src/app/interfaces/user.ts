export interface IUser {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    dateJoined: Date;
    role: string;
}

export class User implements IUser {
    uid;
    firstName;
    lastName;
    email;
    dateJoined;
    role;
}
