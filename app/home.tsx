import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenBackground } from "../components/ScreenBackground";
import { PoppinsText } from "../components/PoppinsText";
import { CosmicButton } from "../components/CosmicButton";
import { Mascot } from "../components/Mascot";
import { useGame } from "../context/GameContext";
import { DAILY_DECK_ID } from "../data/daily";
import { theme } from "../theme/theme";

export default function Home() {
  const router = useRouter();
  const { setGameMode, setSelectedDeckId, endTeamMatch } = useGame();

  const playSolo = () => {
    endTeamMatch(); // clears any stale team state
    setGameMode("solo");
    router.push("/decks");
  };

  const playTeams = () => {
    router.push("/teams");
  };

  const playDaily = () => {
    endTeamMatch();
    setGameMode("daily");
    setSelectedDeckId(DAILY_DECK_ID);
    router.push("/pregame");
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Mascot mood="happy" size={110} />
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
          <CosmicButton label="Quick Play" icon="rocket" size="lg" onPress={playSolo} />
          <CosmicButton label="Team Battle" icon="people" size="lg" color="#F87171" onPress={playTeams} />
          <CosmicButton label="Daily Challenge" icon="calendar" color="#B45309" onPress={playDaily} />
          <View style={styles.row}>
            <CosmicButton
              label="How to Play"
              icon="help-circle"
              variant="secondary"
              style={styles.rowButton}
              onPress={() => router.push("/how-to-play")}
            />
            <CosmicButton
              label="Stats"
              icon="stats-chart"
              variant="secondary"
              style={styles.rowButton}
              onPress={() => router.push("/stats")}
            />
          </View>
          <View style={styles.row}>
            <CosmicButton
              label="High Scores"
              icon="trophy"
              variant="secondary"
              style={styles.rowButton}
              onPress={() => router.push("/high-scores")}
            />
            <CosmicButton
              label="Settings"
              icon="settings"
              variant="secondary"
              style={styles.rowButton}
              onPress={() => router.push("/settings")}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  buttons: { gap: theme.spacing.md },
  row: { flexDirection: "row", gap: theme.spacing.md },
  rowButton: { flex: 1 },
});
