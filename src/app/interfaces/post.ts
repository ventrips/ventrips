export interface IPost {
    slug: string;
    uid: string;
    displayName: string;
    topic: string;
    title: string;
    description: string;
    image: string;
    body: string;
    created: any;
    modified: any;
    published: boolean;
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
    published = true;
}
