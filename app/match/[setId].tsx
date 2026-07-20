import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, ActivityIndicator } from "react-native";
import * as SignalR from "@microsoft/signalr";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export default function MatchScreen() {

  const {
    tournamentId,
    eventId,
    tournamentStartAt,
    setId,
    player1Id,
    player2Id,
    myPlayerId,
  } = useLocalSearchParams();

  const [connection, setConnection] =
    useState<SignalR.HubConnection | null>(null);

  const [connected, setConnected] = useState(false);

  const [bothReady, setBothReady] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const [coinWinnerId, setCoinWinnerId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const conn = new SignalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/matchHub`)
      .withAutomaticReconnect()
      .build();

    // Ambos listos
    conn.on(
      "BothPlayersConnected",
      () => {
        console.log("BothPlayersConnected");
        setBothReady(true);
      }
    );

    // Esperando jugador
    conn.on(
      "WaitingForPlayer",
      () => {
        console.log("WaitingForPlayer");
        setBothReady(false);
      }
    );

    // Resultado moneda
    conn.on(
      "CoinResult",
      (winnerId: number, firstTurnPlayerId: number) => {
        console.log("CoinResult", winnerId);
        setFlipping(false);
        setCoinWinnerId(winnerId);
      }
    );
    conn.onclose(() => {
      console.log("SignalR desconectado");
      setConnected(false);
    });

  // 👇 NUEVO: reconectado
    conn.onreconnected(async () => {
      console.log("SignalR reconectado");
      setConnected(true);
      try {
        console.log({
        tournamentId,
        eventId,
        tournamentStartAt,
        setId,}); 
        await conn.invoke(
          "JoinMatch",
          Number(tournamentId),
          Number(eventId),
          Number(setId),
          Number(tournamentStartAt), // se envía como string ISO
          Number(myPlayerId),
          Number(player1Id),
          Number(player2Id)
        );

        console.log("Reingresado a la sala");

      }
      catch (err) {

        console.error("Error reingresando a la sala:", err);

    }
    });
    async function start() {

      try {

        await conn.start();

        console.log("SignalR conectado");

        setConnection(conn);
        setConnected(true);

        await conn.invoke(
          "JoinMatch",
          Number(setId),
          Number(myPlayerId),
          Number(player1Id),
          Number(player2Id)
        );

      }
      catch (err) {

        console.error("Error SignalR:", err);

      }
      finally {

        setLoading(false);

      }

    }

    start();

    return () => {
      conn.stop();
    };

  }, []);

  async function flipCoin() {

    if (!connection || flipping)
      return;

    setFlipping(true);

    try {

      await connection.invoke(
        "FlipCoin",
        Number(setId)
      );

    }
    catch (err) {

      console.error(err);

    }

  }

  const iWon = coinWinnerId === Number(myPlayerId);

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
              title={flipping ? "Lanzando..." : "🪙 Lanzar moneda"}
              onPress={flipCoin}
              disabled={flipping}
            />

          ) : (

            <View style={{ marginTop: 20 }}>

              {iWon ? (

                <>
                  <Text style={styles.win}>
                    🎉 Ganaste la moneda
                  </Text>

                  <Text style={styles.turn}>
                    Empiezas baneando.
                  </Text>
                </>

              ) : (

                <>
                  <Text style={styles.lose}>
                    😅 El rival ganó la moneda
                  </Text>

                  <Text style={styles.turn}>
                    El rival empieza baneando.
                  </Text>
                </>

              )}

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

  lose: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 10,
  },

  turn: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },

});