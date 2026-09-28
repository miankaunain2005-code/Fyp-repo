import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function AuthGuard({ children }: any) {
  const { user, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; //  wait for Firebase restore

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    if (user && inAuthGroup) {
      if (role === "doctor") {
        router.replace("/(doctor)");
      } else if (role === "patient") {
        router.replace("/(main)");
      } else if (role === "pharmacy") {
        router.replace("/(pharmacy)");
      } else if (role === "reception") {
        router.replace("/(reception)");
      }
      // else if (role === "admin") {
      //   router.replace("/(admin)");
      // }
    }
  }, [user, role, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    RobotoSlab: require("../assets/fonts/RobotoSlab-ExtraBold.ttf"),
  });
  if (!loaded) return null;
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </AuthProvider>
  );
}
