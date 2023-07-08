import { ethers, type BigNumber } from "ethers";
import { readContract } from "@wagmi/core";
import { type Address } from "wagmi";

import { useState, useEffect } from "react";
import { useIdle } from "@mantine/hooks";
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";

import { ADDRESS_DUMMY_NFT } from "~/constants/common";

import { Box, Stack, Button, TextField } from "@mui/material";

const DummyNFT = () => {
  const isIdle = useIdle(1_000 * 20);
  const { address: addressWallet } = useAccount();
  const [nftIndex, setNFTIndex] = useState<number>(0);

  const { data: dataBal } = useContractRead({
    address: ADDRESS_DUMMY_NFT,
    abi: [
      "function balanceOf(address owner) external view returns (uint256 balance)",
    ],
    functionName: "balanceOf",
    args: [addressWallet],
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });
  const nftBal = dataBal ? Number(dataBal) : 0;

  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: ADDRESS_DUMMY_NFT,
    abi: ["function safeMint(address to) public"],
    functionName: "safeMint",
    args: [addressWallet],
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

  const [owner, setOwner] = useState<Address | undefined>(undefined);
  useEffect(() => {
    const run = async () => {
      try {
        const data = await readContract({
          address: ADDRESS_DUMMY_NFT,
          abi: [
            "function ownerOf(uint256 tokenId) external view returns (address owner)",
          ],
          functionName: "ownerOf",
          args: [nftIndex],
        });
        setOwner(data as Address);
      } catch {
        setOwner(undefined);
      }
    };
    void run();
  }, [nftIndex]);

  const [nftsOwned, setNFTsOwned] = useState<number[]>([]);
  useEffect(() => {
    const run = async () => {
      if (!addressWallet) return;
      const nftsOwned = [];
      for (let i = 0; i < 100; i++) {
        try {
          const owner = (await readContract({
            address: ADDRESS_DUMMY_NFT,
            abi: [
              "function ownerOf(uint256 tokenId) external view returns (address owner)",
            ],
            functionName: "ownerOf",
            args: [i],
          })) as Address;
          console.log(owner === addressWallet, "yoyo");
          if (owner === addressWallet) {
            nftsOwned.push(i);
          }
        } catch {}
      }
      setNFTsOwned(nftsOwned);
    };
    void run();
  }, [addressWallet]);

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2}>
      <Box>--- Dummy NFT ---</Box>
      <Box sx={{ color: "green" }}>{ADDRESS_DUMMY_NFT}</Box>
      <Box>total NFTs: {nftBal}</Box>
      <Box>{JSON.stringify(nftsOwned)}</Box>
      <TextField
        label="enter token index"
        value={nftIndex}
        onChange={(event) => {
          const value = event.target.value;
          setNFTIndex(Number(value));
        }}
      />
      <Box>
        {owner === addressWallet
          ? `you own ${nftIndex}`
          : `u not owner of ${nftIndex}`}
      </Box>
      <Button
        variant="contained"
        disabled={!mint || isProcessing}
        onClick={async () => {
          await mint?.();
        }}
      >
        Mint DNFT1
      </Button>
    </Stack>
  );
};

export default DummyNFT;
