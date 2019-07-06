import { firestore } from 'firebase/app';
export interface IRoles {
    subscriber?: boolean;
    editor?: boolean;
    admin?: boolean;
}
export class Roles implements IRoles {
    subscriber?: boolean;
    editor?: boolean;
    admin?: boolean;
}
