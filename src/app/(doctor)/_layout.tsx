import { Stack } from "expo-router";

export default function DoctorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="search-patient" />
      <Stack.Screen name="consultation" />
      <Stack.Screen name="prescription-view" />
      <Stack.Screen name="prisciptionhistory" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="lab-reports" />
      <Stack.Screen name="lab-report-view" />
    </Stack>
  );
}