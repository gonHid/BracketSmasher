import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert("Aviso", "Las notificaciones push requieren un dispositivo físico");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("Permisos", "Permiso de notificaciones rechazado por el usuario");
    return null;
  }

  try {
    // projectId para Expo SDK 49+
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    return token.data;
  } catch (e: any) {
    Alert.alert("Error Expo Push Token", e.message || String(e));
    return null;
  }
}