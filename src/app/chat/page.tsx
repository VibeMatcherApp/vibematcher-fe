"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/store/auth";
import { getUser } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface MatchedUser {
  id: string;
  avatarUrl: string;
  nickname: string;
  latestMessage: string;
  wallet_address: string; // Added wallet_address property
  chat_id: string; // Added chat_id property
}

interface Agent {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}
export default function ChatPage() {
  const { authenticated } = usePrivy();
  const router = useRouter();
  const { user } = useAuthStore();
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => {
      return fetch("https://agents-api.doodles.app/agents")
        .then((res) => res.json())
        .then((data) => data);
    },
  });
  useEffect(() => {
    const fetchMatchedUsers = async () => {
      if (!user?.wallet_address) {
        console.log("No wallet address found for user:", user);
        return;
      }

      try {
        const currentUser = await getUser(user.wallet_address);
        console.log("Fetched user data:", currentUser);
        console.log("Friends data:", currentUser.friends);

        setMatchedUsers(
          (currentUser.friends || []).map(
            (friend) =>
              ({
                id: friend._id,
                avatarUrl: friend.avatarUrl || "",
                nickname: friend.nickname,
                latestMessage: "Start chatting now!",
                wallet_address: friend.wallet_address, // Ensure wallet_address is mapped
                chat_id: friend.chat_id, // Ensure chat_id is mapped
              } as MatchedUser)
          )
        );
      } catch (error) {
        console.error("Error fetching matched users:", error);
      }
    };

    fetchMatchedUsers();
  }, [user]);

  if (!authenticated || !user) {
    router.push("/");
    return null;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Your Matches</h1>
        <div className="space-y-4">
          {agents?.agents.map((agent: Agent) => {
            return (
              <div
                key={agent.id}
                className="flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push(`/chat/${agent.id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold">
                  {agent.avatar ? (
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    agent.name.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {agent.name}
                  </h2>
                  <p className="text-sm text-gray-600">Start chatting now!</p>
                </div>
              </div>
            );
          })}
          {matchedUsers.map((matchedUser: MatchedUser) => (
            <div
              key={matchedUser.wallet_address}
              className="flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:bg-gray-100 cursor-pointer"
              onClick={() => router.push(`/chat/${matchedUser.chat_id}`)}
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold">
                {matchedUser.avatarUrl ? (
                  <img
                    src={matchedUser.avatarUrl}
                    alt={matchedUser.nickname}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  matchedUser.nickname.charAt(0)
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {matchedUser.nickname}
                </h2>
                <p className="text-sm text-gray-600">Start chatting now!</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
