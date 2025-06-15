import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MatchSuccessProps {
  matchedWallet: string;
  username?: string; // Add username property to MatchSuccessProps
  avatarUrl?: string; // Add avatarUrl property to MatchSuccessProps
}

export const MatchSuccess = ({ matchedWallet, username, avatarUrl }: MatchSuccessProps) => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/chat');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const matchedUser = { nickname: username, avatarUrl }; // Use props directly.

  if (!matchedUser) {
    return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="text-center">
        <div className="w-40 h-40 mx-auto bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-2xl font-bold">🎉</span>
        </div>
        <img
          src={matchedUser.avatarUrl}
          alt="Avatar"
          className="w-16 h-16 rounded-full mx-auto mt-4 border-2 border-white"
        />
        <h2 className="text-white text-xl font-bold mt-2">You matched with {matchedUser.nickname}!</h2>
      </div>
    </div>
  );
};
