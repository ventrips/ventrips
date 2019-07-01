export interface IComment {
    commentId: string;
    uid: string;
    articleId: string;
    body: string;
    modified: Date;
    created: Date;
}

export class Comment implements IComment {
    commentId;
    uid;
    articleId;
    body;
    modified;
    created;
}
