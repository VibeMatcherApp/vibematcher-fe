import { tapestryClient, TAPESTRY_API_KEY } from './client';
import type { FollowWithGlobalCountsSchema } from 'socialfi';

export async function followUser(
  startId: string,
  endId: string
) {
  return tapestryClient.followers.postFollowers(
    { apiKey: TAPESTRY_API_KEY },
    { startId, endId }
  );
}

export async function unfollowUser(
  startId: string,
  endId: string
) {
  return tapestryClient.followers.removeCreate(
    { apiKey: TAPESTRY_API_KEY },
    { startId, endId }
  );
}

export async function getSocialCounts(
  walletAddress: string
): Promise<FollowWithGlobalCountsSchema> {
  return tapestryClient.wallets.socialCountsList({
    apiKey: TAPESTRY_API_KEY,
    address: walletAddress,
  });
}

export async function checkIsFollowing(
  startId: string,
  endId: string
): Promise<boolean> {
  const result = await tapestryClient.followers.stateList({
    apiKey: TAPESTRY_API_KEY,
    startId,
    endId,
  });
  return result.isFollowing;
}
