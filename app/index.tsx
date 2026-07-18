import { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Button,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from './login';
import Tournaments from './tournaments';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('userToken');
    setIsAuthenticated(!!token);
  };

  const testConnection = async () => {
    try {
      Alert.alert("Probando conexión...");

      const response = await fetch(
        "http://192.168.12.11:5016/swagger/v1/swagger.json"
      );

      Alert.alert(
        "Respuesta",
        `Status: ${response.status}`
      );

      const text = await response.text();

      console.log(text);

      Alert.alert(
        "OK",
        text.substring(0, 300)
      );
    } catch (e: any) {
      console.log(e);

      Alert.alert(
        "ERROR",
        JSON.stringify({
          name: e.name,
          message: e.message,
          stack: e.stack
        })
      );
    }
  };

  if (isAuthenticated === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />

        <Button
          title="Probar Backend"
          onPress={testConnection}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ marginTop: 50 }}>
        <Button
          title="Probar Backend"
          onPress={testConnection}
        />
      </View>

      <View style={{ flex: 1 }}>
        {isAuthenticated ? <Tournaments /> : <Login />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});