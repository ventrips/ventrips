export interface IPost {
    postId: string;
    slugName: string;
    uid: string;
    title: string;
    body: string;
    published: boolean;
    dateEdited: Date;
    dateCreated: Date;
}

export class Post implements IPost {
    postId;
    slugName;
    uid;
    title;
    body;
    published;
    dateEdited;
    dateCreated;
}
