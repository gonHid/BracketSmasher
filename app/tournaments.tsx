import { useState, useEffect } from "react";
import {
  View,
  Button,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  executeStartGgQuery,
  GET_MY_TOURNAMENTS,
} from "../services/startGgApi";

export default function TournamentsScreen() {

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {

    setLoading(true);

    try {

      const data = await executeStartGgQuery(GET_MY_TOURNAMENTS);

      const now = Math.floor(Date.now() / 1000);

      const ordered = [...data.currentUser.tournaments.nodes].sort(
        (a: any, b: any) => {

          const priority = (tournament: any) => {

            const start = tournament.startAt ?? 0;
            const end = tournament.endAt ?? start;

            // Torneo ocurriendo ahora
            if (now >= start && now <= end)
              return 0;

            // Futuro
            if (start > now)
              return 1;

            // Pasado
            return 2;
          };

          const pa = priority(a);
          const pb = priority(b);

          if (pa !== pb)
            return pa - pb;

          //-------------------------------------------------
          // Dentro de cada grupo
          //-------------------------------------------------

          // En curso -> comienza antes primero
          if (pa === 0)
            return a.startAt - b.startAt;

          // Futuros -> más cercano primero
          if (pa === 1)
            return a.startAt - b.startAt;

          // Pasados -> más reciente primero
          return b.endAt - a.endAt;

        }
      );

      setTournaments(ordered);

    } catch (e: any) {

      alert(e.message);

    } finally {

      setLoading(false);

    }

  }

  function getStatus(item: any) {

    const now = Math.floor(Date.now() / 1000);

    if (now >= item.startAt && now <= item.endAt)
      return "🟢 EN CURSO";

    if (item.startAt > now)
      return "🕒 PRÓXIMO";

    return "✓ FINALIZADO";

  }

  return (

    <View style={styles.container}>

      <View style={styles.topBar}>
        <Button
          title="← Volver"
          onPress={() => router.back()}
        />
      </View>

      <Text style={styles.header}>
        Mis Torneos
      </Text>

      {loading ? (

        <ActivityIndicator size="large" />

      ) : (

        <FlatList
          data={tournaments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`${item.slug}`)}
            >

              <Text style={styles.status}>
                {getStatus(item)}
              </Text>

              <Text style={styles.cardTitle}>
                {item.name}
              </Text>

              <Text style={styles.date}>
                {new Date(item.startAt * 1000).toLocaleDateString()}
              </Text>

            </TouchableOpacity>

          )}
        />

      )}

    </View>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingTop: 60,
    padding: 20,
  },

  topBar: {
    marginBottom: 20,
    alignItems: "flex-start",
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  card: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  status: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 13,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  date: {
    marginTop: 6,
    color: "#666",
  },

});