
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

type BackButtonProps = {
    color?: string;
    backgroundColor?: string;
};

export default function BackButton({
    color = "#111827",
    backgroundColor = "transparent",
}: BackButtonProps) {
    const navigation = useNavigation();

    const handleBack = () => {
        if (navigation.canGoBack()) {
            router.back();
        } else {
            router.replace("/(main)");
        }
    };

    return (
        <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
                styles.button,
                { backgroundColor },
                pressed && styles.pressed,
            ]}
        >
            <Ionicons name="arrow-back" size={24} color={color} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 21,
    },
    pressed: {
        opacity: 0.6,
    },
});
