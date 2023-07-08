import Link from "next/link";

import { useRouter } from "next/router";
import { useTheme } from "~/contexts/Theme";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { ConnectButton } from "@rainbow-me/rainbowkit";

import { ADDRESS_RAFFLE } from "~/constants/common";

export const HEIGHT_HEADER = 70;

const Header = () => {
  const { push: navigateTo } = useRouter();
  const { toggleColorScheme } = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        position: "fixed",
        height: HEIGHT_HEADER,
        width: "100%",
        px: 2,
        backgroundColor: "background.paper",
        zIndex: 9,
      }}
    >
      <Typography>USJ 4</Typography>
      <Button variant="outlined" onClick={toggleColorScheme}>
        toggle theme
      </Button>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={1}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ px: 2 }}
        >
          <Link href="/">Home</Link>
          <Link href="/create-raffle">CreateRaffle</Link>
          <Link href="/get-license">GetLicense</Link>
          <Link href="/ntoken">NativeToken</Link>
          <Link href="/dtoken">DummyToken</Link>
          <Link href="/dnft">DummyNFT</Link>
          <Link
            href={`https://eth-converter.com/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            EtherToWei
          </Link>
          <Link
            href={`https://goerli.explorer.zksync.io/address/${ADDRESS_RAFFLE}#contract`}
            target="_blank"
            rel="noopener noreferrer"
          >
            AdminAccess
          </Link>
          {process.env.NODE_ENV === "development" && (
            <Link href="/test-multicall">multi</Link>
          )}
          <Link
            href="https://goerli.portal.zksync.io/faucet"
            target="_blank"
            rel="noopener noreferrer"
          >
            GetGas
          </Link>
        </Stack>

        <Box>
          <ConnectButton />
        </Box>
      </Stack>
    </Stack>
  );
};

export default Header;
