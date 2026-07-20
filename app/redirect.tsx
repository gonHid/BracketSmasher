import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeStartGgQuery, GET_MY_PROFILE } from "../services/startGgApi";

export default function Redirect() {
  const { code } = useLocalSearchParams();

  const router = useRouter();

  useEffect(() => {
    if (!code) {
      Alert.alert('No llegó código OAuth');
      return;
    }

    exchange(code as string);
  }, [code]);

  const exchange = async (oauthCode: string) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL!;
      const response = await fetch(
        `${API_URL}/api/auth/exchange`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: oauthCode,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (!data.access_token) {
        Alert.alert('No llegó access_token');
        return;
      }

      await AsyncStorage.setItem(
        'userToken',
        data.access_token
      );

      const me = await executeStartGgQuery(GET_MY_PROFILE);

      await AsyncStorage.multiSet([
        ["myUserId", me.currentUser.id.toString()],
        ["myPlayerId", me.currentUser.player.id.toString()],
        ["myGamerTag", me.currentUser.player.gamerTag],
      ]);

      router.replace('/');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', String(err));
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text>Conectando a Start.gg...</Text>
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