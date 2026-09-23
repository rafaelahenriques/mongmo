import { StyleSheet, Text, View } from "react-native";

export default function PopupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pop-ups Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
  },
});
