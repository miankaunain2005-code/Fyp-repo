import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function AIChatScreen() {
    const flatListRef = useRef<FlatList>(null);

    const [message, setMessage] = useState("");

    const [messages, setMessages] = useState([
        {
            id: "1",
            text: "Hello 👋 I am MediCare AI. How can I help you today?",
            sender: "bot",
        },
    ]);

    const sendMessage = () => {
        if (!message.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            text: message,
            sender: "user",
        };

        setMessages((prev: any) => [...prev, userMessage]);

        setTimeout(() => {
            const botMessage = {
                id: Math.random().toString(),
                text: "This is demo AI response. OpenAI API will be connected later.",
                sender: "bot",
            };

            setMessages((prev: any) => [...prev, botMessage]);

            flatListRef.current?.scrollToEnd({
                animated: true,
            });
        }, 800);

        setMessage("");
    };

    const renderMessage = ({ item }: any) => (
        <View
            style={[
                styles.messageBubble,
                item.sender === "user"
                    ? styles.userBubble
                    : styles.botBubble,
            ]}
        >
            <Text
                style={[
                    styles.messageText,
                    item.sender === "user" && {
                        color: "#fff",
                    },
                ]}
            >
                {item.text}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            {/* HEADER */}

            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Ionicons
                        name="sparkles"
                        size={24}
                        color="#0D9488"
                    />
                </View>

                <View>
                    <Text style={styles.title}>
                        MediCare AI
                    </Text>

                    <Text style={styles.subtitle}>
                        Online Healthcare Assistant
                    </Text>
                </View>
            </View>

            {/* CHAT */}

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item: any) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 15,
                    paddingBottom: 20,
                }}
                style={{
                    flex: 1,
                }}
            />

            {/* INPUT */}

            <View style={styles.inputContainer}>
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Ask your health question..."
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    multiline
                />

                <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={sendMessage}
                >
                    <Ionicons
                        name="send"
                        size={22}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF5FF",
    },

    header: {
        marginTop: 55,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },

    avatar: {
        width: 55,
        height: 55,
        borderRadius: 30,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#157e75",
    },

    subtitle: {
        color: "#64748B",
        marginTop: 2,
    },

    messageBubble: {
        maxWidth: "80%",
        padding: 14,
        borderRadius: 18,
        marginVertical: 6,
    },

    userBubble: {
        backgroundColor: "#0D9488",
        alignSelf: "flex-end",
        borderBottomRightRadius: 5,
    },

    botBubble: {
        backgroundColor: "#fff",
        alignSelf: "flex-start",
        borderBottomLeftRadius: 5,
    },

    messageText: {
        fontSize: 15,
        color: "#0F172A",
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",

        marginBottom: 80, // Tabs ke upar rahega
    },

    input: {
        flex: 1,
        backgroundColor: "#F1F5F9",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 12,
        maxHeight: 100,
    },

    sendBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#0D9488",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
});