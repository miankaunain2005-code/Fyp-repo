import { Stack } from "expo-router";

export default function PharmacyLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="prescription-detail" />
            <Stack.Screen name="bill-history" />
        </Stack>
    );
}