import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ViewStyle, TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Avatar } from '../components/Avatar';
import { GradientButton } from '../components/GradientButton';
import { colors, gradients } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';
import { FirebaseContext, User } from '../context/FirebaseContext';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupRequests'>;

export const GroupRequestsScreen: React.FC<Props> = ({ navigation, route }) => {
    const { group: initialGroup } = route.params;
    const { user, groups, getGroupRequests, createRequest, deleteRequest } = useContext(FirebaseContext);

    // Use live group data from context if available, otherwise fallback to initial params
    const group = groups.find(g => g.id === initialGroup.id) || initialGroup;

    // Safety check: if user or group is missing (e.g. strict mode or deep link issues)
    if (!user || !group) return null;

    const requests = getGroupRequests(group.id);
    const [modalVisible, setModalVisible] = useState(false);
    const [newRequestTitle, setNewRequestTitle] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('documents-outline');
    // Default to all other members selected
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const REQUEST_ICONS = [
        { name: 'airplane', label: 'Trip' },
        { name: 'cart', label: 'Grocery' },
        { name: 'restaurant', label: 'Food' },
        { name: 'wine', label: 'Party' },
        { name: 'home', label: 'Rent' },
        { name: 'receipt', label: 'Bill' },
        { name: 'gift', label: 'Gift' },
        { name: 'car', label: 'Fuel' },
        { name: 'medkit', label: 'Health' },
        { name: 'documents-outline', label: 'Other' },
    ];

    // Initialize selection when modal opens
    React.useEffect(() => {
        if (modalVisible) {
            setSelectedMembers(group.members.map(m => m.id).filter(id => id !== user.id));
        }
    }, [modalVisible, group.members, user.id]);

    const isCreator = group.createdBy === user.id;

    const handleCreateRequest = async () => {
        if (!newRequestTitle.trim()) {
            Alert.alert("Error", "Please enter a title");
            return;
        }
        if (selectedMembers.length === 0) {
            Alert.alert("Error", "Please select at least one member");
            return;
        }

        setLoading(true);
        try {
            await createRequest(group.id, newRequestTitle, selectedMembers, selectedIcon);
            setModalVisible(false);
            setNewRequestTitle('');
            setSelectedIcon('documents-outline');
            setSelectedMembers([]);
        } catch (error) {
            Alert.alert("Error", "Failed to create request");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = (requestId: string, title: string) => {
        Alert.alert(
            "Delete Request",
            `Are you sure you want to delete "${title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteRequest(requestId);
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete request");
                        }
                    }
                }
            ]
        );
    };

    const toggleMemberSelection = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(prev => prev.filter(id => id !== memberId));
        } else {
            setSelectedMembers(prev => [...prev, memberId]);
        }
    };

    const renderRequestItem = ({ item }: { item: any }) => {
        const creator = group.members.find(m => m.id === item.createdBy);
        const requestMembers = group.members.filter(m => item.memberIds.includes(m.id));

        // Mock payment status for now, or calculate if we had expenses
        // Logic: count expenses in this request where 'paidBy' is a member and type is 'settlement' or just expense contribution?
        // User wants "1/2 paid". This implies members who have "paid their share".
        // For now, let's just show members count as "X members involved"
        // But user explicitly asked for "1/2 paid".
        // Let's use the 'membersPaid' field I added to interface, even if it's mock/empty for now.
        const paidCount = item.membersPaid?.length || 0;
        const totalMembers = requestMembers.length;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('GroupDashboard', { group, requestId: item.id, requestTitle: item.title })}
                onLongPress={() => {
                    if (item.createdBy === user.id) {
                        handleDeleteRequest(item.id, item.title);
                    } else {
                        Alert.alert("Permission Denied", "Only the creator of this request can delete it.");
                    }
                }}
                activeOpacity={0.9}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                        <Avatar source={{ uri: creator?.avatar }} size={40} />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.userName}>{creator?.name || 'Unknown'}</Text>
                            <Text style={styles.timeText}>Requested {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}</Text>
                        </View>
                    </View>
                    <View style={styles.amountBadge}>
                        <Text style={styles.amountText}>{paidCount}/{totalMembers} paid</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.iconBox}>
                        <Ionicons name={item.icon as any || "documents-outline"} size={24} color={colors.primaryLight} />
                    </View>
                    <Text style={styles.messageText}>{item.title}</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${(paidCount / Math.max(totalMembers, 1)) * 100}%` }]} />
                </View>

                {requestMembers.length > 0 && (
                    <View style={styles.footerRow}>
                        <View style={styles.avatarRow}>
                            {requestMembers.slice(0, 5).map((member, index) => (
                                <View key={member.id} style={[styles.avatarContainer, { marginLeft: index > 0 ? -12 : 0, zIndex: 10 - index }]}>
                                    <Avatar source={{ uri: member.avatar }} size={24} />
                                </View>
                            ))}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </View>
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
                <Text style={styles.headerTitle}>{group.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={requests}
                renderItem={renderRequestItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>No requests yet</Text>
                        <Text style={styles.emptySubtext}>Create one to start tracking expenses</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <LinearGradient
                    colors={gradients.primary as any}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={32} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Request</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Request Title (e.g. Lunch, Petrol)"
                            placeholderTextColor={colors.textSecondary}
                            value={newRequestTitle}
                            onChangeText={setNewRequestTitle}
                        />

                        <Text style={styles.sectionTitle}>Select Icon</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                            {REQUEST_ICONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon.name}
                                    style={[styles.iconOption, selectedIcon === icon.name && styles.selectedIconOption]}
                                    onPress={() => setSelectedIcon(icon.name)}
                                >
                                    <View style={[styles.iconCircle, selectedIcon === icon.name && styles.selectedIconCircle]}>
                                        <Ionicons name={icon.name as any} size={24} color={selectedIcon === icon.name ? "#FFF" : colors.textSecondary} />
                                    </View>
                                    <Text style={[styles.iconLabel, selectedIcon === icon.name && styles.selectedIconLabel]}>{icon.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.sectionTitle}>Select Members</Text>
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                            {group.members.map(member => (
                                <TouchableOpacity
                                    key={member.id}
                                    style={[styles.memberRow, selectedMembers.includes(member.id) && styles.selectedMemberRow]}
                                    onPress={() => toggleMemberSelection(member.id)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Avatar source={{ uri: member.avatar }} size={32} />
                                        <Text style={[styles.memberName, selectedMembers.includes(member.id) && styles.selectedMemberName]}>
                                            {member.id === user.id ? 'You' : member.name}
                                        </Text>
                                    </View>
                                    {selectedMembers.includes(member.id) && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <GradientButton
                                title="Create"
                                onPress={handleCreateRequest}
                                loading={loading}
                                style={{ flex: 1, marginLeft: 12 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
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
        // backgroundColor: colors.background, // Let generic background show
    } as ViewStyle,
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: layout.borderRadius.round,
        backgroundColor: colors.surfaceHighlight,
    } as ViewStyle,
    headerTitle: {
        ...(typography.h3 as TextStyle),
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 20,
    } as TextStyle,
    listContent: {
        padding: layout.spacing.l,
        paddingBottom: 100,
    } as ViewStyle,
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)', // Glass-like surface
        borderRadius: layout.borderRadius.xl,
        padding: layout.spacing.l,
        marginBottom: layout.spacing.m,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        flexDirection: 'column',
    } as ViewStyle,
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: layout.spacing.m,
    } as ViewStyle,
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    userName: {
        ...(typography.body2 as TextStyle),
        color: colors.textPrimary,
        fontWeight: '700',
    } as TextStyle,
    timeText: {
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        fontSize: 11,
    } as TextStyle,
    amountBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: layout.borderRadius.m,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    } as ViewStyle,
    amountText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.success,
    } as TextStyle,
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: layout.spacing.m,
    } as ViewStyle,
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    } as ViewStyle,
    messageText: {
        ...(typography.h3 as TextStyle),
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: 18,
        flex: 1,
    } as TextStyle,
    progressContainer: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginBottom: layout.spacing.m,
        overflow: 'hidden',
    } as ViewStyle,
    progressBar: {
        height: '100%',
        backgroundColor: colors.success,
        borderRadius: 2,
    } as ViewStyle,
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    } as ViewStyle,
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 4,
    } as ViewStyle,
    avatarContainer: {
        borderWidth: 2,
        borderColor: colors.surface, // Match card bg somewhat or just dark
        borderRadius: 12,
    } as ViewStyle,
    moreAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    } as ViewStyle,
    moreAvatarText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.textPrimary,
    } as TextStyle,
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        opacity: 0.8,
    } as ViewStyle,
    emptyText: {
        ...(typography.h3 as TextStyle),
        color: colors.textPrimary,
        marginTop: layout.spacing.l,
    } as TextStyle,
    emptySubtext: {
        ...(typography.body2 as TextStyle),
        color: colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        width: '70%',
    } as TextStyle,
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        borderRadius: 30,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    } as ViewStyle,
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    } as ViewStyle,
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)', // Darker overlay
        justifyContent: 'flex-end', // Bottom sheet style? Or center? Center is fine.
        padding: layout.spacing.m,
    } as ViewStyle,
    modalContent: {
        backgroundColor: '#1E293B', // Slate 800
        borderRadius: layout.borderRadius.xl,
        padding: layout.spacing.xl,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    } as ViewStyle,
    modalTitle: {
        ...(typography.h2 as TextStyle),
        color: colors.textPrimary,
        marginBottom: layout.spacing.xl,
        textAlign: 'center',
    } as TextStyle,
    input: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.l,
        padding: layout.spacing.m,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: layout.spacing.xl,
        fontSize: 16,
    } as TextStyle,
    sectionTitle: {
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        fontWeight: '700',
        marginBottom: layout.spacing.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    } as TextStyle,
    iconScroll: {
        marginBottom: layout.spacing.xl,
    } as ViewStyle,
    iconOption: {
        alignItems: 'center',
        marginRight: layout.spacing.l,
    } as ViewStyle,
    selectedIconOption: {
        transform: [{ scale: 1.1 }],
    } as ViewStyle,
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 8,
    } as ViewStyle,
    selectedIconCircle: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryLight,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    } as ViewStyle,
    iconLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
    } as TextStyle,
    selectedIconLabel: {
        color: colors.primaryLight,
        fontWeight: 'bold',
    } as TextStyle,
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: layout.spacing.m,
        borderRadius: layout.borderRadius.m,
        marginBottom: 4,
        backgroundColor: 'rgba(255,255,255,0.02)',
    } as ViewStyle,
    selectedMemberRow: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
    } as ViewStyle,
    memberName: {
        marginLeft: 12,
        ...(typography.body1 as TextStyle),
        color: colors.textPrimary,
        fontWeight: '500',
    } as TextStyle,
    selectedMemberName: {
        color: '#FFF',
        fontWeight: '600',
    } as TextStyle,
    modalButtons: {
        flexDirection: 'row',
        marginTop: layout.spacing.xl,
        gap: layout.spacing.m,
    } as ViewStyle,
    cancelButton: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: layout.borderRadius.l,
        backgroundColor: 'transparent',
    } as ViewStyle,
    cancelButtonText: {
        ...(typography.button as TextStyle),
        color: colors.textSecondary,
        fontWeight: '600',
    } as TextStyle,
});
