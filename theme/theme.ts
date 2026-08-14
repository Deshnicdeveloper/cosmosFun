/**
 * Cosmos Fun — theme
 *
 * Dark cosmic theme only for v1. The Theme type + `themes` map is structured
 * so a light theme can be added later without rewriting consumers:
 * add `light: Theme` to `themes` and swap the export (or wire a context).
 */

export type ThemeMode = "dark"; // add "light" later

export interface Theme {
  colors: {
    /** Deep-space gradient, top → bottom */
    bgGradient: readonly [string, string, string];
    /** Solid fallback / splash background */
    bgDeep: string;
    surface: string;
    surfaceRaised: string;
    surfaceBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    correct: string;
    correctGlow: string;
    skip: string;
    skipGlow: string;
    danger: string;
    dangerGlow: string;
    star: string;
    overlay: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    huge: number;
    giant: number;
  };
}

export const darkTheme: Theme = {
  colors: {
    bgGradient: ["#0B0E2E", "#3D1E6D", "#7C3AED"] as const,
    bgDeep: "#0B0E2E",
    surface: "rgba(255,255,255,0.06)",
    surfaceRaised: "rgba(255,255,255,0.10)",
    surfaceBorder: "rgba(255,255,255,0.14)",
    textPrimary: "#F8FAFC",
    textSecondary: "#C7C9E8",
    textMuted: "#8B8FC7",
    accent: "#7C3AED",
    correct: "#22C55E",
    correctGlow: "rgba(34,197,94,0.45)",
    skip: "#F59E0B",
    skipGlow: "rgba(245,158,11,0.45)",
    danger: "#EF4444",
    dangerGlow: "rgba(239,68,68,0.5)",
    star: "#E9E5FF",
    overlay: "rgba(11,14,46,0.85)",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 26,
    xxl: 34,
    huge: 48,
    giant: 64,
  },
};

export const themes: Record<ThemeMode, Theme> = { dark: darkTheme };

/** Active theme — dark only in v1. */
export const theme = darkTheme;

/**
 * Poppins font families as registered by @expo-google-fonts/poppins.
 * Use via <PoppinsText weight="bold"> — never use system fonts directly.
 */
export const fonts = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
  extrabold: "Poppins_800ExtraBold",
  black: "Poppins_900Black",
} as const;

export type FontWeight = keyof typeof fonts;
