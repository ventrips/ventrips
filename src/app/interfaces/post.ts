import { firestore } from 'firebase/app';
export interface IPost {
    slug: string;
    uid: string;
    displayName: string;
    photoURL: string;
    topic: string;
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
    topic = '';
    title = '';
    description = '';
    image = '';
    body = '';
    created;
    modified;
    publish = true;
}
