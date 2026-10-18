import { useCallback } from 'react';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { MERIDEX_ABI, MERIDEX_ADDRESS } from '../contracts';

/**
 * Contract write hooks for the Meridex binary options protocol:
 *  - enterPosition(uint256 roundId, bool isUp) payable
 *  - claimReward(uint256 roundId)
 *
 * Both are integration-ready: call them once a wallet is connected to the
 * Robinhood Chain. The UI falls back to the local round engine otherwise.
 */
export function useMeridexContract() {
  const {
    writeContractAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const enterPosition = useCallback(
    async (roundId: number | bigint, isUp: boolean, amountEth: number) =>
      writeContractAsync({
        address: MERIDEX_ADDRESS,
        abi: MERIDEX_ABI,
        functionName: 'enterPosition',
        args: [BigInt(roundId), isUp],
        value: parseEther(amountEth.toFixed(6).replace(/0+$/, '').replace(/\.$/, '.0')),
      }),
    [writeContractAsync],
  );

  const claimReward = useCallback(
    async (roundId: number | bigint) =>
      writeContractAsync({
        address: MERIDEX_ADDRESS,
        abi: MERIDEX_ABI,
        functionName: 'claimReward',
        args: [BigInt(roundId)],
      }),
    [writeContractAsync],
  );

  return {
    enterPosition,
    claimReward,
    isPending: isPending || isConfirming,
    isConfirmed,
    error,
    hash,
    reset,
  };
}
