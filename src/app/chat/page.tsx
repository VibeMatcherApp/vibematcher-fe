"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/store/auth";
import { getUserMatches } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Match } from "@/types";

interface MatchedUser {
  id: string;
  avatarUrl: string;
  nickname: string;
  latestMessage: string;
  wallet_address: string;
  chat_id: string;
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
  
  // Fetch AI agents
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => {
      return fetch("https://agents-api.doodles.app/agents")
        .then((res) => res.json())
        .then((data) => data);
    },
  });

  // Fetch user matches
  const { data: matchesData, isLoading: matchesLoading, error: matchesError } = useQuery({
    queryKey: ["userMatches", user?.wallet || user?.wallet_address],
    queryFn: () => {
      const walletAddress = user?.wallet || user?.wallet_address;
      return getUserMatches(walletAddress!);
    },
    enabled: !!(user?.wallet || user?.wallet_address),
  });

  // Process match data
  useEffect(() => {
    if (matchesData?.matches) {
      const mappedUsers = matchesData.matches.map((match: Match) => ({
        id: match.chat_id,
        avatarUrl: match.user_info.profile.avatar || "",
        nickname: match.user_info.nickname,
        latestMessage: "Start chatting!",
        wallet_address: match.wallet_address,
        chat_id: match.chat_id,
      }));
      setMatchedUsers(mappedUsers);
    }
  }, [matchesData]);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authenticated || !user) {
      router.push("/");
    }
  }, [authenticated, user, router]);

  // Show loading while checking authentication
  if (!authenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Loading state
  if (agentsLoading || matchesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Error state
  if (matchesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Unable to load match data</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Your Matches</h1>
        
        {/* Matched users list */}
        {matchedUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Matched Users ({matchedUsers.length})</h2>
            <div className="space-y-4">
              {matchedUsers.map((matchedUser) => (
                <div
                  key={matchedUser.wallet_address}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => router.push(`/chat/${matchedUser.chat_id}`)}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold overflow-hidden">
                    {matchedUser.avatarUrl ? (
                      <img
                        src={matchedUser.avatarUrl}
                        alt={matchedUser.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      matchedUser.nickname.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {matchedUser.nickname}
                    </h3>
                    <p className="text-sm text-gray-600">{matchedUser.latestMessage}</p>
                  </div>
                  <div className="text-xs text-gray-400">💬</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI agents list */}
        {agents?.agents && agents.agents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">AI Assistants</h2>
            <div className="space-y-4">
              {agents.agents.map((agent: Agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => router.push(`/chat/${agent.id}`)}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold overflow-hidden">
                    {agent.avatar ? (
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      agent.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-600">Start chatting!</p>
                  </div>
                  <div className="text-xs text-gray-400">🤖</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {matchedUsers.length === 0 && (!agents?.agents || agents.agents.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No matches yet</h3>
            <p className="text-gray-500 mb-6">Explore the discovery page to find your perfect match!</p>
            <button
              onClick={() => router.push("/discover")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Start Exploring
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
