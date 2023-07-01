import { type ReactNode } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import Header, { HEIGHT_HEADER } from "./Header";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Stack alignItems="flex-end" sx={{ width: "100%" }}>
      <Header />
      <Box
        sx={{
          width: "100%",
        }}
      >
        <Box sx={{ height: HEIGHT_HEADER + 2 }}></Box>
        <Stack alignItems="center" justifyContent="center" sx={{ px: 2 }}>
          {children}
        </Stack>
      </Box>
    </Stack>
  );
};

export default MainLayout;
