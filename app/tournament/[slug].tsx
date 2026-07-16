import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { executeStartGgQuery } from '../../services/startGgApi';

export default function EventsScreen() {
  const { slug } = useLocalSearchParams(); // Recibe el slug del torneo
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const GET_EVENTS = `query GetEvents($slug: String!) {
    tournament(slug: $slug) {
      events { id name }
    }
  }`;

  useEffect(() => {
    executeStartGgQuery(GET_EVENTS, process.env.EXPO_PUBLIC_STARTGG_TOKEN!, { slug })
      .then(data => {
        setEvents(data.tournament.events);
        setLoading(false);
      })
      .catch(err => {
        alert("Error: " + err.message);
        setLoading(false);
      });
  }, [slug]);

  return (
    <View style={styles.container}>
      {/* Botón Volver consistente */}
      <View style={styles.topBar}>
        <Button title="← Volver" onPress={() => router.back()} />
      </View>

      <Text style={styles.header}>Eventos del Torneo</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => router.push(`/sets/${item.id}`)}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center' }}>No hay eventos disponibles.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, padding: 20 },
  topBar: { marginBottom: 20, alignItems: 'flex-start' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { padding: 15, marginVertical: 8, backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  cardTitle: { fontSize: 18, fontWeight: 'bold' }
});