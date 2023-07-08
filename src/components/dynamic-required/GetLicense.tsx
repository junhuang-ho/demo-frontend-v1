import { ethers, type BigNumber } from "ethers";
import { readContract, prepareWriteContract, writeContract } from "@wagmi/core";

import { useEffect, useState } from "react";
import { useIdle } from "@mantine/hooks";
import { useAccount, useSigner, useContractRead } from "wagmi";

import { ADDRESS_RAFFLE, ADDRESS_NATIVE_TOKEN } from "~/constants/common";

import { Box, Stack, Button } from "@mui/material";

import { multicall } from "@argent/era-multicall"; // ref: https://docs.argent.xyz/zksync-era/multicalls

type StakePass = {
  index: number;
  amtStaked: BigNumber;
  tsStakeUnlocked: number;
  unclaimedInterest: BigNumber;
};

const GetLicense = () => {
  const isIdle = useIdle(1_000 * 20);
  const { address: addressWallet } = useAccount();
  const { data: signer } = useSigner();

  const { data: nativeTokenSymbol } = useContractRead({
    address: ADDRESS_NATIVE_TOKEN,
    abi: ["function symbol() public view returns (string memory)"],
    functionName: "symbol",
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as string;
    },
  });

  const { data: stakeExpiryTimestamp } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: [
      "function tsStakeExpiry(address _raffler) public view returns (uint256 expiryTimestamp)",
    ],
    functionName: "tsStakeExpiry",
    args: [addressWallet],
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return (data as BigNumber).toNumber();
    },
  });
  const { data: stakeIndex } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: [
      "function stakeIndex(address _raffler) public view returns (uint256 stakeIndex)",
    ],
    functionName: "stakeIndex",
    args: [addressWallet],
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return (data as BigNumber).toNumber();
    },
  });
  const [stakePasses, setStakePasses] = useState<StakePass[]>([]);
  useEffect(() => {
    const run = async () => {
      if (!addressWallet || stakeIndex === undefined) return;

      const stakePasses: StakePass[] = [];
      for (let i = 0; i < stakeIndex; i++) {
        const data = (await readContract({
          address: ADDRESS_RAFFLE,
          abi: [
            "function stakePass(address _raffler, uint256 _index) public view returns (uint256 amtStaked, uint256 tsStakeUnlocked, uint256 unclaimedInterest)",
          ],
          functionName: "stakePass",
          args: [addressWallet, i],
        })) as [BigNumber, BigNumber, BigNumber];

        stakePasses.push({
          index: i,
          amtStaked: data[0],
          tsStakeUnlocked: data[1].toNumber(),
          unclaimedInterest: data[2],
        });
      }
      setStakePasses(stakePasses);
    };
    void run();
  }, [addressWallet, stakeIndex]);

  const [stakeDurCount, setStakeDurCount] = useState<number>(1);
  const [isProcessingUnstake, setIsProcessingUnstake] =
    useState<boolean>(false);
  const [isProcessingStake, setIsProcessingStake] = useState<boolean>(false);

  const { data: amountStake } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: ["function amtStake() public view returns (uint256 amtStaked)"],
    functionName: "amtStake",
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });

  const { data: unitDurationStake } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: [
      "function unitDurationStake() public view returns (uint256 unitDurationStake)",
    ],
    functionName: "unitDurationStake",
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return (data as BigNumber).toNumber();
    },
  });

  const { data: unitStakingInterest } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: [
      "function unitStakingInterest() public view returns (uint256 unitStakingInterest)",
    ],
    functionName: "unitStakingInterest",
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return (data as BigNumber).toNumber();
    },
  });

  const [burnCount, setBurnCount] = useState<number>(1);
  const [isProcessingBurn, setIsProcessingBurn] = useState<boolean>(false);

  const { data: unitAmtBurn } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: ["function unitAmtBurn() public view returns (uint256 unitAmtBurn)"],
    functionName: "unitAmtBurn",
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });

  const { data: remainingBurnPasses } = useContractRead({
    address: ADDRESS_RAFFLE,
    abi: [
      "function remainingBurnPasses(address _raffler) public view returns (uint256 count)",
    ],
    functionName: "remainingBurnPasses",
    args: [addressWallet],
    enabled: addressWallet !== undefined,
    watch: addressWallet !== undefined && !isIdle,
    select: (data) => {
      if (!data) return;
      return (data as BigNumber).toNumber();
    },
  });

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2}>
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{ border: 2 }}
      >
        <Box>--- STAKE ---</Box>
        <Stack alignItems="center">
          <Box>
            Stake Expiry:{" "}
            {new Date(
              (stakeExpiryTimestamp ? stakeExpiryTimestamp : 1) * 1000
            ).toLocaleString()}
          </Box>
        </Stack>

        <Box>Minimum Stake Duration (1 unit): {unitDurationStake} seconds</Box>
        <Box>
          Interest per unit duration: {(unitStakingInterest ?? 1) / 100}%
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box>How many unit duration to stake for: {stakeDurCount}</Box>
          <Box sx={{ p: 2 }}></Box>
          <Button
            variant="outlined"
            onClick={() => setStakeDurCount((prev) => prev + 1)}
          >
            +
          </Button>
          <Button
            variant="outlined"
            onClick={() => setStakeDurCount((prev) => prev - 1)}
          >
            -
          </Button>
        </Stack>
        <Button
          variant="contained"
          disabled={
            !signer ||
            amountStake === undefined ||
            isProcessingStake ||
            stakeDurCount <= 0
          }
          onClick={async () => {
            if (!signer || amountStake === undefined) return;

            const ntoken = new ethers.Contract(
              ADDRESS_NATIVE_TOKEN,
              [
                "function approve(address spender, uint256 amount) public returns (bool)",
              ],
              signer
            );
            const raffleContract = new ethers.Contract(
              ADDRESS_RAFFLE,
              ["function stake(uint128 _instances) external"],
              signer
            );

            if (
              ntoken.populateTransaction.approve === undefined ||
              raffleContract.populateTransaction.stake === undefined
            ) {
              console.error("ERROR staking");
              return;
            }

            const calls = [
              await ntoken.populateTransaction.approve(
                ADDRESS_RAFFLE,
                amountStake // TODO: set this dynamic
              ),
              await raffleContract.populateTransaction.stake(stakeDurCount),
            ];
            try {
              setIsProcessingStake(true);
              // eslint-disable-next-line
              const results = await multicall(signer, calls);
            } catch (error) {
              setIsProcessingStake(false);
              console.error("ERROR STAKE");
            }
            setIsProcessingStake(false);
          }}
        >
          new stake (
          {ethers.utils.formatEther(amountStake ?? ethers.BigNumber.from("0"))}{" "}
          {nativeTokenSymbol})
        </Button>
        <Box sx={{ color: "green", fontWeight: "bold" }}>
          !!! Please approve TWO wallet transactions when staking !!!
        </Box>

        <Box>----- Stake Passes -----</Box>
        {stakePasses.map((stakePass) => (
          <Stack key={stakePass.index}>
            <Box>
              Amount Stake: {ethers.utils.formatEther(stakePass.amtStaked)}
            </Box>
            <Box>
              Stake Unlock:{" "}
              {new Date(stakePass.tsStakeUnlocked * 1000).toLocaleString()}
            </Box>
            <Box>
              Unclaimed interest:{" "}
              {ethers.utils.formatEther(stakePass.unclaimedInterest)}
            </Box>
            <Button
              variant="outlined"
              disabled={
                (stakePass.amtStaked.gt(0) &&
                  Date.now() / 1000 < stakePass.tsStakeUnlocked) ||
                stakePass.amtStaked.lte(0) ||
                isProcessingUnstake
              }
              onClick={async () => {
                setIsProcessingUnstake(true);
                try {
                  const config = await prepareWriteContract({
                    address: ADDRESS_RAFFLE,
                    abi: ["function unstakeAndClaim(uint256 _index) external"],
                    functionName: "unstakeAndClaim",
                    args: [stakePass.index],
                  });
                  const { hash, wait } = await writeContract(config);
                  await wait();
                } catch (error) {
                  setIsProcessingUnstake(false);
                  console.error(error);
                }
                setIsProcessingUnstake(false);
              }}
            >
              unstake and claim
            </Button>
          </Stack>
        ))}
        <Box>----- ---------- -----</Box>
      </Stack>

      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{ border: 2 }}
      >
        <Box>--- BURN ---</Box>
        <Box>Burn Passes: {remainingBurnPasses}</Box>
        <Box>
          Price per burn pass:{" "}
          {ethers.utils.formatEther(unitAmtBurn ?? ethers.BigNumber.from(0))}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box>How many burn pass u want to buy: {burnCount}</Box>
          <Box sx={{ p: 2 }}></Box>
          <Button
            variant="outlined"
            onClick={() => setBurnCount((prev) => prev + 1)}
          >
            +
          </Button>
          <Button
            variant="outlined"
            onClick={() => setBurnCount((prev) => prev - 1)}
          >
            -
          </Button>
        </Stack>
        <Button
          variant="contained"
          disabled={
            !signer ||
            unitAmtBurn === undefined ||
            isProcessingBurn ||
            burnCount <= 0
          }
          onClick={async () => {
            if (!signer || unitAmtBurn === undefined) return;

            const ntoken = new ethers.Contract(
              ADDRESS_NATIVE_TOKEN,
              [
                "function approve(address spender, uint256 amount) public returns (bool)",
              ],
              signer
            );
            const raffleContract = new ethers.Contract(
              ADDRESS_RAFFLE,
              ["function burn(uint128 _instances) external"],
              signer
            );

            if (
              ntoken.populateTransaction.approve === undefined ||
              raffleContract.populateTransaction.burn === undefined
            ) {
              console.error("ERROR burning");
              return;
            }

            const calls = [
              await ntoken.populateTransaction.approve(
                ADDRESS_RAFFLE,
                unitAmtBurn.mul(burnCount) // TODO: set this dynamic
              ),
              await raffleContract.populateTransaction.burn(burnCount),
            ];
            try {
              setIsProcessingBurn(true);
              // eslint-disable-next-line
              const results = await multicall(signer, calls);
            } catch (error) {
              setIsProcessingBurn(false);
              console.error("ERROR BURN");
            }
            setIsProcessingBurn(false);
          }}
        >
          buy burn pass (
          {ethers.utils.formatEther(
            unitAmtBurn?.mul(burnCount) ?? ethers.BigNumber.from("0")
          )}{" "}
          {nativeTokenSymbol})
        </Button>
        <Box sx={{ color: "green", fontWeight: "bold" }}>
          !!! Please approve TWO wallet transactions when burning !!!
        </Box>
      </Stack>
    </Stack>
  );
};

export default GetLicense;
