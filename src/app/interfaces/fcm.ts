export interface IFcm {
    title: string;
    body: string;
    icon: string;
    link: string;
}

export class Fcm implements IFcm {
    title = '';
    body = '';
    icon = '';
    link = '';
}
