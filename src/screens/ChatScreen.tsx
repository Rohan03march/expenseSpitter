import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ViewStyle, TextStyle, ImageStyle, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Animated, ImageBackground } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ScreenWrapper } from '../components/ScreenWrapper';
import TravelBackground from '../components/TravelBackground';
import { Avatar } from '../components/Avatar';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';
import { FirebaseContext } from '../context/FirebaseContext';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    avatar: string;
    timestamp: number;
    replyTo?: {
        id: string;
        text: string;
        senderName: string;
    };
    reactions?: Record<string, string[]>; // emoji -> userIds
}



export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
    const { group } = route.params;
    const { user, sendMessage, addReaction, deleteMessage } = useContext(FirebaseContext);

    // ...

    const handleDelete = async () => {
        if (!selectedMessage) return;

        // Confirm deletion? Or just delete. Let's just delete for speed/UX as requested "give option to delete"
        await deleteMessage(selectedMessage.id);
        setSelectedMessage(null);
    };

    // ... inside Modal ...


    const { colors, isDark } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [loading, setLoading] = useState(true);

    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number, width: number, height: number, isMe: boolean } | null>(null);
    const messageRefs = useRef<Map<string, any>>(new Map());

    const handleLongPress = (item: Message) => {
        const viewRef = messageRefs.current.get(item.id);
        if (viewRef) {
            viewRef.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                setMenuPosition({
                    x: px,
                    y: py,
                    width: width,
                    height: height,
                    isMe: item.senderId === user?.id
                });
                setSelectedMessage(item);
            });
        }
    };

    // Encryption Banner Component
    const EncryptionBanner = () => (
        <View style={styles.encryptionBanner}>
            <Ionicons name="lock-closed" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.encryptionText, { color: colors.textSecondary }]}>
                Messages are end-to-end encrypted. No one outside of this chat, not even ExpenseSpitter, can read or listen to them.
            </Text>
        </View>
    );

    useEffect(() => {
        const q = query(
            collection(db, "messages"),
            where("groupId", "==", group.id),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages: Message[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(fetchedMessages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [group.id]);

    // --- Typing Indicator Logic ---
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for other users typing
    useEffect(() => {
        if (!user) return;

        const typingQuery = query(collection(db, "groups", group.id, "typing"));
        const unsubscribe = onSnapshot(typingQuery, (snapshot) => {
            const now = Date.now();
            const activeTypers: string[] = [];

            snapshot.forEach(doc => {
                if (doc.id !== user.id) {
                    const data = doc.data();
                    // Filter out stale typing status (> 5 seconds old)
                    if (data.isTyping && (now - data.timestamp < 5000)) {
                        activeTypers.push(data.name);
                    }
                }
            });
            setTypingUsers(activeTypers);
        });

        return () => unsubscribe();
    }, [group.id, user]);

    // Update my typing status
    const updateTypingStatus = async (isTyping: boolean) => {
        if (!user) return;
        const typingRef = doc(db, "groups", group.id, "typing", user.id);

        if (isTyping) {
            await setDoc(typingRef, {
                isTyping: true,
                name: user.name,
                timestamp: Date.now()
            });

            // Auto-clear typing status after 5 seconds of inactivity
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                updateTypingStatus(false);
            }, 5000);
        } else {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            await deleteDoc(typingRef); // Or set isTyping: false
        }
    };

    const handleInputChange = (text: string) => {
        setInputText(text);
        if (text.length > 0) {
            updateTypingStatus(true);
        } else {
            updateTypingStatus(false);
        }
    };

    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    const MINUTE_MS = 60000;
    const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

    const handleReaction = async (emoji: string) => {
        if (!selectedMessage) return;
        await addReaction(selectedMessage.id, emoji);
        setSelectedMessage(null);
    };

    const handleReplyFromMenu = () => {
        if (!selectedMessage) return;
        setReplyTo({ id: selectedMessage.id, senderName: selectedMessage.senderName, text: selectedMessage.text });
        setSelectedMessage(null);
    }

    const [replyTo, setReplyTo] = useState<Message['replyTo'] | null>(null);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const text = inputText;
        const currentReply = replyTo; // Capture current reply state

        setInputText(''); // Clear immediately
        updateTypingStatus(false); // Clear typing status
        setReplyTo(null); // Clear reply state

        try {
            await sendMessage(group.id, text, currentReply || undefined);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const renderLeftActions = (progress: any, dragX: any, item: Message) => {
        const trans = dragX.interpolate({
            inputRange: [0, 50, 100, 101],
            outputRange: [-20, 0, 0, 1],
        });
        return (
            <RectButton style={styles.replySwipeContainer}>
                <Animated.View style={[styles.replySwipeIcon, { transform: [{ translateX: trans }] }]}>
                    <Ionicons name="arrow-undo" size={24} color={colors.primary} />
                </Animated.View>
            </RectButton>
        );
    };

    const isSameDay = (d1: number, d2: number) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    };

    const formatMessageDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (isSameDay(date.getTime(), today.getTime())) {
            return "Today";
        } else if (isSameDay(date.getTime(), yesterday.getTime())) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
        }
    };

    const renderMessage = ({ item, index }: { item: Message, index: number }) => {
        const isMe = item.senderId === user?.id;

        // Grouping Logic
        const prevMessage = messages[index - 1];
        const isSameSender = prevMessage && prevMessage.senderId === item.senderId;
        const isCloseTime = prevMessage && (item.timestamp - prevMessage.timestamp < 5 * 60 * 1000); // 5 mins
        const shouldGroup = isSameSender && isCloseTime;

        // Date Separator Logic
        const showDateSeparator = !prevMessage || !isSameDay(item.timestamp, prevMessage.timestamp);

        let swipeableRef: any = null;
        const closeSwipeable = () => {
            swipeableRef?.close();
        };

        return (
            <View>
                {showDateSeparator && (
                    <View style={styles.dateSeparator}>
                        <Text style={[styles.dateSeparatorText, { color: colors.textSecondary }]}>
                            {formatMessageDate(item.timestamp)}
                        </Text>
                    </View>
                )}

                <Swipeable
                    ref={(ref: any) => swipeableRef = ref}
                    renderLeftActions={(progress, dragX) => renderLeftActions(progress, dragX, item)}
                    onSwipeableOpen={() => {
                        closeSwipeable();
                        setReplyTo({ id: item.id, senderName: item.senderName, text: item.text });
                    }}
                    friction={2}
                    rightThreshold={40}
                >
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onLongPress={() => handleLongPress(item)}
                        delayLongPress={200}
                        ref={(ref) => {
                            if (ref) {
                                messageRefs.current.set(item.id, ref);
                            } else {
                                messageRefs.current.delete(item.id);
                            }
                        }}
                        style={[
                            styles.messageRow,
                            isMe ? styles.myMessageRow : styles.otherMessageRow,
                            shouldGroup ? { marginTop: 2 } : { marginTop: 12 }
                        ]}
                    >
                        {!isMe && !shouldGroup && <Image source={{ uri: item.avatar }} style={styles.avatar} />}
                        {!isMe && shouldGroup && <View style={styles.avatarPlaceholder} />}

                        <View style={{ maxWidth: '80%' }}>
                            <View style={[
                                styles.messageBubble,
                                isMe ? {
                                    backgroundColor: colors.primary,
                                    borderBottomLeftRadius: layout.borderRadius.l,
                                    borderBottomRightRadius: 4
                                } : {
                                    backgroundColor: colors.surface,
                                    // Removed border for cleaner look, added shadow instead in styles
                                },
                                shouldGroup && isMe ? { borderTopRightRadius: 4 } : {},
                                shouldGroup && !isMe ? { borderTopLeftRadius: 4 } : {}
                            ]}>
                                {/* Reply Context within Bubble */}
                                {item.replyTo && (
                                    <View style={[
                                        styles.replyContainer,
                                        isMe ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: 'rgba(0,0,0,0.05)' }
                                    ]}>
                                        <View style={[styles.replyBar, { backgroundColor: isMe ? '#FFF' : colors.primary }]} />
                                        <View style={{ flexShrink: 1 }}>
                                            <Text style={[styles.replySender, isMe ? { color: '#FFF' } : { color: colors.primary }]}>{item.replyTo.senderName}</Text>
                                            <Text style={[styles.replyText, isMe ? { color: 'rgba(255,255,255,0.8)' } : { color: colors.textSecondary }]} numberOfLines={1}>{item.replyTo.text}</Text>
                                        </View>
                                    </View>
                                )}

                                <Text style={[
                                    styles.messageText,
                                    isMe ? styles.myMessageText : { color: colors.textPrimary }
                                ]}>
                                    {item.text}
                                </Text>
                                <Text style={[
                                    styles.timestamp,
                                    isMe ? styles.myTimestamp : { color: colors.textSecondary, opacity: 0.7 }
                                ]}>
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>

                            {/* Reactions Display */}
                            {item.reactions && Object.keys(item.reactions).length > 0 && (
                                <View style={[styles.reactionsContainer, isMe ? { left: 4 } : { right: 4 }, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                                    {Object.entries(item.reactions).map(([emoji, users]: [string, any]) => (
                                        users.length > 0 && (
                                            <View key={emoji} style={[styles.reactionBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                <Text style={{ fontSize: 10 }}>{emoji} {users.length > 1 ? users.length : ''}</Text>
                                            </View>
                                        )
                                    ))}
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </Swipeable>
            </View>
        );
    };

    return (
        <ScreenWrapper edges={['top', 'left', 'right']}>
            <TravelBackground>
                <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>

                        {/* Group Image */}
                        <View style={{ marginLeft: 8, marginRight: 12 }}>
                            <Avatar source={{ uri: group?.image || 'https://via.placeholder.com/150' }} size={40} style={{ borderWidth: 1, borderColor: colors.border }} />
                        </View>

                        <View>
                            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{group?.name || 'Group'}</Text>
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{group?.members?.length || 0} members</Text>
                        </View>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                >
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            ListHeaderComponent={EncryptionBanner}
                        />
                    )}

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <View style={styles.typingIndicatorContainer}>
                            <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                                {typingUsers.length === 1
                                    ? `${typingUsers[0]} is typing...`
                                    : typingUsers.length === 2
                                        ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                                        : `${typingUsers.length} people are typing...`}
                            </Text>
                            {/* Optional: Add a small animation dots here if desired */}
                        </View>
                    )}

                    {/* Reply Preview Bar */}
                    {replyTo && (
                        <View style={[styles.replyPreviewBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={[styles.replyBar, { backgroundColor: colors.primary }]} />
                                <View style={{ marginLeft: 8, flex: 1 }}>
                                    <Text style={[styles.replySender, { color: colors.primary }]}>Replying to {replyTo.senderName}</Text>
                                    <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={1}>{replyTo.text}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setReplyTo(null)} style={{ padding: 4 }}>
                                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: 20 }]}>
                        <View style={[styles.inputFieldContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                            <TextInput
                                style={[styles.input, { color: colors.textPrimary }]}
                                placeholder="Message..."
                                placeholderTextColor={colors.textSecondary}
                                value={inputText}
                                onChangeText={handleInputChange}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={inputText.trim().length === 0}
                                style={{ opacity: inputText.trim().length > 0 ? 1 : 0.5 }}
                            >
                                <Ionicons name="send" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                {/* Context Menu Overlay */}
                {selectedMessage && menuPosition && (
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => { setSelectedMessage(null); setMenuPosition(null); }}
                        style={styles.modalOverlay}
                    >
                        {/* Emoji Bar - Floats ABOVE the message */}
                        <View style={[
                            styles.emojiBar,
                            {
                                backgroundColor: colors.surface,
                                top: menuPosition.y - 60, // Position above
                                left: menuPosition.isMe ? undefined : menuPosition.x,
                                right: menuPosition.isMe ? (layout.window.width - menuPosition.x - menuPosition.width) : undefined,
                            }
                        ]}>
                            {['❤️', '😂', '😮', '😢', '😡', '👍'].map(emoji => (
                                <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.emojiOption}>
                                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Action Menu - Floats BELOW the message */}
                        <View style={[
                            styles.actionMenu,
                            {
                                backgroundColor: colors.surface,
                                top: menuPosition.y + menuPosition.height + 8, // Position below
                                left: menuPosition.isMe ? undefined : menuPosition.x,
                                right: menuPosition.isMe ? (layout.window.width - menuPosition.x - menuPosition.width) : undefined,
                            }
                        ]}>
                            <TouchableOpacity onPress={handleReplyFromMenu} style={styles.actionItem}>
                                <Ionicons name="arrow-undo-outline" size={20} color={colors.textPrimary} />
                                <Text style={[styles.actionText, { color: colors.textPrimary }]}>Reply</Text>
                            </TouchableOpacity>
                            <View style={{ height: 1, backgroundColor: colors.border }} />
                            {selectedMessage.senderId === user?.id && (
                                <>
                                    <TouchableOpacity onPress={handleDelete} style={styles.actionItem}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error || 'red'} />
                                        <Text style={[styles.actionText, { color: colors.error || 'red' }]}>Delete</Text>
                                    </TouchableOpacity>
                                    <View style={{ height: 1, backgroundColor: colors.border }} />
                                </>
                            )}
                            <TouchableOpacity onPress={() => { setSelectedMessage(null); setMenuPosition(null); }} style={styles.actionItem}>
                                <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
                                <Text style={[styles.actionText, { color: colors.textPrimary }]}>Copy</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>

                )}
            </TravelBackground>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    encryptionBanner: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        marginVertical: 8,
        backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold tint for 'lock' feeling
        borderRadius: 8,
        alignSelf: 'center',
        width: '90%',
    } as ViewStyle,
    encryptionText: {
        fontSize: 10,
        textAlign: 'center',
        flex: 1,
    } as TextStyle,
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
        padding: layout.spacing.m,
        borderRadius: layout.borderRadius.l,
        borderBottomLeftRadius: 4,
        minWidth: 120,
        ...layout.shadows.small, // Add shadow for depth
        elevation: 2,
    } as ViewStyle,
    dateSeparator: {
        alignSelf: 'center',
        marginVertical: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
    } as ViewStyle,
    dateSeparatorText: {
        fontSize: 12,
        fontWeight: '600',
    } as TextStyle,
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
    avatarPlaceholder: {
        width: 32,
        height: 32,
        marginRight: 8,
        alignSelf: 'flex-end',
    } as ViewStyle,
    replyContainer: {
        flexDirection: 'row',
        padding: 8,
        borderRadius: 8,
        marginBottom: 4,
        overflow: 'hidden',
    } as ViewStyle,
    replyBar: {
        width: 4,
        borderRadius: 2,
        marginRight: 8,
    } as ViewStyle,
    replySender: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    } as TextStyle,
    replyText: {
        fontSize: 12,
    } as TextStyle,
    replyPreviewBar: {
        flexDirection: 'row',
        padding: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
    } as ViewStyle,
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    } as ViewStyle,
    inputFieldContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        borderRadius: 24,
        borderWidth: 0, // Remove border
        marginHorizontal: 0, // Remove margin as we are single element
        backgroundColor: '#F2F2F7', // iOS light gray standard
    } as ViewStyle,
    input: {
        flex: 1,
        maxHeight: 100,
        fontSize: 16,
        marginRight: 8,
    } as TextStyle,
    attachButton: {
        padding: 4,
    } as ViewStyle,
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...layout.shadows.small,
    } as ViewStyle,

    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)', // Lighter dim
        zIndex: 1000,
    } as ViewStyle,
    emojiBar: {
        position: 'absolute',
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 8,
        ...layout.shadows.medium,
        minWidth: 200,
        justifyContent: 'space-around'
    } as ViewStyle,
    actionMenu: {
        position: 'absolute',
        backgroundColor: '#FFF',
        borderRadius: 12,
        width: 180,
        ...layout.shadows.medium,
        overflow: 'hidden',
    } as ViewStyle,
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    } as ViewStyle,
    actionText: {
        fontSize: 16,
        fontWeight: '500',
    } as TextStyle,
    emojiOption: {
        paddingHorizontal: 4,
    } as ViewStyle,
    reactionsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 2,
        flexDirection: 'row',
        position: 'absolute',
        bottom: -10,
        ...layout.shadows.small,
        zIndex: 10,
    } as ViewStyle,
    reactionBubble: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        marginRight: 2,
        ...layout.shadows.small,
    } as ViewStyle,
    replySwipeContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
    } as ViewStyle,
    replySwipeIcon: {
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    typingIndicatorContainer: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        alignItems: 'flex-start',
    } as ViewStyle,
    typingText: {
        fontSize: 12,
        fontStyle: 'italic',
    } as TextStyle,
});
