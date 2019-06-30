export interface IComment {
    commentId: string;
    uid: string;
    articleId: string;
    body: string;
    dateEdited: Date;
    dateCreated: Date;
}

export class Comment implements IComment {
    commentId;
    uid;
    articleId;
    body;
    dateEdited;
    dateCreated;
}
