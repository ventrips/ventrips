export interface IPost {
    postId: string;
    uid: string;
    topic: string;
    slug: string;
    title: string;
    description: string;
    image: string;
    body: string;
    published: boolean;
    dateEdited: Date;
    dateCreated: Date;
}

export class Post implements IPost {
    postId;
    uid;
    topic;
    slug;
    title;
    description;
    image;
    body;
    published;
    dateEdited;
    dateCreated;
}
