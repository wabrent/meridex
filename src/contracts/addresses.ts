/** Contract addresses, resolved from env with zero-address fallbacks for demo mode. */

const ZERO = '0x0000000000000000000000000000000000000000' as const;

/** Live Meridex token ($OPTION) on the Pons launchpad. */
export const OPTION_TOKEN_ADDRESS = '0xd6ce78d9f112d49a616769ff65f09b208ebd50c9' as const;

export const MERIDEX_ADDRESS = (import.meta.env.VITE_MERIDEX_ADDRESS as `0x${string}` | undefined) ?? ZERO;
export const MRDX_ADDRESS = (import.meta.env.VITE_MRDX_TOKEN_ADDRESS as `0x${string}` | undefined) ?? OPTION_TOKEN_ADDRESS;
export const PONS_CURVE_ADDRESS = (import.meta.env.VITE_PONS_CURVE_ADDRESS as `0x${string}` | undefined) ?? ZERO;

export const PONS_SWAP_URL =
  (import.meta.env.VITE_PONS_SWAP_URL as string | undefined) ??
  `https://ponsfamily.com/launchpad/${OPTION_TOKEN_ADDRESS}`;

export const isDemoAddress = (addr: string) => addr === ZERO;
