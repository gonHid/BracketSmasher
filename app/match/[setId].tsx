import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import * as SignalR from "@microsoft/signalr";

import {
  STARTER_STAGES,
  COUNTERPICK_STAGES,
} from "../constants/stages";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

type StageState = "neutral" | "banned" | "selected";

type StageInfo = {
  id: number;
  name: string;
  state: StageState;
};

export default function MatchScreen() {
  const {
    tournamentId,
    eventId,
    tournamentStartAt,
    setId,
    player1Id,
    player2Id,
    myPlayerId,
    player1Tag,
    player2Tag,
  } = useLocalSearchParams();

  const p1Id = Number(player1Id);
  const p2Id = Number(player2Id);
  const meId = Number(myPlayerId);

  const [connection, setConnection] =
    useState<SignalR.HubConnection | null>(null);

  const [connected, setConnected] = useState(false);
  const [bothReady, setBothReady] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const [coinWinnerId, setCoinWinnerId] =
    useState<number | null>(null);

  const [showStageUi, setShowStageUi] = useState(false);
  const [showReportUi, setShowReportUi] = useState(false);

  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Reporte de resultado
  // -----------------------------

  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  const [reportSent, setReportSent] = useState(false);
  const [waitingConfirmation, setWaitingConfirmation] =
    useState(false);

  // -----------------------------
  // Stages
  // -----------------------------

  const [stages, setStages] = useState<StageInfo[]>(
    [...STARTER_STAGES, ...COUNTERPICK_STAGES].map((s) => ({
      ...s,
      state: "neutral",
    }))
  );

  const starterStages = useMemo(
    () => stages.filter((s) => s.id <= 5),
    [stages]
  );

  const counterpickStages = useMemo(
    () => stages.filter((s) => s.id > 5),
    [stages]
  );

  // -----------------------------
  // SignalR
  // -----------------------------

  useEffect(() => {
    const conn = new SignalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/matchHub`)
      .withAutomaticReconnect()
      .build();

    conn.on("BothPlayersConnected", () => {
      setBothReady(true);
    });

    conn.on("WaitingForPlayer", () => {
      setBothReady(false);
    });

    conn.on(
      "CoinResult",
      (winnerId: number) => {
        setFlipping(false);
        setCoinWinnerId(winnerId);
        setShowStageUi(true);
      }
    );

    conn.on(
      "StageStateUpdated",
      (
        stageId: number,
        state: StageState
      ) => {
        setStages((prev) =>
          prev.map((s) => ({
            ...s,
            state:
              s.id === stageId
                ? state
                : state === "selected" &&
                  s.state === "selected"
                ? "neutral"
                : s.state,
          }))
        );
      }
    );

    conn.on("StagesReset", () => {
      setStages((prev) =>
        prev.map((s) => ({
          ...s,
          state: "neutral",
        }))
      );
    });

    conn.on("MatchState", (state: any) => {
      if (state.coinWinnerPlayerId) {
        setCoinWinnerId(state.coinWinnerPlayerId);
        setShowStageUi(true);
      }

      if (state.stages?.length > 0) {
        setStages((prev) =>
          prev.map((s) => {
            const serverStage = state.stages.find(
              (x: any) => x.stageId === s.id
            );

            return serverStage
              ? { ...s, state: serverStage.state }
              : s;
          })
        );
      }
    });

    // -----------------------------
    // Resultado del set
    // -----------------------------

    conn.on("WaitingOpponentReport", () => {
      setWaitingConfirmation(true);
    });

    conn.on("ResultConfirmed", () => {
      setWaitingConfirmation(false);

      Alert.alert(
        "Resultado confirmado",
        "El resultado fue validado por ambos jugadores y enviado a Start.gg."
      );
    });

    conn.on("ResultConflict", (message: string) => {
      setWaitingConfirmation(false);

      Alert.alert(
        "Conflicto en resultado",
        message ??
          "Validar presencialmente con el administrador."
      );
    });

    conn.onclose(() => {
      setConnected(false);
    });

    async function joinCurrentMatch() {
      await conn.invoke(
        "JoinMatch",
        Number(tournamentId),
        Number(eventId),
        Number(setId),
        Number(tournamentStartAt),
        meId,
        p1Id,
        p2Id
      );
    }

    conn.onreconnected(async () => {
      setConnected(true);

      try {
        await joinCurrentMatch();
      } catch (err) {
        console.error(
          "Error reingresando a la sala:",
          err
        );
      }
    });

    async function start() {
      try {
        await conn.start();

        setConnection(conn);
        setConnected(true);

        await joinCurrentMatch();
      } catch (err) {
        console.error("Error SignalR:", err);
      } finally {
        setLoading(false);
      }
    }

    start();

    return () => {
      conn.stop();
    };
  }, []);

  // -----------------------------
  // Coin flip
  // -----------------------------

  async function flipCoin() {
    if (!connection || flipping)
      return;

    setFlipping(true);

    try {
      await connection.invoke(
        "FlipCoin",
        Number(setId)
      );
    } catch (err) {
      console.error(err);
      setFlipping(false);
    }
  }

  // -----------------------------
  // Stages
  // -----------------------------

  async function requestToggleStage(stageId: number) {
    const current = stages.find((s) => s.id === stageId);

    if (!current)
      return;

    const nextState: StageState =
      current.state === "neutral"
        ? "banned"
        : current.state === "banned"
        ? "selected"
        : "neutral";

    if (connection && connected) {
      try {
        await connection.invoke(
          "SetStageState",
          Number(setId),
          stageId,
          nextState,
          meId
        );

        return;
      } catch (err) {
        console.error(err);
      }
    }

    setStages((prev) =>
      prev.map((s) => ({
        ...s,
        state:
          s.id === stageId
            ? nextState
            : nextState === "selected" &&
              s.state === "selected"
            ? "neutral"
            : s.state,
      }))
    );
  }

  async function requestResetStages() {
    if (connection && connected) {
      try {
        await connection.invoke(
          "ResetStages",
          Number(setId)
        );

        return;
      } catch (err) {
        console.error(err);
      }
    }

    setStages((prev) =>
      prev.map((s) => ({
        ...s,
        state: "neutral",
      }))
    );
  }

  // -----------------------------
  // Reportar resultado
  // -----------------------------

  async function submitResult() {
  if (!connection || reportSent)
    return;

  const winnerIsP1 = p1Score > p2Score;

  const winnerPlayerId = winnerIsP1
    ? p1Id
    : p2Id;

  const loserPlayerId = winnerIsP1
    ? p2Id
    : p1Id;

  const winnerTag = winnerIsP1
    ? player1Tag
    : player2Tag;

  const loserTag = winnerIsP1
    ? player2Tag
    : player1Tag;


  const winnerScore = Math.max(
    p1Score,
    p2Score
  );

  const loserScore = Math.min(
    p1Score,
    p2Score
  );


  try {
    await connection.invoke(
      "SubmitResult",

      // identificación del set
      Number(setId),

      // quién está enviando
      meId,

      // ganador
      winnerPlayerId,
      winnerTag,

      // perdedor
      loserPlayerId,
      loserTag,

      // marcador
      winnerScore,
      loserScore
    );


    setReportSent(true);
    setWaitingConfirmation(true);

  } catch (err) {

    console.error(err);

    Alert.alert(
      "Error",
      "No se pudo enviar el resultado."
    );
  }
}

  const selectedStage = stages.find(
    (s) => s.state === "selected"
  );

  const coinWinnerTag =
    coinWinnerId === p1Id
      ? player1Tag
      : player2Tag;

  const firstBannerTag =
    coinWinnerId === p1Id
      ? player1Tag
      : player2Tag;

  // -----------------------------
  // Loading
  // -----------------------------

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>
          Conectando a la sala...
        </Text>
      </View>
    );
  }

  // -----------------------------
  // Report UI
  // -----------------------------

  if (showReportUi) {
    return (
      <View style={styles.container}>

        <Text style={styles.title}>
          Reportar resultado
        </Text>

        <View style={styles.scoreCard}>

          <View style={styles.scoreRow}>

            <Text style={styles.playerTag}>
              {player1Tag}
            </Text>

            <View style={styles.scoreButtons}>

              <Button
                title="-"
                onPress={() =>
                  setP1Score((s) => Math.max(0, s - 1))
                }
              />

              <Text style={styles.scoreText}>
                {p1Score}
              </Text>

              <Button
                title="+"
                onPress={() => setP1Score((s) => s + 1)}
              />

            </View>

          </View>

          <View style={styles.scoreRow}>

            <Text style={styles.playerTag}>
              {player2Tag}
            </Text>

            <View style={styles.scoreButtons}>

              <Button
                title="-"
                onPress={() =>
                  setP2Score((s) => Math.max(0, s - 1))
                }
              />

              <Text style={styles.scoreText}>
                {p2Score}
              </Text>

              <Button
                title="+"
                onPress={() => setP2Score((s) => s + 1)}
              />

            </View>

          </View>

        </View>

        <Text style={styles.previewText}>
          {player1Tag}: {p1Score} vs {player2Tag}: {p2Score}
        </Text>

        {waitingConfirmation ? (
          <Text style={styles.waitingConfirm}>
            ⏳ Esperando confirmación del rival...
          </Text>
        ) : (
          <Button
            title="✅ Enviar resultado"
            onPress={submitResult}
            disabled={p1Score === p2Score || reportSent}
          />
        )}

        <View style={{ height: 12 }} />

        <Button
          title="⬅ Volver"
          onPress={() => setShowReportUi(false)}
        />

      </View>
    );
  }

  // -----------------------------
  // Stage UI
  // -----------------------------

  if (showStageUi) {
    return (
      <View style={styles.container}>

        <Text style={styles.title}>
          Selección de etapas
        </Text>

        <Text style={styles.turn}>
          🎯 {firstBannerTag} comienza baneando
        </Text>

        {selectedStage && (
          <View style={styles.selectedBanner}>
            <Text style={styles.selectedBannerText}>
              ✅ Etapa seleccionada: {selectedStage.name}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Starter stages
        </Text>

        <View style={styles.grid}>
          {starterStages.map((stage) => (
            <Pressable
              key={stage.id}
              style={[
                styles.stageCard,
                stage.state === "banned" &&
                  styles.stageBanned,
                stage.state === "selected" &&
                  styles.stageSelected,
              ]}
              onPress={() =>
                requestToggleStage(stage.id)
              }
            >
              <Text style={styles.stageName}>
                {stage.name}
              </Text>

              <Text style={styles.stageMark}>
                {stage.state === "banned"
                  ? "❌"
                  : stage.state === "selected"
                  ? "✅"
                  : "⬜"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Counterpick stages
        </Text>

        <View style={styles.grid}>
          {counterpickStages.map((stage) => (
            <Pressable
              key={stage.id}
              style={[
                styles.stageCard,
                stage.state === "banned" &&
                  styles.stageBanned,
                stage.state === "selected" &&
                  styles.stageSelected,
              ]}
              onPress={() =>
                requestToggleStage(stage.id)
              }
            >
              <Text style={styles.stageName}>
                {stage.name}
              </Text>

              <Text style={styles.stageMark}>
                {stage.state === "banned"
                  ? "❌"
                  : stage.state === "selected"
                  ? "✅"
                  : "⬜"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.buttonsContainer}>

          <Button
            title="🔄 Reiniciar etapas"
            onPress={requestResetStages}
          />

          <Button
            title="🎮 Terminar juego"
            onPress={requestResetStages}
          />

          <Button
            title="📢 Informar resultado"
            onPress={() => setShowReportUi(true)}
          />

        </View>

      </View>
    );
  }

  // -----------------------------
  // Main screen
  // -----------------------------

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Sala del set
      </Text>

      <Text style={styles.status}>
        {connected
          ? "🟢 Conectado al servidor"
          : "🔴 Desconectado"}
      </Text>

      <Text style={styles.info}>
        Set ID: {setId}
      </Text>

      {!bothReady ? (
        <View style={styles.box}>
          <Text style={styles.waiting}>
            ⏳ Esperando al otro jugador...
          </Text>
        </View>
      ) : (
        <View style={styles.box}>

          <Text style={styles.ready}>
            ✅ Ambos jugadores listos
          </Text>

          {!coinWinnerId ? (
            <Button
              title={
                flipping
                  ? "Lanzando..."
                  : "🪙 Lanzar moneda"
              }
              onPress={flipCoin}
              disabled={flipping}
            />
          ) : (
            <View style={{ marginTop: 20 }}>

              <Text style={styles.win}>
                🎉 {coinWinnerTag} ganó la moneda
              </Text>

              <Text style={styles.turn}>
                {firstBannerTag} empieza baneando.
              </Text>

            </View>
          )}

        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },

  status: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },

  info: {
    textAlign: "center",
    marginBottom: 20,
    color: "#64748b",
  },

  box: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 24,
    backgroundColor: "#f8fafc",
  },

  waiting: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },

  ready: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    color: "#16a34a",
  },

  win: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 10,
  },

  turn: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    color: "#0f172a",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  stageCard: {
    width: "48%",
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#ffffff",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  stageBanned: {
    backgroundColor: "#fee2e2",
    borderColor: "#dc2626",
  },

  stageSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
  },

  stageName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  stageMark: {
    fontSize: 26,
    textAlign: "right",
  },

  selectedBanner: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#16a34a",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },

  selectedBannerText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#166534",
  },

  buttonsContainer: {
    marginTop: 28,
    gap: 12,
  },

  scoreCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 16,
    marginVertical: 20,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  playerTag: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 12,
  },

  scoreButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  scoreText: {
    fontSize: 28,
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
  },

  previewText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },

  waitingConfirm: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#ea580c",
    marginBottom: 20,
  },
});