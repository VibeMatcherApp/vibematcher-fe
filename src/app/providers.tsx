'use client';

import { PrivyProvider } from "@privy-io/react-auth";
import {toSolanaWalletConnectors} from "@privy-io/react-auth/solana";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true
});

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {walletChainType: 'solana-only'},
        externalWallets: {
          solana: {connectors: solanaConnectors}
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
} 