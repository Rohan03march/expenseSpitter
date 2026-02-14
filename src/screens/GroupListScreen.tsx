import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewStyle, TextStyle, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Avatar } from '../components/Avatar';
import { FirebaseContext } from '../context/FirebaseContext';
import { useTheme } from '../context/ThemeContext';
import { gradients } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';

import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupList'>;

interface Group {
    id: string;
    name: string;
    image: string;
    owe: number;
    owed: number;
}

export const GroupListScreen: React.FC<Props> = ({ navigation }) => {
    const { groups, user, formatCurrency, getGroupExpenses, deleteGroup } = useContext(FirebaseContext);
    const { colors } = useTheme();

    const renderGroupItem = ({ item }: { item: any }) => {
        const groupExpenses = getGroupExpenses(item.id);

        const displayAmount = groupExpenses.reduce((total, expense) => {
            if (expense.type === 'settlement') return total;
            if (expense.splitWith.includes(user?.id || '')) {
                const splitCount = Math.max(1, expense.splitWith.length);
                return total + (expense.amount / splitCount);
            }
            return total;
        }, 0);

        const isCreator = item.createdBy === user?.id;

        const renderRightActions = (progress: any, dragX: any) => {
            if (!isCreator) return null;

            return (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        Alert.alert(
                            "Delete Group",
                            "Are you sure? This will delete all requests and expenses in this group.",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: async () => {
                                        await deleteGroup(item.id);
                                    }
                                }
                            ]
                        );
                    }}
                    style={{ marginBottom: layout.spacing.m, marginLeft: layout.spacing.s }}
                >
                    <LinearGradient
                        colors={['#FF4B2B', '#FF416C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.deleteActionGradient}
                    >
                        <Ionicons name="trash-outline" size={28} color="#FFF" />
                        <Text style={styles.deleteActionText}>Delete</Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        };

        const Swipeable = require('react-native-gesture-handler/Swipeable').default;

        return (
            <Swipeable renderRightActions={renderRightActions}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('GroupRequests', { group: item })}
                    style={{ marginBottom: layout.spacing.m }}
                >
                    <LinearGradient
                        colors={colors.surfaceHighlight ?
                            [colors.surface, colors.surfaceHighlight] :
                            [colors.surface, colors.background === '#0B0F19' ? '#2D3748' : '#F3F4F6']} // Dynamic gradient based on theme
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.cardGradient, { borderColor: colors.border }]}
                    >
                        <Avatar source={{ uri: item.image || 'https://via.placeholder.com/150' }} size={56} style={[styles.groupImage, { borderColor: colors.border }]} />
                        <View style={styles.groupInfo}>
                            <Text style={[styles.groupName, { color: colors.textPrimary }]}>{item.name}</Text>
                            <Text style={[styles.settledText, { color: colors.textSecondary }]}>My Total Spend: {formatCurrency(Math.max(0, displayAmount))}</Text>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Chat', { group: item })}
                                activeOpacity={0.8}
                                style={{ marginTop: 12, alignSelf: 'flex-start' }}
                            >
                                <LinearGradient
                                    colors={['rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.05)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.groupChatButton}
                                >
                                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primaryLight || '#818CF8'} style={{ marginRight: 6 }} />
                                    <Text style={[styles.groupChatText, { color: colors.primaryLight || '#818CF8' }]}>Group Chat</Text>
                                    <Ionicons name="arrow-forward" size={14} color={colors.primaryLight || '#818CF8'} style={{ marginLeft: 4, opacity: 0.8 }} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.arrowContainer}>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <View>
                        <Text style={[styles.greetingLabel, { color: colors.textSecondary }]}>Welcome back,</Text>
                        <Text style={[styles.greetingName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>My Groups</Text>
            </View>

            <FlatList
                data={groups}
                renderItem={renderGroupItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconBg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="people-outline" size={48} color={colors.primaryLight || colors.primary} />
                        </View>
                        <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No groups yet</Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Create a group to start splitting expenses</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fabContainer}
                onPress={() => navigation.navigate('CreateGroup')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[...gradients.primary] as any}
                    style={styles.fab}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={32} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: layout.spacing.l,
        paddingTop: layout.spacing.m,
        marginBottom: layout.spacing.m,
    } as ViewStyle,
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    greetingLabel: {
        ...(typography.caption as TextStyle),
        marginBottom: 2,
    } as TextStyle,
    greetingName: {
        ...(typography.h2 as TextStyle),
    } as TextStyle,
    settingsButton: {
        padding: layout.spacing.s,
        borderRadius: layout.borderRadius.m,
        borderWidth: 1,
    } as ViewStyle,
    pageTitle: {
        ...(typography.h3 as TextStyle),
        marginTop: layout.spacing.s,
    } as TextStyle,
    listContent: {
        paddingHorizontal: layout.spacing.l,
        paddingBottom: 100,
    } as ViewStyle,
    cardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: layout.borderRadius.l,
        padding: layout.spacing.m,
        borderWidth: 1,
        ...layout.shadows.small,
    } as ViewStyle,
    groupImage: {
        marginRight: layout.spacing.m,
        borderWidth: 1,
    } as ViewStyle,
    groupInfo: {
        flex: 1,
    } as ViewStyle,
    groupName: {
        ...(typography.body1 as TextStyle),
        fontWeight: 'bold',
        marginBottom: 4,
        fontSize: 17,
    } as TextStyle,
    settledText: {
        ...(typography.caption as TextStyle),
    } as TextStyle,
    arrowContainer: {
        padding: layout.spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: layout.borderRadius.s,
    } as ViewStyle,
    groupChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    } as ViewStyle,
    groupChatText: {
        ...typography.caption,
        fontWeight: '700',
        letterSpacing: 0.5,
        fontSize: 13,
    } as TextStyle,
    fabContainer: {
        position: 'absolute',
        bottom: layout.spacing.xl,
        right: layout.spacing.l,
        ...layout.shadows.large,
    } as ViewStyle,
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    emptyContainer: {
        alignItems: 'center',
        marginTop: layout.spacing.xxl,
    } as ViewStyle,
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layout.spacing.l,
        borderWidth: 1,
    } as ViewStyle,
    emptyText: {
        ...(typography.h3 as TextStyle),
        marginBottom: layout.spacing.s,
    } as TextStyle,
    emptySubtext: {
        ...(typography.body2 as TextStyle),
        textAlign: 'center',
    } as TextStyle,
    deleteActionGradient: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 90,
        height: '100%',
        borderRadius: layout.borderRadius.l,
        ...layout.shadows.small,
    } as ViewStyle,
    deleteActionText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
        marginTop: 4,
        letterSpacing: 0.5,
    } as TextStyle,
});
