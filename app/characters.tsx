import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

// Mapa estático para asociar el nombre del personaje con su respectivo icono local
const CHARACTER_ICONS: { [key: string]: any } = {
  "Bayonetta": require("../assets/images/smash_icons/Bayonetta_icon.png"),
  "Bowser": require("../assets/images/smash_icons/Bowser_icon.png"),
  "Bowser Jr.": require("../assets/images/smash_icons/Bowser_Jr._icon.png"),
  "Captain Falcon": require("../assets/images/smash_icons/Captain_Falcon_icon.png"),
  "Cloud": require("../assets/images/smash_icons/Cloud_icon.png"),
  "Corrin": require("../assets/images/smash_icons/Corrin_icon.png"),
  "Daisy": require("../assets/images/smash_icons/Daisy_icon.png"),
  "Dark Pit": require("../assets/images/smash_icons/Dark_Pit_icon.png"),
  "Dark Samus": require("../assets/images/smash_icons/Dark_Samus_icon.png"),
  "Diddy Kong": require("../assets/images/smash_icons/Diddy_Kong_icon.png"),
  "Donkey Kong": require("../assets/images/smash_icons/Donkey_Kong_icon.png"),
  "Dr. Mario": require("../assets/images/smash_icons/Dr._Mario_icon.png"),
  "Duck Hunt": require("../assets/images/smash_icons/Duck_Hunt_icon.png"),
  "Falco": require("../assets/images/smash_icons/Falco_icon.png"),
  "Fox": require("../assets/images/smash_icons/Fox_icon.png"),
  "Ganondorf": require("../assets/images/smash_icons/Ganondorf_icon.png"),
  "Greninja": require("../assets/images/smash_icons/Greninja_icon.png"),
  "Hero": require("../assets/images/smash_icons/Hero_icon.png"),
  "Ice Climbers": require("../assets/images/smash_icons/Ice_Climbers_icon.png"),
  "Ike": require("../assets/images/smash_icons/Ike_icon.png"),
  "Incineroar": require("../assets/images/smash_icons/Incineroar_icon.png"),
  "Inkling": require("../assets/images/smash_icons/Inkling_icon.png"),
  "Isabelle": require("../assets/images/smash_icons/Isabelle_icon.png"),
  "Jigglypuff": require("../assets/images/smash_icons/Jigglypuff_icon.png"),
  "Joker": require("../assets/images/smash_icons/Joker_icon.png"),
  "Kazuya": require("../assets/images/smash_icons/Kazuya_icon.png"),
  "King Dedede": require("../assets/images/smash_icons/King_Dedede_icon.png"),
  "King K. Rool": require("../assets/images/smash_icons/King_K._Rool_icon.png"),
  "Kirby": require("../assets/images/smash_icons/Kirby_icon.png"),
  "Link": require("../assets/images/smash_icons/Link_icon.png"),
  "Little Mac": require("../assets/images/smash_icons/Little_Mac_icon.png"),
  "Lucario": require("../assets/images/smash_icons/Lucario_icon.png"),
  "Lucas": require("../assets/images/smash_icons/Lucas_icon.png"),
  "Lucina": require("../assets/images/smash_icons/Lucina_icon.png"),
  "Luigi": require("../assets/images/smash_icons/Luigi_icon.png"),
  "Mario": require("../assets/images/smash_icons/Mario_icon.png"),
  "Marth": require("../assets/images/smash_icons/Marth_icon.png"),
  "Mega Man": require("../assets/images/smash_icons/Mega_Man_icon.png"),
  "Meta Knight": require("../assets/images/smash_icons/Meta_Knight_icon.png"),
  "Mewtwo": require("../assets/images/smash_icons/Mewtwo_icon.png"),
  "Mii Brawler": require("../assets/images/smash_icons/Mii_Brawler_icon.png"),
  "Mii Gunner": require("../assets/images/smash_icons/Mii_Gunner_icon.png"),
  "Mii Swordfighter": require("../assets/images/smash_icons/Mii_Swordfighter_icon.png"),
  "Min Min": require("../assets/images/smash_icons/Min_Min_icon.png"),
  "Mr. Game & Watch": require("../assets/images/smash_icons/Mr._Game__Watch_icon.png"),
  "Ness": require("../assets/images/smash_icons/Ness_icon.png"),
  "Olimar": require("../assets/images/smash_icons/Olimar_icon.png"),
  "Pac-Man": require("../assets/images/smash_icons/Pac-Man_icon.png"),
  "Palutena": require("../assets/images/smash_icons/Palutena_icon.png"),
  "Peach": require("../assets/images/smash_icons/Peach_icon.png"),
  "Pichu": require("../assets/images/smash_icons/Pichu_icon.png"),
  "Pikachu": require("../assets/images/smash_icons/Pikachu_icon.png"),
  "Piranha Plant": require("../assets/images/smash_icons/Piranha_Plant_icon.png"),
  "Pit": require("../assets/images/smash_icons/Pit_icon.png"),
  "Pokemon Trainer": require("../assets/images/smash_icons/Pokemon_Trainer_icon.png"),
  "Pyra & Mythra": require("../assets/images/smash_icons/Pyra__Mythra_icon.png"),
  "R.O.B.": require("../assets/images/smash_icons/R.O.B._icon.png"),
  "Random Character": require("../assets/images/smash_icons/Random_Character_icon.png"),
  "Richter": require("../assets/images/smash_icons/Richter_icon.png"),
  "Ridley": require("../assets/images/smash_icons/Ridley_icon.png"),
  "Robin": require("../assets/images/smash_icons/Robin_icon.png"),
  "Rosalina": require("../assets/images/smash_icons/Rosalina_icon.png"),
  "Roy": require("../assets/images/smash_icons/Roy_icon.png"),
  "Ryu": require("../assets/images/smash_icons/Ryu_icon.png"),
  "Samus": require("../assets/images/smash_icons/Samus_icon.png"),
  "Sephiroth": require("../assets/images/smash_icons/Sephiroth_icon.png"),
  "Sheik": require("../assets/images/smash_icons/Sheik_icon.png"),
  "Shulk": require("../assets/images/smash_icons/Shulk_icon.png"),
  "Simon Belmont": require("../assets/images/smash_icons/Simon_Belmont_icon.png"),
  "Snake": require("../assets/images/smash_icons/Snake_icon.png"),
  "Sonic": require("../assets/images/smash_icons/Sonic_icon.png"),
  "Sora": require("../assets/images/smash_icons/Sora_icon.png"),
  "Steve": require("../assets/images/smash_icons/Steve_icon.png"),
  "Terry": require("../assets/images/smash_icons/Terry_icon.png"),
  "Toon Link": require("../assets/images/smash_icons/Toon_Link_icon.png"),
  "Villager": require("../assets/images/smash_icons/Villager_icon.png"),
  "Wario": require("../assets/images/smash_icons/Wario_icon.png"),
  "Wii Fit Trainer": require("../assets/images/smash_icons/Wii_Fit_Trainer_icon.png"),
  "Wolf": require("../assets/images/smash_icons/Wolf_icon.png"),
  "Yoshi": require("../assets/images/smash_icons/Yoshi_icon.png"),
  "Young Link": require("../assets/images/smash_icons/Young_Link_icon.png"),
  "Zelda": require("../assets/images/smash_icons/Zelda_icon.png"),
  "Zero Suit Samus": require("../assets/images/smash_icons/Zero_Suit_Samus_icon.png"),
};

