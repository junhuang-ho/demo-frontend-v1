import { ethers, type BigNumber } from "ethers";

import { useState } from "react";
import { useIdle } from "@mantine/hooks";
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";

import { ADDRESS_RAFFLE, ADDRESS_NATIVE_TOKEN } from "~/constants/common";

import { Box, Stack, Button } from "@mui/material";

const GetLicense = () => {
  const isIdle = useIdle(1_000 * 20);
  const { address: addressWallet } = useAccount();

  const { data: license } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: [
      "function license(address _user) public view returns (uint256, uint256, uint256)",
    ],
    functionName: "license",
    args: [addressWallet],
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as [BigNumber, BigNumber, BigNumber];
    },
  });
  const amountStaked = license ? ethers.utils.formatEther(license[0]) : "0";
  const tsStakeUnlocked = license ? license[1].toString() : "0";
  const tsExpiry = license ? license[2].toString() : "0";

  const [isWritingApprove, setIsWritingApprove] = useState<boolean>(false);
  const { config: configApprove } = usePrepareContractWrite({
    address: ADDRESS_NATIVE_TOKEN,
    abi: [
      "function approve(address spender, uint256 amount) public returns (bool)",
    ],
    functionName: "approve",
    args: [ADDRESS_RAFFLE, ethers.utils.parseEther("100")], // TODO: make this "100" value dynamic, as stake value may change and some users might need to update stake value (top-up)
    enabled: addressWallet !== undefined,
  });
  const {
    data: dataApprove,
    isLoading: isLoadingApprove,
    writeAsync: approve,
  } = useContractWrite({
    ...configApprove,
    onSuccess: () => {
      setIsWritingApprove(true);
    },
  });
  useWaitForTransaction({
    hash: dataApprove?.hash,
    onSuccess: (receipt) => {
      setIsWritingApprove(false);
    },
  });
  const isProcessingApprove = isLoadingApprove || isWritingApprove;

  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: ADDRESS_RAFFLE,
    abi: ["function stake(uint256 _amount, uint128 _instances) external"],
    functionName: "stake",
    args: [ethers.utils.parseEther("100"), 1],
    enabled: addressWallet !== undefined,
  });
  const {
    data,
    isLoading,
    writeAsync: stake,
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

  const [isWritingUnstake, setIsWritingUnstake] = useState<boolean>(false);
  const { config: configUnstake } = usePrepareContractWrite({
    address: ADDRESS_RAFFLE,
    abi: ["function unstake() external"],
    functionName: "unstake",
    enabled: addressWallet !== undefined,
  });
  const {
    data: dataUnstake,
    isLoading: isLoadingUnstake,
    writeAsync: unstake,
  } = useContractWrite({
    ...configUnstake,
    onSuccess: () => {
      setIsWritingUnstake(true);
    },
  });
  useWaitForTransaction({
    hash: dataUnstake?.hash,
    onSuccess: (receipt) => {
      setIsWritingUnstake(false);
    },
  });
  const isProcessingUnstake = isLoadingUnstake || isWritingUnstake;

  const [isWritingApproveBurn, setIsWritingApproveBurn] =
    useState<boolean>(false);
  const { config: configApproveBurn } = usePrepareContractWrite({
    address: ADDRESS_NATIVE_TOKEN,
    abi: [
      "function approve(address spender, uint256 amount) public returns (bool)",
    ],
    functionName: "approve",
    args: [ADDRESS_RAFFLE, ethers.utils.parseEther("10")], // TODO: make this "100" value dynamic, as stake value may change and some users might need to update stake value (top-up)
    enabled: addressWallet !== undefined,
  });
  const {
    data: dataApproveBurn,
    isLoading: isLoadingApproveBurn,
    writeAsync: approveBurn,
  } = useContractWrite({
    ...configApproveBurn,
    onSuccess: () => {
      setIsWritingApproveBurn(true);
    },
  });
  useWaitForTransaction({
    hash: dataApproveBurn?.hash,
    onSuccess: (receipt) => {
      setIsWritingApproveBurn(false);
    },
  });
  const isProcessingApproveBurn = isLoadingApproveBurn || isWritingApproveBurn;

  const [isWritingBurn, setIsWritingBurn] = useState<boolean>(false);
  const { config: configBurn } = usePrepareContractWrite({
    address: ADDRESS_RAFFLE,
    abi: ["function burn(uint256 _amount) external"],
    functionName: "burn",
    args: [ethers.utils.parseEther("10")],
    enabled: addressWallet !== undefined,
  });
  const {
    data: dataBurn,
    isLoading: isLoadingBurn,
    writeAsync: burn,
  } = useContractWrite({
    ...configBurn,
    onSuccess: () => {
      setIsWritingBurn(true);
    },
  });
  useWaitForTransaction({
    hash: dataBurn?.hash,
    onSuccess: (receipt) => {
      setIsWritingBurn(false);
    },
  });
  const isProcessingBurn = isLoadingBurn || isWritingBurn;

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2}>
      <Box>TODO: add continue stake functionality</Box>
      <Box>--- License ---</Box>
      <Stack alignItems="center">
        <Box>
          License Expiry: {new Date(Number(tsExpiry) * 1000).toLocaleString()}
        </Box>
        <Box>(may vary from stake unlocked timestamp due to burn)</Box>
      </Stack>

      <Stack direction="row" spacing={1}>
        <Box>Amount Staked (Native Token): {amountStaked}</Box>
        <Box>|||</Box>
        <Box>
          Stake Unlocked At:{" "}
          {new Date(Number(tsStakeUnlocked) * 1000).toLocaleString()}
        </Box>
      </Stack>

      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          disabled={
            !approve ||
            isProcessingApprove ||
            isProcessing ||
            isProcessingUnstake ||
            isProcessingBurn ||
            isProcessingApproveBurn
          }
          onClick={async () => {
            await approve?.();
          }}
        >
          Approve Stake (100)
        </Button>
        <Button
          variant="contained"
          disabled={
            !stake ||
            isProcessingApprove ||
            isProcessing ||
            isProcessingUnstake ||
            isProcessingBurn ||
            isProcessingApproveBurn
          }
          onClick={async () => {
            await stake?.();
          }}
        >
          Stake 100 Native Token
        </Button>
        <Button
          variant="contained"
          disabled={
            !unstake ||
            isProcessingApprove ||
            isProcessing ||
            isProcessingUnstake ||
            isProcessingBurn ||
            isProcessingApproveBurn
          }
          onClick={async () => {
            await unstake?.();
          }}
        >
          Unstake
        </Button>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          disabled={
            !approveBurn ||
            isProcessingApprove ||
            isProcessing ||
            isProcessingUnstake ||
            isProcessingBurn ||
            isProcessingApproveBurn
          }
          onClick={async () => {
            await approveBurn?.();
          }}
        >
          Approve Burn (10)
        </Button>
        <Button
          variant="contained"
          disabled={
            !burn ||
            isProcessingApprove ||
            isProcessing ||
            isProcessingUnstake ||
            isProcessingBurn ||
            isProcessingApproveBurn
          }
          onClick={async () => {
            await burn?.();
          }}
        >
          Burn 10 NATIVE TOKEN
        </Button>
      </Stack>

      <Box>INSTRUCTIONS</Box>
      <Box>To Stake (follow this order):</Box>
      <Box>1. go to NativeToken tab and mint</Box>
      <Box>
        2. approve stake, currently fixed at 100, wait for txn confirmed
      </Box>
      <Box>
        3. stake 100 native token, after confirmation license will change expiry
        date
      </Box>
      <Box>
        4. after license expired, to extend/add license duration, unstake first
        and start from 1 again
      </Box>
      <Box sx={{ p: 3 }}></Box>
      <Box>To Burn (follow this order):</Box>
      <Box>1. go to NativeToken tab and mint</Box>
      <Box>2. approve burn, currently fixed at 10, wait for txn confirmed</Box>
      <Box>
        3. burn 10 native token, after confirmation license will change expiry
        date
      </Box>
    </Stack>
  );
};

export default GetLicense;
