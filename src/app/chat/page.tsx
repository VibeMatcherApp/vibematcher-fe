"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/store/auth";
import { getUserMatches, getUserChats, getUserProfile } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Match, UserChat } from "@/types";
import { UserProfileModal } from "@/components/UserProfileModal";

interface MatchedUser {
  id: string;
  avatarUrl: string;
  nickname: string;
  latestMessage: string;
  wallet_address: string;
  chat_id: string;
  timestamp?: string;
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserWallet, setSelectedUserWallet] = useState<string | null>(null);
  
  const userWallet = user?.wallet || user?.wallet_address;

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
    queryKey: ["userMatches", userWallet],
    queryFn: () => getUserMatches(userWallet!),
    enabled: !!userWallet,
  });

  // Fetch user chats for last message preview
  const { data: userChats, isLoading: chatsLoading } = useQuery({
    queryKey: ["userChats", userWallet],
    queryFn: () => getUserChats(userWallet!),
    enabled: !!userWallet,
  });

  // Get selected user's profile for the modal
  const { data: selectedUserProfile } = useQuery({
    queryKey: ['userProfile', selectedUserWallet],
    queryFn: () => getUserProfile(selectedUserWallet!),
    enabled: !!selectedUserWallet && showProfileModal,
  });

  // Process match data and combine with chat data for last messages
  useEffect(() => {
    if (matchesData?.matches && userChats) {
      const mappedUsers = matchesData.matches.map((match: Match) => {
        // Find corresponding chat data for last message
        const chatData = userChats.find((chat: UserChat) => chat.chatId === match.chat_id);
        
        return {
          id: match.chat_id,
          avatarUrl: match.user_info.profile.avatar || "",
          nickname: match.user_info.nickname,
          latestMessage: chatData?.lastMessage?.content || "Start chatting!",
          wallet_address: match.wallet_address,
          chat_id: match.chat_id,
          timestamp: chatData?.lastMessage?.timestamp,
        };
      });
      setMatchedUsers(mappedUsers);
    } else if (matchesData?.matches) {
      // Fallback if userChats is not available
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
  }, [matchesData, userChats]);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authenticated || !user) {
      router.push("/");
    }
  }, [authenticated, user, router]);

  const handleOpenProfile = (wallet: string) => {
    setSelectedUserWallet(wallet);
    setShowProfileModal(true);
  };

  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setSelectedUserWallet(null);
  };

  // Show loading while checking authentication
  if (!authenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Loading state - wait for all essential data before showing content
  if (agentsLoading || matchesLoading || chatsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Calculate if we have completed loading
  const isDataReady = !agentsLoading && !matchesLoading && !chatsLoading;
  const hasMatches = matchedUsers.length > 0;
  const hasAgents = agents?.agents && agents.agents.length > 0;

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
        
        {/* Only show content when data is ready */}
        {isDataReady && (
          <>
            {/* Matched users list */}
            {hasMatches && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Matched Users ({matchedUsers.length})</h2>
                <div className="space-y-4">
                  {matchedUsers.map((matchedUser) => (
                    <div
                      key={matchedUser.wallet_address}
                      className="flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => router.push(`/chat/${matchedUser.chat_id}`)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProfile(matchedUser.wallet_address);
                        }}
                        className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold overflow-hidden hover:bg-gray-300 transition-colors"
                      >
                        {matchedUser.avatarUrl ? (
                          <img
                            src={matchedUser.avatarUrl}
                            alt={matchedUser.nickname}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          matchedUser.nickname.charAt(0).toUpperCase()
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {matchedUser.nickname}
                          </h3>
                          {matchedUser.timestamp && (
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {new Date(matchedUser.timestamp).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{matchedUser.latestMessage}</p>
                      </div>
                      <div className="text-xs text-gray-400">💬</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI agents list */}
            {hasAgents && (
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

            {/* Empty state - only show when we're sure there's no data */}
            {!hasMatches && !hasAgents && (
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
          </>
        )}
      </div>

      {/* Profile modal */}
      {showProfileModal && selectedUserWallet && selectedUserProfile && (
        <UserProfileModal
          nickname={selectedUserProfile.nickname || "Unknown User"}
          tags={selectedUserProfile.tags || { blockchain: ['Unknown'], assetType: ['Unknown'] }}
          tokenDistribution={selectedUserProfile.tokenDistribution || selectedUserProfile.chain_data?.distribution || {}}
          onClose={handleCloseProfile}
        />
      )}
    </div>
  );
}
