import { firestore } from 'firebase/app';
export interface IPost {
    slug: string;
    uid: string;
    displayName: string;
    photoURL: string;
    category?: string;
    tags?: Array<string>;
    title: string;
    description: string;
    image: string;
    body: string;
    created: firestore.Timestamp;
    modified: firestore.Timestamp;
    publish: boolean;
}

export class Post implements IPost {
    slug = '';
    uid = '';
    displayName = '';
    photoURL = '';
    category;
    tags;
    title = '';
    description = '';
    image = '';
    body = '';
    created;
    modified;
    publish = true;
}
