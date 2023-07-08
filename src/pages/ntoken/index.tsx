import { ethers } from "ethers";

import { useState } from "react";
import { useIdle } from "@mantine/hooks";
import {
  useAccount,
  useBalance,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";

import { ADDRESS_NATIVE_TOKEN, ADDRESS_RAFFLE } from "~/constants/common";

import { Box, Stack, Button } from "@mui/material";

const NativeToken = () => {
  const isIdle = useIdle(1_000 * 20);
  const { address: addressWallet } = useAccount();
  const { data: dataBal } = useBalance({
    address: addressWallet,
    token: ADDRESS_NATIVE_TOKEN,
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
  });
  const balance = dataBal ? dataBal.formatted : "0";
  const symbol = dataBal ? dataBal.symbol : "";

  const { data: isSyncWithRaffleContract } = useContractRead({
    address: ADDRESS_NATIVE_TOKEN,
    abi: ["function minter() public view returns (address minter)"],
    functionName: "minter",
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;

      return data === ADDRESS_RAFFLE;
    },
  });

  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: ADDRESS_NATIVE_TOKEN,
    abi: ["function mint(address to, uint256 amount) public"],
    functionName: "mint",
    args: [addressWallet, ethers.utils.parseEther("100")],
    enabled: addressWallet !== undefined,
  });
  const {
    data,
    isLoading,
    writeAsync: mint,
  } = useContractWrite({
    ...config,
    onSuccess: () => {
      setIsWriting(true);
    },
  });
  useWaitForTransaction({
    hash: data?.hash,
    onSuccess: (receipt) => {
      setIsWriting(false);
    },
  });
  const isProcessing = isLoading || isWriting;

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2}>
      <Box>--- Native Token ---</Box>
      <Box sx={{ color: "green" }}>{ADDRESS_NATIVE_TOKEN}</Box>
      <Box>
        {isSyncWithRaffleContract
          ? "is valid native token"
          : "not valid native token"}
      </Box>
      <Box>
        {balance} {symbol}
      </Box>
      <Button
        variant="contained"
        disabled={!mint || isProcessing}
        onClick={async () => {
          await mint?.();
        }}
      >
        Mint 100 {symbol}
      </Button>
    </Stack>
  );
};

export default NativeToken;
