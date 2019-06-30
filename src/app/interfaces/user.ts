export interface IUser {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    dateJoined: Date;
    role: string; // “admin”, “editor”, “contributor”, or “member”
}

export class User implements IUser {
    uid;
    firstName;
    lastName;
    email;
    dateJoined;
    role;
}
