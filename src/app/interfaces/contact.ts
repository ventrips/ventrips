export interface IContact {
    uid: string,
    displayName: string,
    email: string,
    message: string
}

export class Contact implements IContact {
    constructor(
        public uid: string,
        public displayName: string,
        public email: string,
        public message: string
    ) {  }
}


