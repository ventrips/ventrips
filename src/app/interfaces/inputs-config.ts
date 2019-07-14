import { firestore } from 'firebase/app';
export interface IInputsConfig {
    string: Array<any>;
    number: Array<any>;
    url: Array<any>;
    quill: Array<any>;
    date: Array<any>;
    boolean: Array<any>;
    disabled: Array<any>;
}

export class InputsConfig implements IInputsConfig {
    string = [];
    number = [];
    url = [];
    quill = [];
    date = [];
    boolean = [];
    disabled = [];
}
