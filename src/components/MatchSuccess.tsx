'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MatchSuccessProps {
  matchedWallet: string;
  username?: string;
  avatarUrl?: string;
  chatId?: string;
  onClose?: () => void;
}

export const MatchSuccess = ({ 
  matchedWallet, 
  username = 'Anonymous', 
  avatarUrl, 
  chatId,
  onClose 
}: MatchSuccessProps) => {
  const router = useRouter();
  const [showAnimation, setShowAnimation] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animations in sequence
    const animationTimer = setTimeout(() => setShowAnimation(true), 100);
    const contentTimer = setTimeout(() => setShowContent(true), 300);

    // Auto redirect after animation
    const redirectTimer = setTimeout(() => {
      if (chatId) {
        router.push(`/chat/${chatId}`);
      } else {
        router.push('/chat');
      }
    }, 3000);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(contentTimer);
      clearTimeout(redirectTimer);
    };
  }, [router, chatId]);

  const handleStartChatting = () => {
    if (chatId) {
      router.push(`/chat/${chatId}`);
    } else {
      router.push('/chat');
    }
  };

  const handleContinueDiscovering = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`
          bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden
          transform transition-all duration-500 ease-out
          ${showAnimation ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}
      >
        {/* Celebration Animation Background */}
        <div className="relative bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 p-8 text-center">
          {/* Animated particles/sparkles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute w-2 h-2 bg-white rounded-full
                  animate-bounce opacity-80
                  ${showAnimation ? 'animate-pulse' : ''}
                `}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>

          {/* Main celebration content */}
          <div className="relative z-10">
            {/* Large celebration emoji with animation */}
            <div 
              className={`
                text-6xl mb-4 inline-block
                transform transition-all duration-700 ease-out
                ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
              `}
            >
              🎉
            </div>

            {/* Match announcement */}
            <div 
              className={`
                transform transition-all duration-500 ease-out delay-200
                ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
              `}
            >
              <h1 className="text-2xl font-bold text-white mb-2">
                It's a Match!
              </h1>
              <p className="text-white/90 text-lg">
                You and {username} liked each other
              </p>
            </div>
          </div>
        </div>

        {/* User information section */}
        <div 
          className={`
            p-6 bg-white
            transform transition-all duration-500 ease-out delay-300
            ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
          `}
        >
          {/* User avatar and info */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {/* Animated ring around avatar */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping"></div>
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{username}</h2>
            <p className="text-sm text-gray-600 mt-1">Start your conversation now!</p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStartChatting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Start Chatting
              </span>
            </button>
            
            <button
              onClick={handleContinueDiscovering}
              className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-full hover:bg-gray-200 transition-all duration-200"
            >
              Keep Discovering
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-center text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Redirecting to chat in a few seconds...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
