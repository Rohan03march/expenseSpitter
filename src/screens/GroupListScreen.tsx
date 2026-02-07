import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewStyle, TextStyle, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Avatar } from '../components/Avatar';
import { FirebaseContext } from '../context/FirebaseContext';
import { colors, gradients } from '../theme/colors';
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

// ... imports

// Remove Mock Groups constant

export const GroupListScreen: React.FC<Props> = ({ navigation }) => {
    const { groups, user, formatCurrency, getGroupExpenses, deleteGroup } = useContext(FirebaseContext);

    // Refresh groups on focus is handled by Context listener, but we might want to ensure expenses are fresh?
    // Context handles listeners.

    const renderGroupItem = ({ item }: { item: any }) => {
        const groupExpenses = getGroupExpenses(item.id);

        const displayAmount = groupExpenses.reduce((total, expense) => {
            // Exclude settlements from "Spending" (Consumption)
            if (expense.type === 'settlement') return total;

            // Calculate my share: Average split
            if (expense.splitWith.includes(user?.id || '')) {
                const splitCount = Math.max(1, expense.splitWith.length);
                return total + (expense.amount / splitCount);
            }
            return total;
        }, 0);

        const isCreator = item.createdBy === user?.id;

        const renderRightActions = (progress: any, dragX: any) => {
            if (!isCreator) return null;

            const scale = dragX.interpolate({
                inputRange: [-100, 0],
                outputRange: [1, 0],
                extrapolate: 'clamp',
            });

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
                        colors={['#FF4B2B', '#FF416C']} // Fresh red gradient
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
                        colors={colors.surfaceHighlight ? [colors.surface, colors.surfaceHighlight] : [colors.surface, '#2D3748']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        <Avatar source={{ uri: item.image || 'https://via.placeholder.com/150' }} size={56} style={styles.groupImage} />
                        <View style={styles.groupInfo}>
                            <Text style={styles.groupName}>{item.name}</Text>
                            <Text style={styles.settledText}>My Total Spend: {formatCurrency(Math.max(0, displayAmount))}</Text>
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
                        <Text style={styles.greetingLabel}>Welcome back,</Text>
                        <Text style={styles.greetingName}>{user?.name || 'User'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
                        <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.pageTitle}>My Groups</Text>
            </View>

            <FlatList
                data={groups}
                renderItem={renderGroupItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="people-outline" size={48} color={colors.primaryLight} />
                        </View>
                        <Text style={styles.emptyText}>No groups yet</Text>
                        <Text style={styles.emptySubtext}>Create a group to start splitting expenses</Text>
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
        color: colors.textSecondary,
        marginBottom: 2,
    } as TextStyle,
    greetingName: {
        ...(typography.h2 as TextStyle),
        color: colors.textPrimary,
    } as TextStyle,
    settingsButton: {
        padding: layout.spacing.s,
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
    } as ViewStyle,
    pageTitle: {
        ...(typography.h3 as TextStyle),
        color: colors.textPrimary,
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
        borderColor: colors.border,
        ...layout.shadows.small,
    } as ViewStyle,
    groupImage: {
        marginRight: layout.spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    } as ViewStyle,
    groupInfo: {
        flex: 1,
    } as ViewStyle,
    groupName: {
        ...(typography.body1 as TextStyle),
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
        fontSize: 17,
    } as TextStyle,
    settledText: {
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
    } as TextStyle,
    arrowContainer: {
        padding: layout.spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: layout.borderRadius.s,
    } as ViewStyle,
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
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layout.spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
    } as ViewStyle,
    emptyText: {
        ...(typography.h3 as TextStyle),
        color: colors.textPrimary,
        marginBottom: layout.spacing.s,
    } as TextStyle,
    emptySubtext: {
        ...(typography.body2 as TextStyle),
        color: colors.textSecondary,
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
