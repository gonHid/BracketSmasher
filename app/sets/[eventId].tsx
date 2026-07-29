import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button,
  Switch,
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
  const [showOnlyMySets, setShowOnlyMySets] = useState(false);

  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [tournamentStartAt, setTournamentStartAt] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadData(true);
  }, [eventId]);

  async function loadData(reset = false) {
    if (!eventId) return;
    if (loadingMore) return;
    if (!hasMore && !reset) return;

    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const playerId = await AsyncStorage.getItem("myPlayerId");

      if (playerId) setMyPlayerId(Number(playerId));

      const currentPage = reset ? 1 : page;

      const data = await executeStartGgQuery(GET_SETS, {
        eventId,
        page: currentPage,
      });
      setTournamentId(data.event.tournament.id);
      setTournamentStartAt(data.event.tournament.startAt);
      const newSets = data.event.sets.nodes;

      if (reset) setSets(newSets);
      else setSets((prev) => [...prev, ...newSets]);

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

  //--------------------------------------------------------
  // Helpers
  //--------------------------------------------------------

  function isMine(set: any) {
    return set.slots.some((slot: any) =>
      slot.entrant?.participants?.some(
        (p: any) => p.player?.id == myPlayerId
      )
    );
  }

  function statePriority(state: number) {
    switch (state) {
      case 2:
        return 0;
      case 1:
        return 1;
      case 3:
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

  //--------------------------------------------------------
  // Filtrado
  //--------------------------------------------------------

  let visibleSets = sets.filter((set: any) => {
    const p1 = set.slots[0]?.entrant;
    const p2 = set.slots[1]?.entrant;

    return p1 || p2;
  });

  if (showOnlyMySets) {
    visibleSets = visibleSets.filter(isMine);
  }

  //--------------------------------------------------------
  // Orden
  //--------------------------------------------------------

  visibleSets.sort((a, b) => {
    const aMine = isMine(a);
    const bMine = isMine(b);

    if (aMine && !bMine) return -1;
    if (!aMine && bMine) return 1;

    return statePriority(a.state) - statePriority(b.state);
  });

  //--------------------------------------------------------

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

        <Button
          title="← Volver"
          onPress={() => router.back()}
        />

        <View style={styles.filterContainer}>

          <Text style={styles.filterText}>
            Solo mis peleas
          </Text>

          <Switch
            value={showOnlyMySets}
            onValueChange={setShowOnlyMySets}
          />

        </View>

      </View>

      <Text style={styles.header}>
        Enfrentamientos
      </Text>

      <FlatList
        data={visibleSets}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => loadData()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator style={{ marginVertical: 20 }} />
            : null
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

          const score1 =
            slot1?.standing?.stats?.score?.value ?? "-";

          const score2 =
            slot2?.standing?.stats?.score?.value ?? "-";

          const canOpen =
            isMine(item) &&
            item.state === 2;

          const player1Id =
            slot1?.entrant?.participants?.[0]?.player?.id;

          const player2Id =
            slot2?.entrant?.participants?.[0]?.player?.id;

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
                    // datos del torneo
                    tournamentId: tournamentId ?? 0,
                    eventId: Number(eventId),
                    tournamentStartAt: tournamentStartAt ?? 0,

                    // datos del set
                    setId: item.id,

                    // jugadores
                    player1Id:
                      slot1?.entrant?.participants?.[0]?.player?.id,

                    player2Id:
                      slot2?.entrant?.participants?.[0]?.player?.id,

                    myPlayerId: myPlayerId,
                    player1Tag:
                      slot1?.entrant?.participants?.[0]?.gamerTag ??
                      slot1?.entrant?.name,

                    player2Tag:
                      slot2?.entrant?.participants?.[0]?.gamerTag ??
                      slot2?.entrant?.name,
                  },
                })
              }
            >

              <View style={styles.card}>

                <Text style={styles.state}>
                  {stateText(item.state)}
                </Text>

                <Text style={styles.round}>
                  {item.fullRoundText}
                </Text>

                <View style={{ height: 12 }} />

                <Text style={styles.player}>
                  {`${p1Mine ? "🟢" : "⚪"} ${player1Name} (${score1})`}
                </Text>

                <Text style={styles.player}>
                  {`${p2Mine ? "🟢" : "⚪"} ${player2Name} (${score2})`}
                </Text>

                {canOpen && (
                  <View style={styles.enterContainer}>
                    <Text style={styles.enterText}>
                      ▶ Entrar a sala
                    </Text>
                  </View>
                )}

              </View>

            </Pressable>

          );

        }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center" }}>
            No hay enfrentamientos.
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  filterText: {
    marginRight: 8,
    fontWeight: "bold",
    fontSize: 12,
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