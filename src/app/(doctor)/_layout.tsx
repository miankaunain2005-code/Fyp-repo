import { Stack } from "expo-router";

export default function DoctorLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="search-patient" />
            <Stack.Screen name="patient-details" />
            <Stack.Screen name="consultation" />
            <Stack.Screen name="prescription" />
            <Stack.Screen name="history" />
        </Stack>
    );
}

