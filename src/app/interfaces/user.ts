export interface IUser {
    uid: string;
    displayName: string;
    photoURL: string;
    email: string;
    role?: string; // “admin”, “editor”, “contributor”, or “member”
    // Stripe customer ID assigned by auth function
    stripeId?: string;
    // Assigned when subscription is started
    subscriptionId?: string;
    status?: string;
    item?: string;
}

export class User implements IUser {
    uid;
    displayName;
    photoURL;
    email;
    role?;
    stripeId?;
    subscriptionId?
    status?;
    item?;
}
