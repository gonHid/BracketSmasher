import { View, Button, StyleSheet, Alert } from 'react-native';
import * as Linking from 'expo-linking';

export default function Login() {
  const handleLogin = async () => {
    const clientId = process.env.EXPO_PUBLIC_STARTGG_CLIENTID;

    if (!clientId) {
      Alert.alert('Error', 'No existe EXPO_PUBLIC_STARTGG_CLIENTID');
      return;
    }

    const redirectUri = 'bracketsmasher://redirect';

    const authUrl =
      `https://start.gg/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=user.identity`;

    console.log(authUrl);

    await Linking.openURL(authUrl);
  };

  return (
    <View style={styles.container}>
      <Button
        title="Login con Start.gg"
        onPress={handleLogin}
      />
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