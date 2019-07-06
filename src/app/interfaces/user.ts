import { firestore } from 'firebase/app';
import { Roles } from './roles';
export interface IUser {
    uid?: string;
    displayName?: string;
    photoURL?: string;
    email?: string;
    joined?: firestore.Timestamp,
    roles?: Roles; // admin, editor, subscriber
    // Stripe customer ID assigned by auth function
    stripeId?: string;
    status?: string;
}

export class User implements IUser {
    uid?;
    displayName?;
    photoURL?;
    email?;
    joined?;
    roles?;
    stripeId?;
    status?;
}
