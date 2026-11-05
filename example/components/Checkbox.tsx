import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "./Button";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description?: string;
}

export function Checkbox({
  checked,
  onToggle,
  title,
  description,
}: CheckboxProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onToggle}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description != null && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowPressed: {
    opacity: 0.6,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#48484A",
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 13,
    color: "#8E8E93",
  },
});
