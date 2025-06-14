declare module 'timezone-list' {
  export interface Timezone {
    name: string;
    offset: string;
  }
  
  export const timezones: Timezone[];
} 