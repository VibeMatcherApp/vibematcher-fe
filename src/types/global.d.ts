declare module 'moment-timezone' {
    import * as moment from 'moment';
    export = moment;
}

declare global {
  interface Window {
    DecryptionClient?: new (key: string) => {
      decryptCompleteUserData: (data: any) => any
      decryptUsersArray: (arr: any[]) => any[]
      decryptField: (field: any) => any
    }
  }
}
export {}
