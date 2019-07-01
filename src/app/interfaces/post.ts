export interface IPost {
    postId: string;
    uid: string;
    topic: string;
    slug: string;
    title: string;
    description: string;
    image: string;
    body: string;
    created: Date;
    modified: Date;
    published: boolean;
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
    created;
    modified;
    published;
}
