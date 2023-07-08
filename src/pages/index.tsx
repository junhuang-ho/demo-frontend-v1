/* eslint-disable */
import { ethers, type BigNumber } from "ethers";
import { readContracts, type Address } from "wagmi";
import { prepareWriteContract, writeContract } from "@wagmi/core";

import { useState, useEffect } from "react";
import { useIdle } from "@mantine/hooks";
import {
  useAccount,
  useSigner,
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

import { multicall } from "@argent/era-multicall"; // ref: https://docs.argent.xyz/zksync-era/multicalls

export default function Home() {
  const isIdle = useIdle(1_000 * 20);
  const { address: addressWallet } = useAccount();
  const { data: signer } = useSigner();
  const [raffleId, setRaffleId] = useState<string>("");
  const [host, setHost] = useState<Address | undefined>(undefined);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [isEnteringRaffle, setIsEnteringRaffle] = useState<boolean>(false);

  const [raffle, setRaffle] = useState<Raffle | undefined>(undefined);
  useEffect(() => {
    const run = async () => {
      if (!host) return;

      const data_ = await readContracts({
        contracts: [
          {
            address: ADDRESS_RAFFLE,
            abi: [
              "function getRaffle(address _host, bytes32 _raffleId) external view returns (uint256,uint256,uint256,uint256,address,address,address,uint256,uint256,uint256)",
            ],
            functionName: "getRaffle",
            args: [host, raffleId],
          },
        ],
      });
      const data = data_[0] as [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber
      ];
      if (!data) return;

      setRaffle({
        raffleId: raffleId,
        tsEnd: data[0]?.toNumber(),
        maxTickets: data[1]?.toNumber(),
        maxTicketsPerAddress: data[2]?.toNumber(),
        price: data[3],
        token: data[4]?.toString() as Address,
        prizeToken: data[5]?.toString() as Address,
        prizeNFT: data[6]?.toString() as Address,
        amount: data[7],
        item: data[8]?.toNumber(),
        ticketsBought: data[9]?.toNumber(),
      });
    };
    void run();
  }, [host, raffleId]);

  //   const [isWritingApprove, setIsWritingApprove] = useState<boolean>(false);
  //   const { config: configApprove } = usePrepareContractWrite({
  //     address: ADDRESS_NATIVE_TOKEN,
  //     abi: ["function approve(address to, uint256 tokenId) external"],
  //     functionName: "approve",
  //     args: [ADDRESS_RAFFLE, ethers.utils.parseEther("1")],
  //     enabled: addressWallet !== undefined,
  //   });
  //   const {
  //     data: dataApprove,
  //     isLoading: isLoadingApprove,
  //     writeAsync: approve,
  //   } = useContractWrite({
  //     ...configApprove,
  //     onSuccess: () => {
  //       setIsWritingApprove(true);
  //     },
  //   });
  //   useWaitForTransaction({
  //     hash: dataApprove?.hash,
  //     onSuccess: (receipt) => {
  //       setIsWritingApprove(false);
  //     },
  //   });
  //   const isProcessingApprove = isLoadingApprove || isWritingApprove;

  //   const [isWriting, setIsWriting] = useState<boolean>(false);
  //   const { config } = usePrepareContractWrite({
  //     address: ADDRESS_RAFFLE,
  //     abi: [
  //       "function enterRaffle(address _host,bytes32 _raffleId,uint256 _unitAmount,uint256 _ticketCount) external",
  //     ],
  //     functionName: "enterRaffle",
  //     args: [host, raffleId, ethers.utils.parseEther("1"), ticketCount],
  //     enabled:
  //       addressWallet !== undefined &&
  //       raffleId.length > 0 &&
  //       host !== undefined &&
  //       ticketCount > 0,
  //   });
  //   const {
  //     data,
  //     isLoading,
  //     writeAsync: enterRaffle,
  //   } = useContractWrite({
  //     ...config,
  //     onSuccess: () => {
  //       setIsWriting(true);
  //     },
  //   });
  //   useWaitForTransaction({
  //     hash: data?.hash,
  //     onSuccess: (receipt) => {
  //       setIsWriting(false);
  //     },
  //   });
  //   const isProcessing = isLoading || isWriting;

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
        <Box>Ticket Accepted Token: {raffle?.token}</Box>
        <Box>Prize Token (dummy token): {raffle?.prizeToken}</Box>
        <Box>Prize NFT (dummy NFT): {raffle?.prizeNFT}</Box>
        <Box>
          Token Prize Amount:{" "}
          {ethers.utils.formatEther(raffle?.amount ?? ethers.BigNumber.from(0))}
        </Box>
        <Box>Token Prize NFT: {raffle?.item}</Box>
        <Button
          variant="contained"
          disabled={
            !signer ||
            host === undefined ||
            isEnteringRaffle ||
            ticketCount <= 0 ||
            raffle === undefined
          }
          onClick={async () => {
            if (
              !signer ||
              host === undefined ||
              ticketCount <= 0 ||
              raffle === undefined
            )
              return;

            const token = new ethers.Contract(
              raffle.token,
              [
                "function approve(address spender, uint256 amount) public returns (bool)",
              ],
              signer
            );
            const raffleContract = new ethers.Contract(
              ADDRESS_RAFFLE,
              [
                "function enterRaffle(address _host,bytes32 _raffleId,uint256 _unitAmount,uint256 _ticketCount) external",
              ],
              signer
            );

            if (
              token.populateTransaction.approve === undefined ||
              raffleContract.populateTransaction.enterRaffle === undefined
            ) {
              console.error("ERROR entering");
              return;
            }

            const calls = [
              await token.populateTransaction.approve(
                ADDRESS_RAFFLE,
                raffle.price.mul(ticketCount) // TODO: set this dynamic
              ),
              await raffleContract.populateTransaction.enterRaffle(
                host,
                raffleId,
                raffle.price,
                ticketCount
              ),
            ];
            try {
              setIsEnteringRaffle(true);
              // eslint-disable-next-line
              const results = await multicall(signer, calls);
            } catch (error) {
              setIsEnteringRaffle(false);
              console.error("ERROR ENTER");
            }
            setIsEnteringRaffle(false);
          }}
        >
          Enter Raffle
        </Button>
      </Stack>
    </Stack>
  );
}
