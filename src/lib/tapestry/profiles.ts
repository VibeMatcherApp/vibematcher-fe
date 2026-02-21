import { tapestryClient, TAPESTRY_API_KEY } from './client';
import type { FindOrCreateResponseSchema, GetProfileDetailsSchema } from 'socialfi';

export async function findOrCreateTapestryProfile(
  walletAddress: string,
  username: string,
  bio?: string
): Promise<FindOrCreateResponseSchema> {
  return tapestryClient.profiles.findOrCreateCreate(
    { apiKey: TAPESTRY_API_KEY },
    {
      walletAddress,
      username,
      bio: bio || '',
      blockchain: 'SOLANA',
      execution: 'FAST_UNCONFIRMED',
    }
  );
}

export async function getTapestryProfile(
  profileId: string
): Promise<GetProfileDetailsSchema> {
  return tapestryClient.profiles.profilesDetail({
    apiKey: TAPESTRY_API_KEY,
    id: profileId,
  });
}

export async function updateTapestryProfile(
  profileId: string,
  data: { username?: string; bio?: string; image?: string }
) {
  return tapestryClient.profiles.profilesUpdate(
    { apiKey: TAPESTRY_API_KEY, id: profileId },
    {
      ...data,
      execution: 'FAST_UNCONFIRMED',
    }
  );
}
