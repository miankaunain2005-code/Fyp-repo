import { Stack } from "expo-router";

export default function PharmacyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen name="prescription-detail" />

      <Stack.Screen name="bill-history" />
      <Stack.Screen name="bill-detail" />
      <Stack.Screen name="online-orders" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="online-order-detail" />
    </Stack>
  );
}
