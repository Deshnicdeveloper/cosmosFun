import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { Mascot } from "../components/Mascot";
import { theme } from "../theme/theme";

export default function Home() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Mascot mood="happy" size={120} />
          <PoppinsText weight="black" size={theme.fontSize.huge}>
            Cosmos Fun
          </PoppinsText>
          <PoppinsText
            weight="medium"
            size={theme.fontSize.md}
            color={theme.colors.textSecondary}
            align="center"
          >
            Hold it to your forehead.{"\n"}Guess before time runs out!
          </PoppinsText>
        </View>

        <View style={styles.buttons}>
          <CosmicButton
            label="Play"
            icon="rocket"
            size="lg"
            onPress={() => router.push("/decks")}
          />
          <CosmicButton
            label="How to Play"
            icon="help-circle"
            variant="secondary"
            onPress={() => router.push("/how-to-play")}
          />
          <CosmicButton
            label="High Scores"
            icon="trophy"
            variant="secondary"
            onPress={() => router.push("/high-scores")}
          />
          <CosmicButton
            label="Settings"
            icon="settings"
            variant="secondary"
            onPress={() => router.push("/settings")}
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  buttons: { gap: theme.spacing.md },
});
