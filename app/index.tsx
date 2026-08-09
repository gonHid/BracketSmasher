import { useEffect, useState } from 'react';
// 1. Añadido Platform a las importaciones de react-native
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import Login from './login';
import Tournaments from './tournaments';

// 2. Corregido el handler para las versiones más recientes de expo-notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Para compatibilidad con versiones anteriores
    shouldShowBanner: true, // 👈 Requerido ahora
    shouldShowList: true,   // 👈 Requerido ahora
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL!;
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('userToken');
    setIsAuthenticated(!!token);
  };

  if (isAuthenticated === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isAuthenticated ? <Tournaments /> : <Login />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});