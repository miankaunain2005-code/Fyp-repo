import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0D9488",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          position: "absolute",
          bottom: 15,
          left: 15,
          right: 15,
          height: 70,
          borderRadius: 20,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: "#fff",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bill-history"
        options={{
          title: "Bill History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-appointments"
        options={{
          title: "My Appoinments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medkit" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* 👇 Ye sab screens hain lekin tab bar mein nahi dikhengi */}
      <Tabs.Screen name="cart" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="consult" options={{ href: null }} />
      <Tabs.Screen name="medicalreports" options={{ href: null }} />
      <Tabs.Screen name="order-from-prescription" options={{ href: null }} />
      <Tabs.Screen name="ai" options={{ href: null }} />
      <Tabs.Screen name="order-success" options={{ href: null }} />
      <Tabs.Screen name="pharmacy" options={{ href: null }} />
      <Tabs.Screen name="prescription-details" options={{ href: null }} />
      <Tabs.Screen name="prescriptionhistory" options={{ href: null }} />
      <Tabs.Screen name="bill-details" options={{ href: null }} />
      <Tabs.Screen name="lab-reports" options={{ href: null }} />
      <Tabs.Screen name="lab-report-details" options={{ href: null }} />
      <Tabs.Screen name="lab-bill-details" options={{ href: null }} />
    </Tabs>
  );
}
