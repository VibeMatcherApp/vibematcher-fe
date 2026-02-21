import { SocialFi } from 'socialfi';

const TAPESTRY_API_KEY = process.env.NEXT_PUBLIC_TAPESTRY_API_KEY || '';

export const tapestryClient = new SocialFi({
  baseURL: 'https://api.usetapestry.dev/api/v1',
});

export { TAPESTRY_API_KEY };
