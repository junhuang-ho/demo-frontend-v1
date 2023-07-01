import { type AppType } from "next/dist/shared/lib/utils";
import "~/styles/globals.css";

import MainLayout from "~/components/MainLayout";
import ThemeProvider from "~/contexts/Theme";
import WalletProvider from "~/contexts/Wallet";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ThemeProvider>
      <WalletProvider>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </WalletProvider>
    </ThemeProvider>
  );
};

export default MyApp;
