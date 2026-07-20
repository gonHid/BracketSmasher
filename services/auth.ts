import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getAccessToken() {
    return await AsyncStorage.getItem("userToken");
}