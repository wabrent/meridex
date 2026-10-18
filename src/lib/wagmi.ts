import { http, createConfig } from 'wagmi';
import { robinhoodChain } from './chains';
import { injected } from 'wagmi/connectors';

/**
 * Wagmi configuration targeting Robinhood Chain.
 * Mock providers keep the terminal fully animated without a wallet.
 */
export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(robinhoodChain.rpcUrls.default.http[0]),
  },
  multiInjectedProviderDiscovery: true,
  ssr: false,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
