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

export type Raffle = {
  raffleId: string;
  tsEnd: number;
  maxTickets: number;
  maxTicketsPerAddress: number;
  price: BigNumber;
  token: Address;
  prizeToken: Address;
  prizeNFT: Address;
  amount: BigNumber;
  item: number;
  ticketsBought: number;
};

const CreateRaffle = () => {
  const isIdle = useIdle(1_000 * 20);
  const { address: addressWallet } = useAccount();
  const [nftIndex, setNFTIndex] = useState<number | undefined>(undefined);

  const { data: raffleSize_ } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: [
      "function getRaffleSize(address _host) external view returns (uint256)",
    ],
    functionName: "getRaffleSize",
    args: [addressWallet],
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });
  const raffleSize = raffleSize_ ? raffleSize_.toNumber() : 0;

  const [raffles, setRaffles] = useState<Raffle[]>([]);
  useEffect(() => {
    const run = async () => {
      if (!addressWallet) return;

      const raffles: Raffle[] = [];
      for (let i = 0; i < raffleSize; i++) {
        const raffleId = await readContracts({
          contracts: [
            {
              address: ADDRESS_RAFFLE,
              abi: [
                "function getRaffleKeyAtIndex(address _host, uint256 _index) external view returns (bytes32)",
              ],
              functionName: "getRaffleKeyAtIndex",
              args: [addressWallet, i],
            },
          ],
        });
        const data_ = await readContracts({
          contracts: [
            {
              address: ADDRESS_RAFFLE,
              abi: [
                "function getRaffle(address _host, bytes32 _raffleId) external view returns (uint256,uint256,uint256,uint256,address,address,address,uint256,uint256,uint256)",
              ],
              functionName: "getRaffle",
              args: [addressWallet, raffleId[0]],
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

        raffles.push({
          raffleId: raffleId[0] as string,
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
      }
      setRaffles(raffles);
    };
    void run();
  }, [addressWallet, raffleSize]);

  const [isWritingApprovePrizeToken, setIsWritingApprovePrizeToken] =
    useState<boolean>(false);
  const { config: configApprovePrizeToken } = usePrepareContractWrite({
    address: ADDRESS_DUMMY_TOKEN,
    abi: [
      "function approve(address spender, uint256 amount) public returns (bool)",
    ],
    functionName: "approve",
    args: [ADDRESS_RAFFLE, ethers.utils.parseEther("30")],
    enabled: addressWallet !== undefined,
  });
  const {
    data: dataApprovePrizeToken,
    isLoading: isLoadingApprovePrizeToken,
    writeAsync: approvePrizeToken,
  } = useContractWrite({
    ...configApprovePrizeToken,
    onSuccess: () => {
      setIsWritingApprovePrizeToken(true);
    },
  });
  useWaitForTransaction({
    hash: dataApprovePrizeToken?.hash,
    onSuccess: (receipt) => {
      setIsWritingApprovePrizeToken(false);
    },
  });
  const isProcessingApprovePrizeToken =
    isLoadingApprovePrizeToken || isWritingApprovePrizeToken;

  const [isWritingApprovePrizeNFT, setIsWritingApprovePrizeNFT] =
    useState<boolean>(false);
  const { config: configApprovePrizeNFT } = usePrepareContractWrite({
    address: ADDRESS_DUMMY_NFT,
    abi: ["function approve(address to, uint256 tokenId) external"],
    functionName: "approve",
    args: [ADDRESS_RAFFLE, nftIndex],
    enabled: addressWallet !== undefined && nftIndex !== undefined,
  });
  const {
    data: dataApprovePrizeNFT,
    isLoading: isLoadingApprovePrizeNFT,
    writeAsync: approvePrizeNFT,
  } = useContractWrite({
    ...configApprovePrizeNFT,
    onSuccess: () => {
      setIsWritingApprovePrizeNFT(true);
    },
  });
  useWaitForTransaction({
    hash: dataApprovePrizeNFT?.hash,
    onSuccess: (receipt) => {
      setIsWritingApprovePrizeNFT(false);
    },
  });
  const isProcessingApprovePrizeNFT =
    isLoadingApprovePrizeNFT || isWritingApprovePrizeNFT;

  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: ADDRESS_RAFFLE,
    abi: [
      "function startRaffle(uint256 _duration,uint256 _maxTickets,uint256 _maxTicketsPerAddress,uint256 _price,address _token,address _prizeToken, address _prizeNFT, uint256 _amount,uint256 _item ) external",
    ],
    functionName: "startRaffle",
    args: [
      60 * 10,
      10,
      8,
      ethers.utils.parseEther("1"),
      ADDRESS_NATIVE_TOKEN,
      ADDRESS_DUMMY_TOKEN,
      ADDRESS_DUMMY_NFT,
      ethers.utils.parseEther("30"),
      nftIndex,
    ],
    enabled: addressWallet !== undefined && nftIndex !== undefined,
  });
  const {
    data,
    isLoading,
    writeAsync: startRaffle,
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
      <Box>--- Create Raffle ---</Box>
      {/* <Box>total NFTs: {nftBal}</Box> */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          disabled={
            !approvePrizeToken ||
            isProcessing ||
            isProcessingApprovePrizeToken ||
            isProcessingApprovePrizeNFT
          }
          onClick={async () => {
            await approvePrizeToken?.();
          }}
        >
          Approve Prize Token (30)
        </Button>
        <TextField
          label="NFT index (number only)"
          value={nftIndex ? nftIndex : ""}
          onChange={(event) => {
            const value = event.target.value;

            setNFTIndex(Number(value));
          }}
        />
        <Button
          variant="contained"
          disabled={
            !approvePrizeNFT ||
            isProcessing ||
            isProcessingApprovePrizeToken ||
            isProcessingApprovePrizeNFT
          }
          onClick={async () => {
            await approvePrizeNFT?.();
          }}
        >
          Approve Prize NFT
        </Button>
        <Button
          variant="contained"
          disabled={
            !startRaffle ||
            isProcessing ||
            isProcessingApprovePrizeToken ||
            isProcessingApprovePrizeNFT
          }
          onClick={async () => {
            await startRaffle?.();
          }}
        >
          Start Raffle
        </Button>
      </Stack>
      <Box>INSTRUCTIONS</Box>
      <Box>1. get license (see license expiry datetime)</Box>
      <Box>2. mint many nativetoken, click button few times</Box>
      <Box>3. mint many dummy token</Box>
      <Box>4. mint many dummy NFT</Box>
      <Box>5. approve prize token, fixed 30</Box>
      <Box>6. set nfts index as prize</Box>
      <Box>
        7. approve prize nft, fixed to 1 nft as prize per raffle (if this button
        disabled means u dont own that nft)
      </Box>
      <Box>
        8. start raffle (if this is disabled, u might need refresh page, but rmb
        to input the nft index again to what was approved for start raffle
        button to be enabled)
      </Box>
      <Box>
        9. raffle details will display below, and can only end after the -Ends
        On- datetime
      </Box>
      <Box>-----------------------------------</Box>
      <Box>
        {raffles.map((raffle) => (
          <Stack key={raffle.tsEnd}>
            <Box>Raffle ID: {raffle.raffleId}</Box>
            <Box>
              Ends On: {new Date(Number(raffle.tsEnd) * 1000).toLocaleString()}
            </Box>
            <Box>Max Tickets: {raffle.maxTickets}</Box>
            <Box>Max Tickets Per Address: {raffle.maxTicketsPerAddress}</Box>
            <Box>Tickets SOLD: {raffle.ticketsBought}</Box>
            <Box>Ticket Price: {ethers.utils.formatEther(raffle.price)}</Box>
            <Box>Ticket Accepted Token (Native currency): {raffle.token}</Box>
            <Box>Prize Token (dummy token): {raffle.prizeToken}</Box>
            <Box>Prize NFT (dummy NFT): {raffle.prizeNFT}</Box>
            <Box>
              Token Prize Amount: {ethers.utils.formatEther(raffle.amount)}
            </Box>
            <Box>Token Prize NFT: {raffle.item}</Box>
            <Button
              variant="outlined"
              onClick={async () => {
                const config = await prepareWriteContract({
                  address: ADDRESS_RAFFLE,
                  abi: [
                    "function endRaffle(address _host,bytes32 _raffleId,uint256 _tmpRandomNumber) external",
                  ],
                  functionName: "endRaffle",
                  args: [
                    addressWallet,
                    raffle.raffleId,
                    Math.floor(Math.random() * 99999),
                  ],
                });
                const data = await writeContract(config);
              }}
            >
              end raffle
            </Button>
            <Box>------------------------------------------------------</Box>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
};

export default CreateRaffle;
