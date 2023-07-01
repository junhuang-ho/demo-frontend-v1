import "@rainbow-me/rainbowkit/styles.css";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTheme, PRIMARY_COLOR } from "./Theme";

import {
  connectorsForWallets,
  RainbowKitProvider,
  type Theme,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { zkSyncTestnet } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import {
  coinbaseWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { env } from "~/env.mjs";

const WALLET_CONNECT_ID = "5abe71d647514f366ddc98f3124f0d02";

export interface IWalletContext {
  //
}

export const WalletContext = createContext<IWalletContext>({});

export const useWallet = (): IWalletContext => {
  return useContext(WalletContext);
};

const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { chains, provider, webSocketProvider } = configureChains(
    [zkSyncTestnet],
    [
      alchemyProvider({
        apiKey: "04dmiHrTn8_XEANXUuETMZsNSuZag8ii", //env.NEXT_PUBLIC_ALCHEMY_API_KEY_CLIENT,
      }), // TODO: key exposed, make sure whitelist on alchemy dashboard!!
      publicProvider(),
    ]
  );

  const connectors = connectorsForWallets([
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet({ projectId: WALLET_CONNECT_ID, chains: chains }),
      ],
    },
  ]);

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
    webSocketProvider,
  });

  const contextProvider = {};

  return (
    <WagmiConfig client={wagmiClient}>
      <WalletContext.Provider value={contextProvider}>
        <RainbowKitProvider
          appInfo={{
            appName: "USJ 4",
            // disclaimer: Disclaimer,
          }}
          chains={chains}
          theme={darkTheme({
            accentColor: PRIMARY_COLOR,
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </WalletContext.Provider>
    </WagmiConfig>
  );
};

export default WalletProvider;
