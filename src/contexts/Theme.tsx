import { createContext, useContext, useCallback, useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  type Shadows,
} from "@mui/material/styles";
import { type PaletteMode } from "@mui/material";

import { useLocalStorage } from "@mantine/hooks";
// import { useColorScheme } from "@mantine/hooks";

export const PRIMARY_COLOR = "#FC6B3F"; //"#C93D1B"; // ref: https://colorhunt.co/palettes/neon-retro

export interface IThemeContext {
  isDark: boolean | undefined;
  toggleColorScheme: () => void;
}

export const ThemeContext = createContext<IThemeContext>({
  isDark: false,
  toggleColorScheme: () => {
    //
  },
});

export const useTheme = (): IThemeContext => {
  return useContext(ThemeContext);
};

const LIGHT = "light";
const DARK = "dark";

const ThemeProvider = ({ children }: { children: JSX.Element }) => {
  //   const isPrefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  //   const colorSchemeInit = useColorScheme();

  const [colorScheme, setColorScheme] = useLocalStorage<PaletteMode>({
    key: "color-scheme",
    defaultValue: DARK,
  });
  const isDark = colorScheme === DARK ? true : false;
  const toggleColorScheme = () =>
    setColorScheme((current) => (current === DARK ? LIGHT : DARK));

  const createThemeHelper = useCallback((colorScheme: PaletteMode) => {
    const themeColors = {
      info: {
        main: "#0F71F2",
      },
      success: {
        main: "#03A64A",
      },
      warning: {
        main: "#F28C0F",
      },
      error: {
        main: "#F20F0F",
      },
      primary: {
        main: PRIMARY_COLOR, // rmb to change `accentColor` in Wallet.tsx as well
      }, // ref: https://colorhunt.co/palettes/teal-gold
      //   secondary: {
      //     main: "#F8C43A", // "#433865" // "#22f291" // "#0CF2C8" // "#706c97"
      //   },
    };

    return createTheme({
      palette: {
        mode: colorScheme,
        ...(colorScheme === LIGHT
          ? {
              background: {
                paper: "#F0F1F5",
                default: "#F0F1F5",
              },
              //   backgroundTwo: {
              //     main: "#FFFFFF",
              //   },
              //   primaryLighter: {
              //     main: "#F384DF",
              //   },

              ...themeColors,
            }
          : {
              background: {
                paper: "#22272E",
                default: "#22272E",
              },
              //   backgroundTwo: {
              //     main: "#2D333B",
              //   },
              //   primaryLighter: {
              //     main: "#8F2A5F", // #F5C3DC
              //   },
              ...themeColors,
            }),
      },
      shadows: Array(25).fill("none") as Shadows,
    });
  }, []);

  const muiTheme = useMemo(
    () => createThemeHelper(colorScheme),
    [colorScheme, createThemeHelper]
  );

  const colorMode = {
    isDark,
    toggleColorScheme,
  };

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

// // ref: https://mui.com/material-ui/customization/palette/#adding-new-colors
// declare module "@mui/material/styles" {
//   interface Palette {
//     backgroundTwo: Palette["primary"];
//     // primaryLighter: Palette["primary"];
//   }
//   interface PaletteOptions {
//     backgroundTwo: PaletteOptions["primary"];
//     // primaryLighter: PaletteOptions["primary"];
//   }
// }

// declare module "@mui/material/Button" {
//   interface ButtonPropsColorOverrides {
//     backgroundTwo: true;
//   }
// }
