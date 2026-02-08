import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../context/ThemeContext';
import { FirebaseContext } from '../context/FirebaseContext';
import { RootStackParamList } from '../navigation/types';
import { layout } from '../theme/layout';
import { typography } from '../theme/typography';
import { Avatar } from '../components/Avatar';
import { GlassView } from '../components/GlassView';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpenseDetails'>;

export const ExpenseDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
    const { group, expense } = route.params;
    const { colors } = useTheme();
    const { formatCurrency, user: currentUser } = useContext(FirebaseContext);

    const payer = group.members.find(m => m.id === expense.paidBy);
    const date = new Date(expense.date);
    const dateString = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Calculate splits
    const totalAmount = expense.amount;
    const splitCount = Math.max(1, expense.splitWith.length);
    const splitAmount = totalAmount / splitCount;

    const isSettlement = expense.type === 'settlement';

    return (
        <ScreenWrapper>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Expense Details</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddExpense', { group, expense })}
                    style={styles.iconButton}
                >
                    <Ionicons name="create-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Header Info */}
                <View style={styles.mainInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: isSettlement ? colors.primaryLight + '20' : colors.surface }]}>
                        <Ionicons
                            name={isSettlement ? "swap-horizontal" : "receipt-outline"}
                            size={32}
                            color={isSettlement ? colors.primary : colors.textPrimary}
                        />
                    </View>
                    <Text style={[styles.expenseTitle, { color: colors.textPrimary }]}>{expense.title}</Text>
                    <Text style={[styles.amount, { color: colors.textPrimary }]}>{formatCurrency(totalAmount)}</Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>{dateString} at {timeString}</Text>
                </View>

                {/* Payer Info */}
                <GlassView style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Original transaction</Text>
                    <View style={styles.userRow}>
                        <Avatar source={{ uri: payer?.avatar }} size={40} />
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: colors.textPrimary }]}>
                                {payer?.id === currentUser?.id ? 'You' : payer?.name}
                            </Text>
                            <Text style={[styles.userAction, { color: colors.textSecondary }]}>paid {formatCurrency(totalAmount)}</Text>
                        </View>
                    </View>
                </GlassView>

                {/* Split Details */}
                {!isSettlement && (
                    <View style={styles.listContainer}>
                        <Text style={[styles.listTitle, { color: colors.textSecondary }]}>Shared with {splitCount} people</Text>

                        {expense.splitWith.map(memberId => {
                            const member = group.members.find(m => m.id === memberId);
                            const isPayer = memberId === expense.paidBy;
                            const isMe = memberId === currentUser?.id;

                            // If I am the payer:
                            // - member owes me splitAmount (if member != me)
                            // - "You owe yourself" (if member == me) -> usually shown as "Your share"

                            // If Payer is someone else:
                            // - I owe Payer splitAmount (if member == me)
                            // - Member owes Payer splitAmount (if member != me)

                            let statusText = '';
                            let statusColor = colors.textSecondary;

                            if (expense.paidBy === currentUser?.id) {
                                if (isMe) {
                                    statusText = `Your share`;
                                } else {
                                    statusText = `owes you ${formatCurrency(splitAmount)}`;
                                    statusColor = colors.success;
                                }
                            } else {
                                if (isMe) {
                                    statusText = `you owe ${formatCurrency(splitAmount)}`;
                                    statusColor = colors.error;
                                } else if (memberId === expense.paidBy) {
                                    statusText = `paid ${formatCurrency(totalAmount)} and share is ${formatCurrency(splitAmount)}`;
                                } else {
                                    statusText = `owes ${formatCurrency(splitAmount)}`;
                                }
                            }

                            return (
                                <GlassView key={memberId} style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={styles.memberLeft}>
                                        <Avatar source={{ uri: member?.avatar }} size={36} />
                                        <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                                            {isMe ? 'You' : member?.name}
                                        </Text>
                                    </View>
                                    <View style={styles.memberRight}>
                                        <Text style={[styles.memberStatus, { color: statusColor }]}>
                                            {statusText}
                                        </Text>
                                        {(statusText === 'Your share' || (!isMe && expense.paidBy !== currentUser?.id && memberId !== expense.paidBy)) && (
                                            <Text style={[styles.memberAmount, { color: colors.textPrimary }]}>
                                                {formatCurrency(splitAmount)}
                                            </Text>
                                        )}
                                    </View>
                                </GlassView>
                            );
                        })}
                    </View>
                )}

                {isSettlement && (
                    <GlassView style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: layout.spacing.l }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Transaction Details</Text>
                        <View style={styles.userRow}>
                            <Avatar source={{ uri: group.members.find(m => m.id === expense.splitWith[0])?.avatar }} size={40} />
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { color: colors.textPrimary }]}>
                                    {expense.splitWith[0] === currentUser?.id ? 'You' : group.members.find(m => m.id === expense.splitWith[0])?.name}
                                </Text>
                                <Text style={[styles.userAction, { color: colors.textSecondary }]}>received {formatCurrency(totalAmount)}</Text>
                            </View>
                        </View>
                    </GlassView>
                )}

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layout.spacing.l,
        paddingVertical: layout.spacing.m,
        borderBottomWidth: 1,
    } as ViewStyle,
    iconButton: {
        padding: layout.spacing.s,
    } as ViewStyle,
    headerTitle: {
        ...(typography.h3 as TextStyle),
        fontSize: 18,
    } as TextStyle,
    content: {
        padding: layout.spacing.l,
    } as ViewStyle,
    mainInfo: {
        alignItems: 'center',
        marginBottom: layout.spacing.xl,
    } as ViewStyle,
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layout.spacing.m,
    } as ViewStyle,
    expenseTitle: {
        ...(typography.h2 as TextStyle),
        marginBottom: layout.spacing.xs,
        textAlign: 'center',
    } as TextStyle,
    amount: {
        ...(typography.h1 as TextStyle),
        fontWeight: 'bold',
        marginBottom: layout.spacing.s,
    } as TextStyle,
    date: {
        ...(typography.body2 as TextStyle),
    } as TextStyle,
    section: {
        padding: layout.spacing.m,
        borderRadius: layout.borderRadius.l,
        borderWidth: 1,
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    sectionTitle: {
        ...(typography.caption as TextStyle),
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: layout.spacing.m,
    } as TextStyle,
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    userInfo: {
        marginLeft: layout.spacing.m,
    } as ViewStyle,
    userName: {
        ...(typography.body1 as TextStyle),
        fontWeight: '600',
    } as TextStyle,
    userAction: {
        ...(typography.body2 as TextStyle),
    } as TextStyle,
    listContainer: {
    } as ViewStyle,
    listTitle: {
        ...(typography.h3 as TextStyle),
        fontSize: 16,
        marginBottom: layout.spacing.m,
    } as TextStyle,
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: layout.spacing.m,
        borderRadius: layout.borderRadius.m,
        borderWidth: 1,
        marginBottom: layout.spacing.s,
    } as ViewStyle,
    memberLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    memberName: {
        ...(typography.body1 as TextStyle),
        marginLeft: layout.spacing.m,
        fontWeight: '500',
    } as TextStyle,
    memberRight: {
        alignItems: 'flex-end',
    } as ViewStyle,
    memberStatus: {
        ...(typography.caption as TextStyle),
        fontWeight: '600',
    } as TextStyle,
    memberAmount: {
        ...(typography.body1 as TextStyle),
        fontWeight: 'bold',
    } as TextStyle,
});
