import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function ReceptionLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveBackgroundColor: "#0D9488",
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          position: "sticky",
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
      />{" "}
      <Tabs.Screen
        name="online-orders"
        options={{
          title: "Online orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-handle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-medicine"
        options={{
          title: "Add Medicine",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-add-outline" size={size} color={color} />
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
      <Tabs.Screen name="bill-detail" options={{ href: null }} />
      <Tabs.Screen name="edit-medicine" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="online-order-detail" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ href: null }} />
      <Tabs.Screen name="prescription-history" options={{ href: null }} />
      <Tabs.Screen name="prescription-detail" options={{ href: null }} />
      <Tabs.Screen name="bill-history" options={{ href: null }} />

    </Tabs>
  );
}

