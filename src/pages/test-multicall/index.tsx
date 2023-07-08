import { ethers, type BigNumber } from "ethers";

import { useState } from "react";
import { useIdle } from "@mantine/hooks";
import {
  useAccount,
  useSigner,
  useBalance,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";

import { ADDRESS_DUMMY_CON, ADDRESS_DUMMY_TOKEN } from "~/constants/common";

import { Box, Stack, Button } from "@mui/material";

import { multicall } from "@argent/era-multicall"; // ref: https://docs.argent.xyz/zksync-era/multicalls

const TestMulticall = () => {
  const isIdle = useIdle(1_000 * 20);
  const { address: addressWallet } = useAccount();

  const { data: dataBalWallet } = useBalance({
    address: addressWallet,
    token: ADDRESS_DUMMY_TOKEN,
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
  });
  const { data: dataBalCon } = useBalance({
    address: ADDRESS_DUMMY_CON,
    token: ADDRESS_DUMMY_TOKEN,
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
  });

  const { data: signer } = useSigner();
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2}>
      <Box>Wallet: {JSON.stringify(dataBalWallet)}</Box>
      <Box>Con --: {JSON.stringify(dataBalCon)}</Box>
      <Button
        variant="outlined"
        onClick={async () => {
          if (!signer) return;
          const dummytoken1 = new ethers.Contract(
            ADDRESS_DUMMY_TOKEN,
            [
              "function approve(address spender, uint256 amount) public returns (bool)",
            ],
            signer
          );
          const dummycon = new ethers.Contract(
            ADDRESS_DUMMY_CON,
            ["function test(address _token) external"],
            signer
          );

          if (
            dummytoken1.populateTransaction.approve === undefined ||
            dummycon.populateTransaction.test === undefined
          ) {
            console.log("undefinedddd");
            return;
          }
          const calls = [
            await dummytoken1.populateTransaction.approve(
              ADDRESS_DUMMY_CON,
              ethers.utils.parseEther("1")
            ),
            await dummycon.populateTransaction.test(ADDRESS_DUMMY_TOKEN),
          ];
          // eslint-disable-next-line
          const results = await multicall(signer, calls);
          console.log("RESULTS:", results);
        }}
      >
        multicall
      </Button>
    </Stack>
  );
};

export default TestMulticall;
