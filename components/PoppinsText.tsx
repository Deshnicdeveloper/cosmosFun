import React from "react";
import { Text, TextProps, TextStyle, StyleProp } from "react-native";
import { fonts, FontWeight, theme } from "../theme/theme";

interface PoppinsTextProps extends TextProps {
  /** Poppins weight — enforced app-wide; never use system fonts. */
  weight?: FontWeight;
  color?: string;
  size?: number;
  align?: TextStyle["textAlign"];
  style?: StyleProp<TextStyle>;
}

/**
 * The only way text should be rendered in Cosmos Fun.
 * Enforces Poppins everywhere with a convenient weight prop.
 */
export function PoppinsText({
  weight = "regular",
  color = theme.colors.textPrimary,
  size = theme.fontSize.md,
  align,
  style,
  children,
  ...rest
}: PoppinsTextProps) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts[weight], color, fontSize: size, textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
