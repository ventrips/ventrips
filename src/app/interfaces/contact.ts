import { firestore } from 'firebase/app';

export interface IContact {
    uid: string,
    displayName: string,
    email: string,
    message: string,
    date: firestore.Timestamp;
}

export class Contact implements IContact {
    constructor(
        public uid: string,
        public displayName: string,
        public email: string,
        public message: string,
        public date: firestore.Timestamp
    ) {  }
}


