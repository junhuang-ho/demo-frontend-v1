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

import { multicall } from "@argent/era-multicall"; // ref: https://docs.argent.xyz/zksync-era/multicalls

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
  const { data: signer } = useSigner();

  const [raffleDuration, setRaffleDuration] = useState<number>(600);
  const [maxTickets, setMaxTickets] = useState<number>(1000);
  const [maxTicketsPerAddr, setMaxTicketsPerAddr] = useState<number>(100);
  const [ticketPrice, setTicketPrice] = useState<string>("1000000000000000000");
  const [ticketToken, setTicketToken] = useState<string>(ADDRESS_NATIVE_TOKEN);

  const [prizeToken, setPrizeToken] = useState<string>(ADDRESS_DUMMY_TOKEN);
  const [prizeTokenAmt, setPrizeTokenAmt] = useState<string>(
    "1000000000000000000"
  );
  const [prizeNFT, setPrizeNFT] = useState<string>(ADDRESS_DUMMY_NFT);
  const [prizeNFTIndex, setPrizeNFTIndex] = useState<number>(0);

  const [isProcessingRaffle, setIsProcessingRaffle] = useState<boolean>(false);

  const [calls, setCalls] = useState<any[]>([]);
  useEffect(() => {
    const run = async () => {
      if (
        !signer ||
        raffleDuration <= 0 ||
        maxTickets <= 0 ||
        maxTicketsPerAddr <= 0 ||
        !ethers.utils.isAddress(ticketToken) ||
        !ethers.utils.isAddress(prizeToken) ||
        !ethers.utils.isAddress(prizeNFT)
      ) {
        console.log("err3");
        setCalls([]);
        return;
      }

      const ctPrizeToken = new ethers.Contract(
        prizeToken,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
        ],
        signer
      );
      const ctPrizeNFT = new ethers.Contract(
        prizeNFT,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
        ],
        signer
      );
      const raffleContract = new ethers.Contract(
        ADDRESS_RAFFLE,
        [
          "function startRaffle(uint256 _duration,uint256 _maxTickets,uint256 _maxTicketsPerAddress,uint256 _price,address _token,address _prizeToken, address _prizeNFT, uint256 _amount,uint256 _item ) external",
        ],
        signer
      );

      if (
        ctPrizeToken.populateTransaction.approve === undefined ||
        ctPrizeNFT.populateTransaction.approve === undefined ||
        raffleContract.populateTransaction.startRaffle === undefined
      )
        return;
      let calls: any[] = [];
      calls = [
        await ctPrizeToken.populateTransaction.approve(
          ADDRESS_RAFFLE,
          prizeTokenAmt
        ),
        await ctPrizeNFT.populateTransaction.approve(
          ADDRESS_RAFFLE,
          prizeNFTIndex
        ),
        await raffleContract.populateTransaction.startRaffle(
          raffleDuration,
          maxTickets,
          maxTicketsPerAddr,
          ticketPrice,
          ticketToken,
          prizeToken,
          prizeNFT,
          prizeTokenAmt,
          prizeNFTIndex
        ),
      ];

      setCalls(calls);
    };
    void run();
  }, [
    signer,
    prizeToken,
    prizeNFT,
    ticketToken,
    ticketPrice,
    prizeTokenAmt,
    prizeNFTIndex,
    raffleDuration,
    maxTickets,
    maxTicketsPerAddr,
  ]);

  /////

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

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2}>
      <Box>--- Create Raffle ---</Box>
      <Box>Reference Addresses</Box>
      <Stack>
        <Stack direction="row" spacing={1}>
          <Box>Native:</Box>
          <Box sx={{ color: "green" }}>{ADDRESS_NATIVE_TOKEN}</Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Box>dToken:</Box>
          <Box sx={{ color: "green" }}>{ADDRESS_DUMMY_TOKEN}</Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Box>dNFT:</Box>
          <Box sx={{ color: "green" }}>{ADDRESS_DUMMY_NFT}</Box>
        </Stack>
      </Stack>
      <Box>NOTE: Boxes in RED are fixed for now, their value is 1</Box>
      <Box sx={{ pt: 2, fontWeight: "bold" }}>Part 1 - Set Raffle Details</Box>
      <Stack direction="row" spacing={1}>
        <TextField
          label="Raffle Duration (seconds)"
          value={raffleDuration}
          onChange={(event) => {
            const value = event.target.value;
            if (isNaN(Number(value))) return;
            setRaffleDuration(Number(value));
          }}
        />
        <TextField
          label="Max Tickets"
          value={maxTickets}
          onChange={(event) => {
            const value = event.target.value;
            if (isNaN(Number(value))) return;
            setMaxTickets(Number(value));
          }}
        />
        <TextField
          label="Max Tickets Per Address"
          value={maxTicketsPerAddr}
          onChange={(event) => {
            const value = event.target.value;
            if (isNaN(Number(value))) return;
            setMaxTicketsPerAddr(Number(value));
          }}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          label="Tickets Price (wei)"
          value={ticketPrice}
          //   onChange={(event) => {
          //     const value = event.target.value;
          //     if (isNaN(Number(value))) return;
          //     setTicketPrice(Number(value));
          //   }}
          error={true}
        />
        <TextField
          label="Tickets Token (address)"
          value={ticketToken}
          onChange={(event) => {
            const value = event.target.value;
            setTicketToken(value);
          }}
        />
      </Stack>
      <Box sx={{ pt: 2, fontWeight: "bold" }}>Part 2 - Set Prizes</Box>
      <Stack direction="row" spacing={1}>
        <Stack spacing={1}>
          <TextField
            label="Token (address)"
            value={prizeToken}
            onChange={(event) => {
              const value = event.target.value;
              setPrizeToken(value);
            }}
          />
          <TextField
            label="Token Amount (wei)"
            value={prizeTokenAmt}
            // onChange={(event) => {
            //   const value = event.target.value;
            //   if (isNaN(Number(value))) return;
            //   setPrizeTokenAmt(Number(value));
            // }}
            error={true}
          />
        </Stack>
        <Stack spacing={1}>
          <TextField
            label="NFT (address)"
            value={prizeNFT}
            onChange={(event) => {
              const value = event.target.value;
              setPrizeNFT(value);
            }}
          />
          <TextField
            label="NFT Index"
            value={prizeNFTIndex}
            onChange={(event) => {
              const value = event.target.value;
              if (isNaN(Number(value))) return;
              setPrizeNFTIndex(Number(value));
            }}
          />
        </Stack>
      </Stack>
      <Box>(for this demo, both token and nft are required)</Box>
      <Box>-----------------------------------</Box>
      <Box>
        (For inputs in -wei-, setting too big value will make input become
        infinity. This is known bug just set lower number like 10 ether in wei)
      </Box>
      <Button
        variant="contained"
        disabled={
          (calls !== undefined && calls?.length <= 0) || isProcessingRaffle
        }
        onClick={async () => {
          if (!signer || calls?.length <= 0) return;

          try {
            setIsProcessingRaffle(true);
            // eslint-disable-next-line
            const results = await multicall(signer, calls);
          } catch (error) {
            setIsProcessingRaffle(false);
            console.error("ERROR RAFFLE");
          }
          setIsProcessingRaffle(false);
        }}
      >
        Confirm and Start Raffle
      </Button>
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
                    Math.floor(Math.random() * 9999),
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

// TODO: convert those wei inputs to string otherwise bignumber error --> overflow
// TODO: add back raffle viewer, see indexold.tsx
