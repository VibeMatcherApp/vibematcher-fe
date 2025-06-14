'use client';

import { PrivyProvider } from "@privy-io/react-auth";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['wallet', 'email', 'twitter'],
        appearance: {
          theme: 'light',
          accentColor: '#064e3b',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
} 