/**
 * Meridex protocol ABIs (human-readable, viem-compatible).
 *
 * Core contract functions required by the terminal:
 *  - enterPosition(uint256 roundId, bool isUp) payable
 *  - claimReward(uint256 roundId)
 */

export const MERIDEX_ABI = [
  'function enterPosition(uint256 roundId, bool isUp) payable',
  'function claimReward(uint256 roundId)',
  'function claimable(uint256 roundId, address user) view returns (uint256)',
  'function getRound(uint256 roundId) view returns (uint64 strikePrice, uint64 poolUp, uint64 poolDown, uint8 outcome)',
  'function protocolFeeBps() view returns (uint256)',
  'event PositionEntered(address indexed user, uint256 indexed roundId, bool isUp, uint256 amount)',
  'event RoundSettled(uint256 indexed roundId, uint64 strikePrice, uint64 settlePrice, uint8 outcome)',
  'event RewardClaimed(address indexed user, uint256 indexed roundId, uint256 amount)',
] as const;

/** Minimal ERC-20 surface for $MRDX. */
export const MRDX_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
] as const;

/** Pons bonding-curve launchpad surface for one-click $MRDX buys. */
export const PONS_CURVE_ABI = [
  'function buy() payable',
  'function sell(uint256 amount)',
  'function tokensForEth(uint256 ethAmount) view returns (uint256)',
  'function currentPrice() view returns (uint256)',
  'function sold() view returns (uint256)',
  'function cap() view returns (uint256)',
] as const;
