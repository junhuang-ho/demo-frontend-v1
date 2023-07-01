import { ethers, type BigNumber } from "ethers";
import { readContracts, type Address } from "wagmi";
import { prepareWriteContract, writeContract } from "@wagmi/core";

import { useState, useEffect } from "react";
import { useIdle } from "@mantine/hooks";
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";

import {
  ADDRESS_RAFFLE,
  ADDRESS_NATIVE_TOKEN,
  ADDRESS_DUMMY_TOKEN,
  ADDRESS_DUMMY_NFT,
} from "~/constants/common";

import { Box, Stack, Button, TextField } from "@mui/material";

import { type Raffle } from "./create-raffle";

export default function Home() {
  const isIdle = useIdle(1_000 * 20);
  const { address: addressWallet } = useAccount();
  const [raffleId, setRaffleId] = useState<string>("");
  const [host, setHost] = useState<Address | undefined>(undefined);
  const [ticketCount, setTicketCount] = useState<number>(1);

  const [raffle, setRaffle] = useState<Raffle | undefined>(undefined);
  useEffect(() => {
    const run = async () => {
      if (!addressWallet) return;

      const data_ = await readContracts({
        contracts: [
          {
            address: ADDRESS_RAFFLE,
            abi: [
              "function getRaffle(address _host, bytes32 _raffleId) external view returns (uint256,uint256,uint256,uint256,address,address,address,uint256,uint256,uint256)",
            ],
            functionName: "getRaffle",
            args: [addressWallet, raffleId],
          },
        ],
      });
      const data = data_[0];
      if (!data) return;

      setRaffle({
        raffleId: raffleId,
        tsEnd: data[0]?.toNumber(),
        maxTickets: data[1]?.toNumber(),
        maxTicketsPerAddress: data[2]?.toNumber(),
        price: data[3],
        token: data[4]?.toString(),
        prizeToken: data[5]?.toString(),
        prizeNFT: data[6]?.toString(),
        amount: data[7],
        item: data[8]?.toNumber(),
        ticketsBought: data[9]?.toNumber(),
      });
    };
    void run();
  }, [addressWallet, raffleId]);

  const [isWritingApprove, setIsWritingApprove] = useState<boolean>(false);
  const { config: configApprove } = usePrepareContractWrite({
    address: ADDRESS_NATIVE_TOKEN,
    abi: ["function approve(address to, uint256 tokenId) external"],
    functionName: "approve",
    args: [ADDRESS_RAFFLE, ethers.utils.parseEther("1")],
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
    abi: [
      "function enterRaffle(address _host,bytes32 _raffleId,uint256 _unitAmount,uint256 _ticketCount) external",
    ],
    functionName: "enterRaffle",
    args: [host, raffleId, ethers.utils.parseEther("1"), ticketCount],
    enabled:
      addressWallet !== undefined &&
      raffleId.length > 0 &&
      host !== undefined &&
      ticketCount > 0,
  });
  const {
    data,
    isLoading,
    writeAsync: enterRaffle,
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
      <Box>--- Home: Find Raffle ---</Box>
      <Stack spacing={1}>
        <TextField
          label="Host Address"
          value={host}
          onChange={(event) => {
            const value = event.target.value;
            setHost(value as any);
          }}
        />
        <TextField
          label="Raffle ID"
          value={raffleId}
          onChange={(event) => {
            const value = event.target.value;
            setRaffleId(value);
          }}
        />
        <TextField
          label="Number of Tickets"
          value={ticketCount}
          onChange={(event) => {
            const value = event.target.value;
            setTicketCount(Number(value));
          }}
        />
      </Stack>
      <Stack key={raffle?.tsEnd}>
        <Box>Raffle ID: {raffle?.raffleId}</Box>
        <Box>
          Ends On: {new Date(Number(raffle?.tsEnd) * 1000).toLocaleString()}
        </Box>
        <Box>Max Tickets: {raffle?.maxTickets}</Box>
        <Box>Max Tickets Per Address: {raffle?.maxTicketsPerAddress}</Box>
        <Box>Tickets SOLD: {raffle?.ticketsBought}</Box>
        <Box>
          Ticket Price:{" "}
          {ethers.utils.formatEther(raffle?.price ?? ethers.BigNumber.from(0))}
        </Box>
        <Box>Ticket Accepted Token (Native currency): {raffle?.token}</Box>
        <Box>Prize Token (dummy token): {raffle?.prizeToken}</Box>
        <Box>Prize NFT (dummy NFT): {raffle?.prizeNFT}</Box>
        <Box>
          Token Prize Amount:{" "}
          {ethers.utils.formatEther(raffle?.amount ?? ethers.BigNumber.from(0))}
        </Box>
        <Box>Token Prize NFT: {raffle?.item}</Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            disabled={!approve || isProcessing || isProcessingApprove}
            onClick={async () => {
              await approve?.();
            }}
          >
            approve {ticketCount} native token
          </Button>
          <Button
            variant="contained"
            disabled={!enterRaffle || isProcessing || isProcessingApprove}
            onClick={async () => {
              await enterRaffle?.();
            }}
          >
            enter raffle ({ticketCount} native token)
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
