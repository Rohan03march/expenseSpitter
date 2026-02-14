import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, Image, ImageStyle, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { GlassView } from '../components/GlassView';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../context/ThemeContext';
import { gradients } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/types';
import { Avatar } from '../components/Avatar';
import { FirebaseContext, Expense, User } from '../context/FirebaseContext';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDashboard'>;

export const GroupDashboardScreen: React.FC<Props> = ({ route, navigation }) => {
    const { group: initialGroup, requestId, requestTitle } = route.params;
    const { getGroupExpenses, formatCurrency, getGroupBalances, deleteGroup, addMember, addMemberToRequest, removeMember, removeMemberFromRequest, groups, groupRequests, searchUser, user: currentUser } = useContext(FirebaseContext);
    const { colors } = useTheme();

    // Get real-time group data from context
    const group = groups.find(g => g.id === initialGroup.id) || initialGroup;

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        // Refresh expenses when screen focuses (simple way for now)
        const unsubscribe = navigation.addListener('focus', () => {
            setExpenses(getGroupExpenses(group.id, requestId));
        });
        // Initial load
        setExpenses(getGroupExpenses(group.id, requestId));

        return unsubscribe;
    }, [navigation, group.id, requestId, getGroupExpenses, expenses.length]);

    // If group was deleted, go back
    useEffect(() => {
        if (!groups.find(g => g.id === initialGroup.id)) {
            navigation.navigate('GroupList');
        }
    }, [groups, initialGroup.id, navigation]);

    const handleSearchUser = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setFoundUser(null);
        try {
            const user = await searchUser(searchQuery.trim());
            if (user) {
                setFoundUser(user);
            } else {
                Alert.alert("User Not Found", "No user found with this email address.");
            }
        } catch (error) {
            console.error("Search error:", error);
            Alert.alert("Error", "Failed to search for user.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddMember = async () => {
        if (foundUser) {
            // Always ensure they are in the group first
            await addMember(group.id, foundUser);

            // If we are in a specific request, add them to that request too
            if (requestId) {
                await addMemberToRequest(requestId, foundUser.id);
                Alert.alert("Success", `${foundUser.name} added to the group and request.`);
            } else {
                // Already alerted in addMember, but we suppressed it there? No, addMember alerts.
                // Maybe we should suppress alert in addMember if we want custom message here? 
                // For now, let's just let addMember alert.
            }

            setShowAddMemberModal(false);
            setSearchQuery('');
            setFoundUser(null);
        }
    };

    const handleRemoveMember = (memberId: string) => {
        Alert.alert(
            "Remove Member",
            requestId ? "Remove from this request?" : "Remove from group?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        if (requestId) {
                            await removeMemberFromRequest(requestId, memberId);
                        } else {
                            await removeMember(group.id, memberId);
                        }
                    }
                }
            ]
        );
    };

    const balances = getGroupBalances(group.id, requestId);
    const currentUserId = currentUser?.id || 'u1'; // Fallback to 'u1' if user context not ready, matching previous hardcode
    const myBalance = balances[currentUserId] || 0;
    const isPositive = myBalance >= 0;

    // Calculate My Total Spend (Consumption): 
    // Sum of (Amount / SplitCount) for expenses where I am involved.
    // Exclude settlements.
    const myNetSpend = expenses.reduce((acc, expense) => {
        if (expense.type === 'settlement') return acc;

        if (expense.splitWith.includes(currentUserId)) {
            const splitCount = Math.max(1, expense.splitWith.length);
            const share = expense.amount / splitCount;
            return acc + share;
        }

        return acc;
    }, 0);

    return (
        <ScreenWrapper keyboardShouldDismiss={false}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{requestTitle ? `${group.name} - ${requestTitle}` : group.name}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
                    <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">

                {/* Hero Card */}
                <LinearGradient
                    colors={colors.surfaceHighlight ? [colors.surface, colors.surfaceHighlight] : [colors.surface, '#252F45']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.heroCard, { borderColor: colors.border, borderWidth: 1 }]}
                >
                    <View style={styles.heroHeader}>
                        <Image source={{ uri: group.image || 'https://via.placeholder.com/150' }} style={[styles.groupImage, { borderColor: colors.border, borderWidth: 1 }]} />
                        <View style={{ flex: 1, marginLeft: layout.spacing.m }}>
                            <Text style={[styles.groupName, { color: colors.textPrimary }]}>{group.name}</Text>
                            <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>{group.members.length} members • Created recently</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>My Total Spend</Text>
                            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(Math.max(0, myNetSpend))}</Text>
                        </View>
                        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                        <TouchableOpacity style={styles.statCol} onPress={() => navigation.navigate('Balances', { group })}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>My Balance</Text>
                            <Text style={[styles.statValue, { color: isPositive ? colors.success : colors.error }]}>
                                {isPositive ? '+' : ''}{formatCurrency(myBalance)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Quick Actions */}
                <View style={styles.actionsData}>
                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={() => navigation.navigate('Balances', { group })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={(colors.primaryLight ? [colors.primaryLight, colors.primary] : gradients.primary) as any}
                            style={styles.actionBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="wallet-outline" size={24} color="#FFF" />
                            <Text style={styles.actionLabel}>Balances</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={() => navigation.navigate('Chat', { group })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={gradients.primary as any}
                            style={styles.actionBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
                            <Text style={styles.actionLabel}>Chat</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={() => {
                            const currentRequest = requestId ? groupRequests.find(r => r.id === requestId) : null;
                            const requestMemberIds = currentRequest ? currentRequest.memberIds : null;
                            navigation.navigate('AddExpense', { group, requestId, requestMemberIds, initialType: 'settlement' });
                        }}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={gradients.success as any}
                            style={styles.actionBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="card-outline" size={24} color="#FFF" />
                            <Text style={styles.actionLabel}>Settle Up</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Members Section */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Members</Text>
                <View style={styles.membersContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.membersScroll}
                        contentContainerStyle={styles.membersScrollContent}
                    >
                        <TouchableOpacity style={styles.addMemberBtn} onPress={() => { setShowAddMemberModal(true); setFoundUser(null); setSearchQuery(''); }}>
                            <View style={[styles.addMemberIcon, { borderColor: colors.primary, backgroundColor: colors.primaryLight + '10' }]}>
                                <Ionicons name="person-add" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.memberName, { color: colors.textSecondary }]}>Add</Text>
                        </TouchableOpacity>

                        {group.members.map((member: User) => {
                            const isCurrentUser = currentUser?.id === member.id;

                            // If in request mode, check if member is part of request
                            // We need to fetch the request details to know memberIds
                            const currentRequest = requestId ? groupRequests.find(r => r.id === requestId) : null;
                            const isMemberInRequest = currentRequest ? currentRequest.memberIds.includes(member.id) : true;

                            if (requestId && !isMemberInRequest) return null;

                            const canRemove = requestId
                                ? currentRequest?.createdBy === currentUser?.id
                                : group.createdBy === currentUser?.id;

                            return (
                                <View key={member.id} style={styles.memberItem}>
                                    <Avatar source={{ uri: member.avatar }} size={50} />
                                    <Text style={[styles.memberName, { color: colors.textSecondary }]} numberOfLines={1}>{member.name}</Text>
                                    {!isCurrentUser && canRemove && (
                                        <TouchableOpacity
                                            style={[styles.removeMemberBtn, { backgroundColor: colors.surface, borderColor: colors.error }]}
                                            onPress={() => handleRemoveMember(member.id)}
                                        >
                                            <Ionicons name="close" size={12} color={colors.error} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Recent Activity */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
                <View style={styles.listContainer}>
                    {expenses.map((expense) => {
                        const date = new Date(expense.date);
                        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const payer = group.members.find((m: User) => m.id === expense.paidBy);
                        const isMe = expense.paidBy === currentUser?.id; // Corrected to check against currentUser context
                        const isSettlement = expense.type === 'settlement';

                        let renderContent;

                        if (isSettlement) {
                            const recipientId = expense.splitWith[0];
                            const recipientMember = group.members.find(m => m.id === recipientId);
                            const isRecipientMe = recipientId === currentUser?.id;

                            const payerName = isMe ? 'You' : (payer?.name || 'Unknown');
                            const recipientName = isRecipientMe ? 'You' : (recipientMember?.name || 'Unknown');

                            renderContent = (
                                <View style={styles.settlementRow}>
                                    {isRecipientMe ? (
                                        <View style={[styles.mergedAvatarContainer, { marginRight: layout.spacing.m }]}>
                                            <Avatar source={{ uri: payer?.avatar || 'https://i.pravatar.cc/150' }} size={32} style={{ zIndex: 1, borderWidth: 2, borderColor: colors.surface }} />
                                            <View style={{ marginLeft: -12, zIndex: 2, borderWidth: 2, borderColor: colors.surface, borderRadius: 16 }}>
                                                <Avatar source={{ uri: recipientMember?.avatar || 'https://i.pravatar.cc/150' }} size={32} />
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={[styles.settlementIconBg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                            <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                                        </View>
                                    )}
                                    <View style={{ flex: 1, marginLeft: isRecipientMe ? 0 : layout.spacing.m }}>
                                        <Text style={[styles.expenseTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                            <Text style={{ fontWeight: '700' }}>{payerName}</Text> paid <Text style={{ fontWeight: '700' }}>{recipientName}</Text>
                                        </Text>
                                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateString}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                                        <Text style={[styles.amountValue, { color: colors.success, fontSize: 16 }]}>
                                            {formatCurrency(expense.amount)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        } else {
                            renderContent = (
                                <>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <Text style={[styles.expenseTitle, { color: colors.textPrimary, fontSize: 16 }]} numberOfLines={1}>{expense.title}</Text>
                                        <Text style={[styles.amountValue, { color: colors.error, fontSize: 16 }]}>
                                            -{formatCurrency(expense.amount / Math.max(1, expense.splitWith.length))}
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.expenseSubtitle, { color: colors.textSecondary, flex: 1, marginRight: 8 }]} numberOfLines={1}>
                                            <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{isMe ? 'You' : payer?.name || 'Unknown'}</Text> paid {formatCurrency(expense.amount)}
                                        </Text>
                                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateString}</Text>
                                    </View>
                                </>
                            );
                        }

                        // The assignment above created renderContent. Now we use it.
                        return (
                            <TouchableOpacity
                                key={expense.id}
                                activeOpacity={0.7}
                                onPress={() => {
                                    navigation.navigate('ExpenseDetails', { group, expense });
                                }}
                                style={[styles.expenseItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            >
                                <View style={styles.expenseInfo}>
                                    {renderContent}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    {expenses.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: layout.spacing.m }} />
                            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No expenses yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tap the + button to add the first expense</Text>
                        </View>
                    )}
                </View>

                {
                    group.createdBy === currentUser?.id && !requestId && (
                        <TouchableOpacity
                            style={[styles.deleteGroupBtn, { borderColor: colors.error, backgroundColor: colors.error + '10' }]}
                            onPress={() => {
                                Alert.alert(
                                    "Delete Group",
                                    "Are you sure you want to delete this group?",
                                    [
                                        { text: "No", style: "cancel" },
                                        {
                                            text: "Yes", style: "destructive", onPress: () => {
                                                deleteGroup(group.id);
                                                navigation.navigate('GroupList');
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={24} color={colors.error} />
                            <Text style={[styles.deleteGroupText, { color: colors.error }]}>Delete Group</Text>
                        </TouchableOpacity>
                    )
                }

            </ScrollView >

            {
                (!requestId || (requestId && groupRequests.find(r => r.id === requestId)?.createdBy === currentUser?.id)) && (
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.primary }]}
                        onPress={() => {
                            const currentRequest = requestId ? groupRequests.find(r => r.id === requestId) : null;
                            const requestMemberIds = currentRequest ? currentRequest.memberIds : null;
                            navigation.navigate('AddExpense', { group, requestId, requestMemberIds });
                        }}
                    >
                        <Ionicons name="add" size={32} color="#FFF" />
                    </TouchableOpacity>
                )
            }

            {
                showAddMemberModal && (
                    <View style={styles.modalOverlay}>
                        <GlassView style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]} intensity={95}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Member</Text>
                                <TouchableOpacity onPress={() => { setShowAddMemberModal(false); setSearchQuery(''); setFoundUser(null); }}>
                                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            {!foundUser ? (
                                <>
                                    <Input
                                        placeholder="Enter email address..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        style={{ marginBottom: layout.spacing.m }}
                                    />
                                    <GradientButton
                                        title={isSearching ? "Searching..." : "Search"}
                                        onPress={handleSearchUser}
                                        disabled={!searchQuery || isSearching}
                                        style={{ marginTop: layout.spacing.m }}
                                    />

                                    {requestId && (
                                        <View style={{ marginTop: layout.spacing.l }}>
                                            <Text style={{ color: colors.textSecondary, marginBottom: layout.spacing.s, fontWeight: 'bold' }}>Add Existing Group Member</Text>
                                            <ScrollView style={{ maxHeight: 150 }}>
                                                {group.members.map(member => (
                                                    <TouchableOpacity
                                                        key={member.id}
                                                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                                                        onPress={async () => {
                                                            await addMemberToRequest(requestId, member.id);
                                                            Alert.alert("Success", `${member.name} added to request.`);
                                                            setShowAddMemberModal(false);
                                                        }}
                                                    >
                                                        <Avatar source={{ uri: member.avatar }} size={32} />
                                                        <Text style={{ color: colors.textPrimary, marginLeft: 10 }}>{member.name}</Text>
                                                        <Ionicons name="add-circle-outline" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={{ alignItems: 'center', marginVertical: layout.spacing.m }}>
                                    <Avatar source={{ uri: foundUser.avatar }} size={80} />
                                    <Text style={{ ...typography.h3 as TextStyle, color: colors.textPrimary, marginTop: layout.spacing.s }}>
                                        {foundUser.name}
                                    </Text>
                                    <Text style={{ ...typography.body2 as TextStyle, color: colors.textSecondary, marginBottom: layout.spacing.l }}>
                                        {foundUser.email}
                                    </Text>

                                    <View style={{ width: '100%', gap: layout.spacing.m }}>
                                        <GradientButton
                                            title={`Add ${foundUser.name}`}
                                            onPress={handleAddMember}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setFoundUser(null)}
                                            style={{ padding: layout.spacing.m, alignItems: 'center' }}
                                        >
                                            <Text style={{ color: colors.textSecondary }}>Search different user</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </GlassView>
                    </View>
                )
            }

        </ScreenWrapper >
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layout.spacing.l,
        paddingVertical: layout.spacing.m,
    } as ViewStyle,
    iconButton: {
        padding: layout.spacing.s,
    } as ViewStyle,
    headerTitle: {
        ...(typography.h3 as TextStyle),
        flex: 1,
        textAlign: 'center',
        marginHorizontal: layout.spacing.m,
    } as TextStyle,
    content: {
        padding: layout.spacing.l,
        paddingBottom: 100,
    } as ViewStyle,
    heroCard: {
        padding: layout.spacing.l,
        marginBottom: layout.spacing.l,
        borderRadius: layout.borderRadius.l,
    } as ViewStyle,
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: layout.spacing.m,
    } as ViewStyle,
    groupImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
    } as ImageStyle,
    groupName: {
        ...(typography.h3 as TextStyle),
        fontWeight: 'bold',
    } as TextStyle,
    groupMeta: {
        ...(typography.caption as TextStyle),
        marginTop: 4,
    } as TextStyle,
    divider: {
        height: 1,
        marginVertical: layout.spacing.m,
    } as ViewStyle,
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    } as ViewStyle,
    statCol: {
        flex: 1,
        alignItems: 'center',
    } as ViewStyle,
    verticalDivider: {
        width: 1,
        marginHorizontal: layout.spacing.m,
    } as ViewStyle,
    statLabel: {
        ...(typography.caption as TextStyle),
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    } as TextStyle,
    statValue: {
        ...(typography.h2 as TextStyle),
        fontSize: 24,
        fontWeight: '700',
    } as TextStyle,
    actionsData: {
        flexDirection: 'row',
        marginBottom: layout.spacing.xl,
        gap: layout.spacing.m,
    } as ViewStyle,
    actionBtnContainer: {
        flex: 1,
        ...layout.shadows.small,
    } as ViewStyle,
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12, // Slightly reduced padding
        paddingHorizontal: 8, // Added small horizontal padding to contain content
        borderRadius: layout.borderRadius.m,
        gap: 6, // Reduced gap
        height: 'auto', // Allow content to determine height
    } as ViewStyle,
    actionLabel: {
        ...(typography.button as TextStyle),
        color: '#FFF',
        fontSize: 13, // Slightly smaller text to fit
        textAlign: 'center',
    },
    sectionTitle: {
        ...(typography.h3 as TextStyle),
        marginBottom: layout.spacing.m,
    } as TextStyle,
    listContainer: {
        marginTop: layout.spacing.s,
    } as ViewStyle,
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layout.spacing.m,
        paddingHorizontal: layout.spacing.m,
        borderRadius: layout.borderRadius.l,
        marginBottom: layout.spacing.s,
        borderWidth: 1,
    } as ViewStyle,
    expenseInfo: {
        flex: 1,
        marginLeft: layout.spacing.m,
        justifyContent: 'center',
    } as ViewStyle,
    expenseTitle: {
        ...(typography.body1 as TextStyle),
        fontWeight: '600',
        fontSize: 16,
    } as TextStyle,
    expenseSubtitle: {
        ...(typography.caption as TextStyle),
        fontSize: 13,
    } as TextStyle,
    amountValue: {
        ...(typography.body1 as TextStyle),
        fontWeight: 'bold',
        fontSize: 16,
    } as TextStyle,
    dateText: {
        ...(typography.caption as TextStyle),
        fontSize: 12,
    } as TextStyle,
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: layout.spacing.xl,
        marginTop: layout.spacing.l,
    } as ViewStyle,
    emptyText: {
        ...(typography.h3 as TextStyle),
        marginBottom: layout.spacing.s,
    } as TextStyle,
    emptySubtext: {
        ...(typography.body2 as TextStyle),
        textAlign: 'center',
    } as TextStyle,
    fab: {
        position: 'absolute',
        bottom: layout.spacing.xl,
        right: layout.spacing.l,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...layout.shadows.large,
    } as ViewStyle,
    deleteGroupBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: layout.spacing.m,
        marginTop: layout.spacing.xl,
        borderWidth: 1,
        borderRadius: layout.borderRadius.m,
        gap: layout.spacing.s,
    } as ViewStyle,
    deleteGroupText: {
        ...(typography.button as TextStyle),
    } as TextStyle,
    membersContainer: {
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    membersScroll: {
        // flexGrow: 0,
    } as ViewStyle,
    membersScrollContent: {
        paddingRight: layout.spacing.l,
    } as ViewStyle,
    memberItem: {
        alignItems: 'center',
        marginRight: layout.spacing.l,
        position: 'relative',
        width: 60,
        marginVertical: 4, // Add some vertical breathing room
    } as ViewStyle,
    memberName: {
        ...(typography.caption as TextStyle),
        marginTop: 6,
        textAlign: 'center',
        fontSize: 12,
    } as TextStyle,
    addMemberBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: layout.spacing.l,
        width: 60,
        marginVertical: 4,
    } as ViewStyle,
    addMemberIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    removeMemberBtn: {
        position: 'absolute',
        top: -4,
        right: 0,
        borderRadius: 12,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        zIndex: 10,
        ...layout.shadows.small,
    } as ViewStyle,
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: layout.spacing.l,
        zIndex: 1000,
    } as ViewStyle,
    modalContent: {
        borderRadius: layout.borderRadius.l,
        padding: layout.spacing.l,
        borderWidth: 1,
        width: '100%',
        maxHeight: '80%',
    } as ViewStyle,
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: layout.spacing.m,
    } as ViewStyle,
    modalTitle: {
        ...(typography.h3 as TextStyle),
    } as TextStyle,
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layout.spacing.m,
        paddingHorizontal: layout.spacing.s,
        borderBottomWidth: 1,
        justifyContent: 'space-between',
    } as ViewStyle,
    selectedContactItem: {
    } as ViewStyle,
    contactName: {
        ...(typography.body1 as TextStyle),
        marginLeft: layout.spacing.m,
    } as TextStyle,
    settlementItem: {
    } as ViewStyle,
    settlementRow: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    settlementIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    } as ViewStyle,
    mergedAvatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 54,
    } as ViewStyle,
});
