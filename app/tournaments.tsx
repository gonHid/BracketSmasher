import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../services/notifications";
import {
  View,
  Button,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
  const API_URL = process.env.EXPO_PUBLIC_API_URL!;

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
  registerDevice();
}, []);

async function registerDevice() {
  try {
    const playerId = await AsyncStorage.getItem("myPlayerId");

    if (!playerId) {
      Alert.alert("Depuración", "No se encontró myPlayerId en AsyncStorage");
      return;
    }

    const expoPushToken = await registerForPushNotificationsAsync();

    if (!expoPushToken) {
      // La alerta del motivo ya se mostró dentro de registerForPushNotificationsAsync
      return;
    }

    // Nota: Comentamos temporalmente la comparación con 'lastPushToken' 
    // para forzar que intente registrar el token en la BD en esta prueba APK.

    const response = await fetch(`${API_URL}/api/device/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId: Number(playerId),
        pushToken: expoPushToken,
      }),
    });

    if (response.ok) {
      await AsyncStorage.setItem("lastPushToken", expoPushToken);
    } else {
      const errorText = await response.text();
      Alert.alert("Error Backend", `Status ${response.status}: ${errorText}`);
    }
  } catch (err: any) {
    Alert.alert("Error en Red/Fetch", err.message || String(err));
  }
}

  async function fetchTournaments() {
    setLoading(true);

    try {
      const data = await executeStartGgQuery(GET_MY_TOURNAMENTS);
      if (!data || !data.currentUser) {
        Alert.alert(
          "Sesión expirada", 
          "Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.multiRemove(["userToken", "myUserId", "myPlayerId", "myGamerTag"]);
                router.replace('/'); // 👈 Redirige al Home para forzar el flujo de Login
              }
            }
          ]
        );
        return;
      }
      const tournaments = data.currentUser.tournaments.nodes;
      const now = Math.floor(Date.now() / 1000);

      const ordered = [...tournaments].sort((a: any, b: any) => {
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

        // En curso → comienza antes primero
        if (pa === 0)
          return (a.startAt ?? 0) - (b.startAt ?? 0);

        // Futuros → más cercano primero
        if (pa === 1)
          return (a.startAt ?? 0) - (b.startAt ?? 0);

        // Pasados → más reciente primero
        return (b.endAt ?? 0) - (a.endAt ?? 0);
      });

      setTournaments(ordered);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatus(item: any) {
    const now = Math.floor(Date.now() / 1000);

    const start = item.startAt ?? 0;
    const end = item.endAt ?? start;

    if (now >= start && now <= end)
      return "🟢 EN CURSO";

    if (start > now)
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
              onPress={() => router.push(`/${item.slug}`)}
            >
              <Text style={styles.status}>
                {getStatus(item)}
              </Text>

              <Text style={styles.cardTitle}>
                {item.name}
              </Text>

              <Text style={styles.date}>
                {item.startAt
                  ? new Date(item.startAt * 1000).toLocaleDateString()
                  : "Sin fecha"}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No tienes torneos de Smash Ultimate registrados.
            </Text>
          }
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
    backgroundColor: "#f8fafc",
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  status: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 13,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },

  date: {
    marginTop: 6,
    color: "#666",
  },
});