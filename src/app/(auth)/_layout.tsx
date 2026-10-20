import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerTitleAlign: "center",
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="signup"
                options={{
                    title: "Create Account",
                    headerStyle: {
                        backgroundColor: "#123B56",
                    },
                    headerTintColor: "#FFFFFF",
                    headerBackButtonDisplayMode: "minimal",

                }}
            />

            <Stack.Screen
                name="forgot-password"
                options={{
                    title: "Reset Password",
                    headerStyle: {
                        backgroundColor: "#edf1f4",
                    },
                    headerTintColor: "#070707",
                    headerBackButtonDisplayMode: "minimal",
                }}
            />

            <Stack.Screen
                name="verify-email"
                options={{
                    title: "Verify Email",
                    headerStyle: {
                        backgroundColor: "#123B56",
                    },
                    headerTintColor: "#FFFFFF",
                    headerBackButtonDisplayMode: "minimal",

                }}
            />
        </Stack>
    );
}