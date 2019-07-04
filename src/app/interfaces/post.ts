import { firestore } from 'firebase';
export interface IPost {
    slug: string;
    uid: string;
    displayName: string;
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
    topic = '';
    title = '';
    description = '';
    image = '';
    body = '';
    created;
    modified;
    publish = true;
}
