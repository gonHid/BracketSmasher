import { useState, useEffect } from 'react';
import { View, Button, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { executeStartGgQuery, GET_MY_TOURNAMENTS } from '../services/startGgApi';

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const token = process.env.EXPO_PUBLIC_STARTGG_TOKEN || '';

  useEffect(() => { fetchTournaments(); }, []); // Carga automática al entrar

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const data = await executeStartGgQuery(GET_MY_TOURNAMENTS, token);
      setTournaments(data.currentUser.tournaments.nodes);
    } catch (e: any) { alert("Error: " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      {/* Botón Volver */}
      <View style={styles.topBar}>
        <Button title="← Volver" onPress={() => router.back()}/>
      </View>

      <Text style={styles.header}>Mis Torneos</Text>
      
      {loading ? <ActivityIndicator size="large" /> : (
        <FlatList
          data={tournaments}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`${item.slug}`)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, padding: 20 },
  topBar: { marginBottom: 20, alignItems: 'flex-start' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { padding: 15, marginVertical: 8, backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  cardTitle: { fontSize: 18, fontWeight: 'bold' }
});