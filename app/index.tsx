import { useEffect } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { executeStartGgQuery } from '../services/startGgApi';

export default function Home() {
  const router = useRouter();
  const token = process.env.EXPO_PUBLIC_STARTGG_TOKEN || '';

  // Función para obtener y guardar tu nombre una sola vez
 const syncGamerTag = async () => {
  try {
    // Query simplificada y correcta
    const query = `query GetMyGamerTag {
      currentUser {
        player {
          gamerTag
        }
      }
    }`;
    
    const data = await executeStartGgQuery(query, token);
    
    // Acceso directo: currentUser -> player -> gamerTag
    const tag = data?.currentUser?.player?.gamerTag;
    
    if (tag) {
      await AsyncStorage.setItem('myGamerTag', tag);
      console.log("✅ GamerTag guardado:", tag);
    } else {
      console.log("⚠️ No se encontró gamerTag. Datos recibidos:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log("❌ Error al obtener el tag:", e);
  }
};

  useEffect(() => {
    syncGamerTag();
  }, []);

  return (
    <View style={styles.container}>
      <Button 
        title="Ver mis torneos" 
        onPress={() => router.push('/tournaments')} 
      />
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { flex: 1, justifyContent: 'center', padding: 20 } 
});