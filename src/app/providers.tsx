'use client';

import { PrivyProvider } from "@privy-io/react-auth";
import {toSolanaWalletConnectors} from "@privy-io/react-auth/solana";
import { EthereumWalletConnector } from "@privy-io/react-auth";
import { ethers, Provider } from 'ethers';
import { useWallets } from '@privy-io/react-auth';
import React, { createContext, useContext, useMemo } from 'react';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true
});

// Create a context for the ethers provider
export const EthersProviderContext = createContext<Provider | null>(null);

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  // Memoize the ethers provider so it's not recreated on every render
  const ethersProvider = useMemo(() => {
    // Use Sepolia testnet RPC
    return ethers.getDefaultProvider('sepolia');
  }, []);
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {walletChainType: 'ethereum-only'},
      }}
    >
      <EthersProviderContext.Provider value={ethersProvider}>
        {children}
      </EthersProviderContext.Provider>
    </PrivyProvider>
  );
}

export function useWalletProvider() {
  const { wallets } = useWallets();
  
  const provider = useMemo(async () => {
    if (!wallets || wallets.length === 0) {
      return null;
    }
    
    const wallet = wallets[0];
    
    // Always use BrowserProvider for wallet interactions (has getSigner)
    return new ethers.BrowserProvider(await wallet.getEthereumProvider());
  }, [wallets]);

  return provider;
}

export function useEthersProvider(chainId = 11155111) {
  const { wallets } = useWallets();
  
  const provider = useMemo(() => {
    const wallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
    
    if (!wallet) return null;
    
    // Public RPC endpoints for Sepolia (no API key required)
    const rpcUrls: { [key: number]: string } = {
      1: 'https://cloudflare-eth.com', // Mainnet
      11155111: 'https://rpc.sepolia.org', // Sepolia - public RPC
      // Alternative Sepolia public RPCs:
      // 11155111: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
      // 11155111: 'https://sepolia.gateway.tenderly.co',
      137: 'https://polygon-rpc.com', // Polygon
      80001: 'https://rpc-mumbai.maticvigil.com', // Mumbai
    };
    return new ethers.JsonRpcProvider(rpcUrls[chainId]);
    
    // Fallback to wallet provider
  }, [wallets, chainId]);

  return provider;
}

// Dedicated Sepolia hook
export function useSepoliaProvider() {
  return useEthersProvider(11155111);
}