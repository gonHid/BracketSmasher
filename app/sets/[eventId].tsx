import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { executeStartGgQuery, GET_SETS } from "../../services/startGgApi";

export default function SetsScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();

  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [tournamentStartAt, setTournamentStartAt] = useState<number | null>(null);

  useEffect(() => {
    initializeAndLoad();
  }, [eventId]);

  async function initializeAndLoad() {
    try {
      const playerId = await AsyncStorage.getItem("myPlayerId");
      const parsedPlayerId = playerId ? Number(playerId) : null;
      setMyPlayerId(parsedPlayerId);

      setPage(1);
      setHasMore(true);
      await loadData(true, parsedPlayerId);
    } catch (e: any) {
      alert(e.message);
      setLoading(false);
    }
  }

  async function loadData(reset = false, overridePlayerId?: number | null) {
    if (!eventId) return;
    if (loadingMore) return;
    if (!hasMore && !reset) return;

    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const activePlayerId = overridePlayerId !== undefined ? overridePlayerId : myPlayerId;
      const currentPage = reset ? 1 : page;

      const data = await executeStartGgQuery(GET_SETS, {
        eventId,
        page: currentPage,
        playerId: activePlayerId,
      });

      setTournamentId(data.event.tournament.id);
      setTournamentStartAt(data.event.tournament.startAt);
      const newSets = data.event.sets.nodes;

      let updatedSets = reset ? newSets : [...sets, ...newSets];

      // Ordenar automáticamente: Priorizar pendientes (1) y en curso (2) sobre finalizados (3)
      updatedSets.sort((a, b) => statePriority(a.state) - statePriority(b.state));

      setSets(updatedSets);

      const totalPages = data.event.sets.pageInfo.totalPages;
      setHasMore(currentPage < totalPages);
      setPage(currentPage + 1);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function statePriority(state: number) {
    switch (state) {
      case 2: // En curso
        return 0;
      case 1: // Pendiente
        return 1;
      case 3: // Finalizado
        return 2;
      default:
        return 3;
    }
  }

  function stateText(state: number) {
    switch (state) {
      case 2:
        return "● EN CURSO";
      case 1:
        return "🕒 PENDIENTE";
      case 3:
        return "✓ FINALIZADO";
      default:
        return "DESCONOCIDO";
    }
  }

  function isMine(set: any) {
    return set.slots.some((slot: any) =>
      slot.entrant?.participants?.some(
        (p: any) => p.player?.id == myPlayerId
      )
    );
  }

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ marginTop: 50 }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Button title="← Volver" onPress={() => router.back()} />
      </View>

      <Text style={styles.header}>Mis Enfrentamientos</Text>

      <FlatList
        data={sets}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => loadData()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null
        }
        renderItem={({ item }) => {
          const slot1 = item.slots[0];
          const slot2 = item.slots[1];

          const p1Mine = slot1?.entrant?.participants?.some(
            (p: any) => p.player?.id == myPlayerId
          );

          const p2Mine = slot2?.entrant?.participants?.some(
            (p: any) => p.player?.id == myPlayerId
          );

          const score1 = slot1?.standing?.stats?.score?.value ?? "-";
          const score2 = slot2?.standing?.stats?.score?.value ?? "-";

          const canOpen = isMine(item) && item.state === 2;

          const player1Name =
            slot1?.entrant?.participants?.[0]?.gamerTag ??
            slot1?.entrant?.name ??
            "TBD";

          const player2Name =
            slot2?.entrant?.participants?.[0]?.gamerTag ??
            slot2?.entrant?.name ??
            "TBD";

          return (
            <Pressable
              disabled={!canOpen}
              onPress={() =>
                router.push({
                  pathname: "/match/[setId]",
                  params: {
                    tournamentId: tournamentId ?? 0,
                    eventId: Number(eventId),
                    tournamentStartAt: tournamentStartAt ?? 0,
                    setId: item.id,
                    player1Id: slot1?.entrant?.participants?.[0]?.player?.id,
                    player2Id: slot2?.entrant?.participants?.[0]?.player?.id,
                    myPlayerId: myPlayerId,
                    player1Tag: player1Name,
                    player2Tag: player2Name,
                  },
                })
              }
            >
              <View style={styles.card}>
                <Text style={styles.state}>{stateText(item.state)}</Text>
                <Text style={styles.round}>{item.fullRoundText}</Text>
                <View style={{ height: 12 }} />
                <Text style={styles.player}>
                  {`${p1Mine ? "🟢" : "⚪"} ${player1Name} (${score1})`}
                </Text>
                <Text style={styles.player}>
                  {`${p2Mine ? "🟢" : "⚪"} ${player2Name} (${score2})`}
                </Text>

                {canOpen && (
                  <View style={styles.enterContainer}>
                    <Text style={styles.enterText}>▶ Entrar a sala</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No tienes enfrentamientos registrados.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  state: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 4,
  },
  round: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },
  player: {
    fontSize: 16,
    marginBottom: 6,
    color: "#111827",
  },
  enterContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  enterText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
});