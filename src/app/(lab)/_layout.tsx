import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function LabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveBackgroundColor: "#0D9488",
                tabBarActiveTintColor: "#fff",
                tabBarInactiveTintColor: "#94A3B8",
                tabBarStyle: {
                    position: "absolute", bottom: 15, left: 15, right: 15,
                    height: 70, borderRadius: 20, paddingTop: 10, paddingBottom: 10,
                    backgroundColor: "#fff",
                },
            }}
        >
            <Tabs.Screen name="index" options={{
                title: "Home",
                tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />
            }} />
            <Tabs.Screen name="history" options={{
                title: "History",
                tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} />
            }} />
            <Tabs.Screen name="catalog" options={{
                title: "Catalog",
                tabBarIcon: ({ color }) => <Ionicons name="flask" size={22} color={color} />
            }} />
            <Tabs.Screen name="profile" options={{
                title: "Profile",
                tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />
            }} />

            <Tabs.Screen name="new-order" options={{ href: null }} />
            <Tabs.Screen name="find-report" options={{ href: null }} />
            <Tabs.Screen name="order-detail" options={{ href: null }} />
            <Tabs.Screen name="hospital" options={{ href: null }} />
        </Tabs>
    );
}