export default function CharactersScreen() {
  const router = useRouter();
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  useEffect(() => {
    loadSavedCharacters();
  }, []);

  async function loadSavedCharacters() {
    try {
      const saved = await AsyncStorage.getItem("selectedCharacters");
      if (saved) {
        setSelectedCharacters(JSON.parse(saved));
      }
    } catch (e) {
      console.log("Error cargando personajes:", e);
    }
  }

  const toggleCharacter = (char: string) => {
    if (selectedCharacters.includes(char)) {
      setSelectedCharacters(selectedCharacters.filter((c) => c !== char));
    } else {
      setSelectedCharacters([...selectedCharacters, char]);
    }
  };

  const handleSave = async () => {
    if (selectedCharacters.length === 0) {
      Alert.alert("Atención", "Debes seleccionar al menos un personaje.");
      return;
    }

    try {
      await AsyncStorage.setItem(
        "selectedCharacters",
        JSON.stringify(selectedCharacters)
      );
      Alert.alert("Éxito", "Personajes actualizados correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "No se pudieron guardar los personajes.");
    }
  };

  const charactersList = Object.keys(CHARACTER_ICONS);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Button title="← Volver" onPress={() => router.back()} />
        <Button title="Guardar" onPress={handleSave} />
      </View>

      <Text style={styles.header}>Selecciona tus Personajes</Text>
      <Text style={styles.subHeader}>
        {selectedCharacters.length} personajes seleccionados
      </Text>

      <FlatList
        data={charactersList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isSelected = selectedCharacters.includes(item);
          const iconSource = CHARACTER_ICONS[item];

          return (
            <TouchableOpacity
              style={[styles.itemCard, isSelected && styles.itemCardSelected]}
              onPress={() => toggleCharacter(item)}
            >
              <View style={styles.rowLeft}>
                {iconSource && (
                  <Image source={iconSource} style={styles.iconImage} />
                )}
                <Text
                  style={[styles.itemText, isSelected && styles.itemTextSelected]}
                >
                  {item}
                </Text>
              </View>
              <Text style={styles.checkbox}>{isSelected ? "☑" : "☐"}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0f172a",
  },
  subHeader: {
    fontSize: 13,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemCardSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconImage: {
    width: 36,
    height: 36,
    marginRight: 12,
    resizeMode: "contain",
  },
  itemText: {
    fontSize: 16,
    color: "#334155",
  },
  itemTextSelected: {
    fontWeight: "bold",
    color: "#1d4ed8",
  },
  checkbox: {
    fontSize: 18,
  },
});