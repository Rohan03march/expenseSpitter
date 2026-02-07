import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ViewStyle, TextStyle, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { colors, gradients } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';
import { FirebaseContext, User } from '../context/FirebaseContext';
import { Avatar } from '../components/Avatar';
import { GlassView } from '../components/GlassView';
import { GradientButton } from '../components/GradientButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Balances'>;

export const BalancesScreen: React.FC<Props> = ({ route, navigation }) => {
    const { group } = route.params;
    const { getGroupBalances, formatCurrency, addExpense, user } = useContext(FirebaseContext);
    const [balances, setBalances] = useState<{ [userId: string]: number }>({});

    useEffect(() => {
        const loadBalances = () => {
            setBalances(getGroupBalances(group.id));
        };
        loadBalances();
        // Refresh when gaining focus
        const unsubscribe = navigation.addListener('focus', loadBalances);
        return unsubscribe;
    }, [navigation, group.id, getGroupBalances, group.members]); // Add group.members deps

    const getMemberName = (id: string) => {
        if (id === user?.id) return 'You';
        const member = group.members.find((m: User) => m.id === id);
        return member?.name || 'Unknown';
    };

    const getMemberAvatar = (id: string) => {
        const member = group.members.find((m: User) => m.id === id);
        return member?.avatar || 'https://i.pravatar.cc/150';
    };

    const handleSettle = (userId: string, amount: number) => {
        // Create an expense to settle the debt
        // If amount is negative, it means they owe me (or I owe them?)
        // Logic: if balance > 0, they are OWED money (positive). If balance < 0, they OWE money (negative).
        // Wait, my logic in Context:
        // Payer +amount
        // Splitters -splitAmount
        // So:
        // + means you paid more than your share -> You are owed.
        // - means you paid less than your share -> You owe.

        // This screen shows net balances.
        // If I am u1:
        // u1 > 0: I am owed.
        // u1 < 0: I owe.

        // But this screen shows GROUP balances.
        // Let's list everyone.

        // Simplified Settle: just "Settle Up" calls addExpense with a payment.
        // let's say we click on someone who OWES (balance < 0).
        // We assume they pay the person who is OWED (balance > 0).
        // This is complex to automate perfectly without a graph algorithm.

        // For MVP: Just a "Settle All" or click user to acknowledge payment.
        // Let's just make a generic "Settle Up" that records a payment from user to someone.
        // Actually, let's keep it simple: List users.
        // Green: Gets back $X
        // Red: Owes $X

        // Action: If I am logged in as 'u1' (You).
        // If I owe money (u1 < 0), I see a button "Pay [Someone]".
        // If I am owed money (u1 > 0), maybe I can "Remind".

    };

    const renderBalanceItem = (userId: string, amount: number) => {
        const isMe = userId === user?.id;
        const isOwed = amount > 0;
        // If amount < 0, it means 'userId' owes the group/someone?
        // Wait, 'balances' are net balances.
        // User > 0: User is OWED money.
        // User < 0: User OWES money.

        // If I am view user.
        // If I owe (my balance < 0), I need to pay someone who is owed (balance > 0).
        // This screen shows everyone's balance.

        // If I click on someone who is OWED (amount > 0), and I OWE (myBalance < 0), 
        // maybe I want to pay THEM?

        // Simplified: If I see someone with positive balance (Owed), I can pay them.
        // If I see someone with negative balance (Owes), I can remind them?

        // Use case: "Settle Up".
        // Usually, I am the one paying. So I am paying someone.
        // I should click on the person I want to PAY.
        // That person must have a positive balance (they are owed).

        // Or if *I* am the one owed money, someone else pays me. 
        // But in the app I usually record payments *I* make or receive.

        // Let's follow Splitwise logic:
        // You click "Settle Up", you select who you are paying.
        // Or if you are receiving, you select who is paying you.

        // Here, we list users.
        // If I click a user:
        //  - If they are OWED (>0): I can pay them. (Pre-fill: I pay Them, Amount = min(abs(myBalance), theirBalance))
        //  - If they OWE (<0): I can record they paid me? (Pre-fill: They pay Me, Amount = min(myBalance, abs(theirBalance)))

        const myBalance = balances[user?.id || ''] || 0;

        const handleUserPress = () => {
            if (isMe) return;

            let settlementType = 'pay'; // default
            let defaultAmount = 0;

            // Heuristics for default amount
            if (myBalance < 0 && amount > 0) {
                // I owe, they are owed. I likely pay them.
                // Suggested amount: min(what I owe, what they are owed)
                defaultAmount = Math.min(Math.abs(myBalance), amount);
                navigation.navigate('AddExpense', {
                    group,
                    recipientId: userId,
                    amount: parseFloat(defaultAmount.toFixed(2))
                });
            } else if (myBalance > 0 && amount < 0) {
                // I am owed, they owe. They likely pay me.
                // But AddExpense defaults to "Paid By Me".
                // We'd need to set PaidBy = Them, PaidTo = Me.
                // Current AddExpense logic might strictly handle "Me paying someone" for settlement if simplified?
                // Let's check AddExpense: "Paid By" is state. "Recipient" is state.
                // So we can support "They pay Me".
                // But for now, user asked: "in the settleup of the other user... add default amount"

                // Let's stick to simple Case 1: I pay them.
                defaultAmount = Math.min(myBalance, Math.abs(amount));
                // We can navigate, but we need to tell AddExpense to set PaidBy=Them. 
                // Currently I only implemented passing `recipientId`.
                // I'll stick to just handle "I pay Them" for now as it's the most common "Settle Up" action triggered by me.
                // Or I can add `paidById` param support to AddExpense later if needed.

                // For now, if I click someone who owes me, I probably want to "Remind" them, not pay them.
                // So let's only enable click if `amount > 0` (They are owed) -> I can pay them.
                Alert.alert("Info", "To record that they paid you, please use the Settle Up button below and switch payer.");
            } else {
                // No obvious debt relation or both owe/owed (complex)
                // Just open empty
                navigation.navigate('AddExpense', { group, recipientId: userId });
            }
        };

        if (Math.abs(amount) < 0.01) return null; // Settled

        return (
            <TouchableOpacity
                key={userId}
                style={styles.balanceItem}
                onPress={handleUserPress}
                disabled={isMe}
            >
                <View style={styles.userInfo}>
                    <Avatar source={{ uri: getMemberAvatar(userId) }} size={40} />
                    <View style={{ marginLeft: layout.spacing.m }}>
                        <Text style={styles.userName}>{isMe ? 'You' : getMemberName(userId)}</Text>
                        <Text style={[
                            styles.balanceText,
                            isOwed ? styles.textSuccess : styles.textError
                        ]}>
                            {isOwed ? 'gets back' : 'owes'} {formatCurrency(Math.abs(amount))}
                        </Text>
                    </View>
                </View>
                {!isMe && amount > 0 && myBalance < 0 && (
                    <LinearGradient
                        colors={gradients.primary as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.settleButton}
                    >
                        <Text style={styles.settleButtonText}>Settle</Text>
                    </LinearGradient>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Balances</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <GlassView style={styles.card}>
                    <Text style={styles.sectionTitle}>Net Balances</Text>
                    {Object.entries(balances).map(([userId, amount]) => renderBalanceItem(userId, amount))}
                    {Object.keys(balances).length === 0 && (
                        <View style={{ padding: layout.spacing.l, alignItems: 'center' }}>
                            <Ionicons name="documents-outline" size={48} color={colors.textSecondary} />
                            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: layout.spacing.m }}>
                                No balances calculated yet.
                            </Text>
                        </View>
                    )}
                </GlassView>

                {/* Simplified Settle Button for Demo */}
                <View style={styles.settleSection}>
                    <Text style={styles.helperText}>
                        To settle up, add an expense paid by the debtor and split with the creditor.
                    </Text>
                    <GradientButton
                        title="Record a Payment"
                        onPress={() => navigation.navigate('AddExpense', { group })}
                    // In real app, this would open a specific "Record Payment" screen
                    // defaulting to "Payment" type.
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.spacing.l,
        paddingTop: layout.spacing.m,
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    backButton: {
        marginRight: layout.spacing.m,
    } as ViewStyle,
    headerTitle: {
        ...(typography.h2 as TextStyle),
        color: colors.textPrimary,
    } as TextStyle,
    content: {
        paddingHorizontal: layout.spacing.l,
    } as ViewStyle,
    card: {
        marginBottom: layout.spacing.xl,
        padding: layout.spacing.l,
    } as ViewStyle,
    sectionTitle: {
        ...(typography.h3 as TextStyle),
        color: colors.textPrimary,
        marginBottom: layout.spacing.m,
    } as TextStyle,
    balanceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: layout.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    } as ViewStyle,
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    userName: {
        ...(typography.body1 as TextStyle),
        fontWeight: '600',
        color: colors.textPrimary,
    } as TextStyle,
    balanceText: {
        ...(typography.body2 as TextStyle),
        marginTop: 2,
    } as TextStyle,
    textSuccess: {
        color: colors.success,
    } as TextStyle,
    textError: {
        color: colors.error,
    } as TextStyle,
    settleSection: {
        marginTop: layout.spacing.m,
    } as ViewStyle,
    helperText: {
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: layout.spacing.m,
    } as TextStyle,
    settleButton: {
        paddingHorizontal: layout.spacing.m,
        paddingVertical: 6,
        borderRadius: 16,
    } as ViewStyle,
    settleButtonText: {
        ...(typography.caption as TextStyle),
        color: '#FFF',
        fontWeight: 'bold',
    } as TextStyle,
});
