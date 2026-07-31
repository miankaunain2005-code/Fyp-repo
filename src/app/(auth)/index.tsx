import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => {
            router.replace("/(auth)/login");
        }, 2500); // 100000 se 2500 kar diya

        return () => clearTimeout(t);
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <LottieView
                source={require("../../assets/lottie/splashanimation.json")}
                autoPlay
                loop
                style={{ width: 250, height: 250 }}
            />
        </View>
    );
}