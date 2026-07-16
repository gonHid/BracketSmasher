import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { executeStartGgQuery } from '../../services/startGgApi';

const GET_SETS = `query GetSets($eventId: ID!) {
    event(id: $eventId) {
      sets(page: 1, perPage: 50) {
        nodes { 
          fullRoundText 
          slots {
            entrant {
              name
            }
          }
        }
      }
    }
  }`;
 
export default function SetsScreen() {
  const { eventId } = useLocalSearchParams();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myName, setMyName] = useState("");
  const [showOnlyMySets, setShowOnlyMySets] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // 1. Cargar nombre de usuario
        const savedName = await AsyncStorage.getItem('myGamerTag');
        if (savedName) setMyName(savedName);

        // 2. Cargar sets
        if (eventId) {
          const data = await executeStartGgQuery(GET_SETS, process.env.EXPO_PUBLIC_STARTGG_TOKEN!, { eventId });
          setSets(data.event.sets.nodes);
        }
      } catch (err: any) {
        alert("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [eventId]);

  // Lógica de filtrado
  const filteredSets = showOnlyMySets 
    ? sets.filter((set: any) => 
        set.slots.some((slot: any) => slot.entrant?.name === myName)
      )
    : sets;

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Button title="← Volver" onPress={() => router.back()} />
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterText}>Solo mis peleas</Text>
          <Switch value={showOnlyMySets} onValueChange={setShowOnlyMySets} />
        </View>
      </View>

      <Text style={styles.header}>Enfrentamientos</Text>

      <FlatList
        data={filteredSets}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.roundText}>{item.fullRoundText}</Text>
            <Text style={styles.matchText}>
              {item.slots[0]?.entrant?.name ?? "TBD"} vs {item.slots[1]?.entrant?.name ?? "TBD"}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center' }}>
            No hay enfrentamientos encontrados para: {myName || "usuario"}.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, padding: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterContainer: { flexDirection: 'row', alignItems: 'center' },
  filterText: { marginRight: 8, fontSize: 12, fontWeight: 'bold' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { padding: 15, marginVertical: 8, backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  roundText: { fontSize: 12, color: '#666', marginBottom: 5 },
  matchText: { fontSize: 16, fontWeight: 'bold' }
});