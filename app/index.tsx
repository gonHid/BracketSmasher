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
    console.log("HTTPS...");

    const r1 = await fetch("https://jsonplaceholder.typicode.com/todos/1");

    console.log(await r1.text());

    Alert.alert("HTTPS", "OK");
  } catch (e: any) {
    Alert.alert("HTTPS ERROR", e.message);
  }

  try {
    console.log("HTTP...");

    const r2 = await fetch("http://neverssl.com");

    console.log(await r2.text());

    Alert.alert("HTTP", "OK");
  } catch (e: any) {
    Alert.alert("HTTP ERROR", e.message);
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