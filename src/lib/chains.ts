import { defineChain } from 'viem';

/**
 * Robinhood Chain — EVM chain parameters for Meridex.
 *
 * All values are environment-overridable (see .env.example) so the app can be
 * pointed at the live Robinhood Chain testnet/mainnet without code changes.
 */
const chainId = Number(import.meta.env.VITE_RH_CHAIN_ID ?? 4663);
const rpcUrl = (import.meta.env.VITE_RH_RPC_URL as string | undefined) ?? 'https://rpc.testnet.robinhood.example';
const explorerUrl =
  (import.meta.env.VITE_RH_EXPLORER_URL as string | undefined) ?? 'https://explorer.testnet.robinhood.example';
const symbol = (import.meta.env.VITE_RH_CURRENCY_SYMBOL as string | undefined) ?? 'ETH';
const chainName = (import.meta.env.VITE_RH_CHAIN_NAME as string | undefined) ?? 'Robinhood Chain';

export const robinhoodChain = defineChain({
  id: chainId,
  name: chainName,
  nativeCurrency: { name: 'Ether', symbol, decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: `${chainName} Explorer`, url: explorerUrl },
  },
  testnet: true,
});

export const ROBINHOOD_CHAIN = robinhoodChain;
