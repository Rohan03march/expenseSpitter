import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ViewStyle, TextStyle, ImageStyle, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';
import { FirebaseContext } from '../context/FirebaseContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    avatar: string;
    timestamp: number;
}

const MOCK_MESSAGES: Message[] = [
    { id: 'm1', text: 'Hey guys, excited for the trip!', senderId: 'u2', senderName: 'Alice', avatar: 'https://i.pravatar.cc/301', timestamp: Date.now() - 3600000 },
    { id: 'm2', text: 'Me too! I will book the flights.', senderId: 'u3', senderName: 'Bob', avatar: 'https://i.pravatar.cc/302', timestamp: Date.now() - 3500000 },
    { id: 'm3', text: 'Great, add it to expenses so we can split.', senderId: 'u1', senderName: 'You', avatar: 'https://i.pravatar.cc/300', timestamp: Date.now() - 3400000 },
];

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
    const { group } = route.params;
    const { user } = useContext(FirebaseContext);
    const { colors } = useTheme();
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            senderId: 'u1', // Current user mock ID
            senderName: user?.name || 'You',
            avatar: user?.avatar || 'https://i.pravatar.cc/300',
            timestamp: Date.now(),
        };

        setMessages([...messages, newMessage]);
        setInputText('');

        // Mock reply
        setTimeout(() => {
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Got it!',
                senderId: 'u2',
                senderName: 'Alice',
                avatar: 'https://i.pravatar.cc/301',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, reply]);
        }, 2000);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.senderId === 'u1';
        return (
            <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
                {!isMe && <Image source={{ uri: item.avatar }} style={styles.avatar} />}
                <View style={[
                    styles.messageBubble,
                    isMe ? { backgroundColor: colors.primary, borderBottomLeftRadius: layout.borderRadius.l, borderBottomRightRadius: 4 }
                        : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
                ]}>
                    {!isMe && <Text style={[styles.senderName, { color: colors.textSecondary }]}>{item.senderName}</Text>}
                    <Text style={[
                        styles.messageText,
                        isMe ? styles.myMessageText : { color: colors.textPrimary }
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        isMe ? styles.myTimestamp : { color: colors.textSecondary }
                    ]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper edges={['top', 'left', 'right']}>
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{group.name}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Chat</Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        autoCorrect={true}
                        spellCheck={true}
                        autoCapitalize="sentences"
                        keyboardAppearance="dark"
                    />
                    <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={handleSend}>
                        <Ionicons name="send" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.spacing.l,
        paddingVertical: layout.spacing.m,
        borderBottomWidth: 1,
    } as ViewStyle,
    backButton: {
        marginRight: layout.spacing.m,
    } as ViewStyle,
    headerTitle: {
        ...(typography.h3 as TextStyle),
    } as TextStyle,
    headerSubtitle: {
        ...(typography.caption as TextStyle),
    } as TextStyle,
    listContent: {
        padding: layout.spacing.m,
        paddingBottom: layout.spacing.xl,
    } as ViewStyle,
    messageRow: {
        flexDirection: 'row',
        marginBottom: layout.spacing.m,
        alignItems: 'flex-end',
    } as ViewStyle,
    myMessageRow: {
        justifyContent: 'flex-end',
    } as ViewStyle,
    otherMessageRow: {
        justifyContent: 'flex-start',
    } as ViewStyle,
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: layout.spacing.s,
    } as ImageStyle,
    messageBubble: {
        maxWidth: '75%',
        padding: layout.spacing.m,
        borderRadius: layout.borderRadius.l,
        borderBottomLeftRadius: 4,
    } as ViewStyle,
    senderName: {
        ...(typography.caption as TextStyle),
        marginBottom: 2,
    } as TextStyle,
    messageText: {
        ...(typography.body1 as TextStyle),
        lineHeight: 20,
    } as TextStyle,
    myMessageText: {
        color: '#FFF',
    } as TextStyle,
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    } as TextStyle,
    myTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    } as TextStyle,
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: layout.spacing.m,
        borderTopWidth: 1,
    } as ViewStyle,
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: layout.spacing.m,
        paddingVertical: layout.spacing.s,
        maxHeight: 100,
        borderWidth: 1,
        marginRight: layout.spacing.m,
    } as TextStyle,
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
});
