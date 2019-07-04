import { firestore } from 'firebase/app';
export interface IComment {
    commentId: string;
    uid: string;
    articleId: string;
    body: string;
    modified: firestore.Timestamp;
    created: firestore.Timestamp;
}

export class Comment implements IComment {
    commentId;
    uid;
    articleId;
    body;
    modified;
    created;
}
