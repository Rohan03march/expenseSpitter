import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ViewStyle, TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Avatar } from '../components/Avatar';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../context/ThemeContext';
import { gradients } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';
import { FirebaseContext, User } from '../context/FirebaseContext';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupRequests'>;

export const GroupRequestsScreen: React.FC<Props> = ({ navigation, route }) => {
    const { group: initialGroup } = route.params;
    const { user, groups, getGroupRequests, createRequest, deleteRequest } = useContext(FirebaseContext);
    const { colors } = useTheme();

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
    const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');

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

        const paidCount = item.membersPaid?.length || 0;
        const totalMembers = requestMembers.length;

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
                            <Text style={[styles.userName, { color: colors.textPrimary }]}>{creator?.name || 'Unknown'}</Text>
                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>Requested {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}</Text>
                        </View>
                    </View>
                    <View style={styles.amountBadge}>
                        <Text style={styles.amountText}>{paidCount}/{totalMembers} paid</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '40' }]}>
                        <Ionicons name={item.icon as any || "documents-outline"} size={24} color={colors.primaryLight || colors.primary} />
                    </View>
                    <Text style={[styles.messageText, { color: colors.textPrimary }]}>{item.title}</Text>
                </View>

                {/* Progress Bar */}
                <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressBar, { width: `${(paidCount / Math.max(totalMembers, 1)) * 100}%` }]} />
                </View>

                {requestMembers.length > 0 && (
                    <View style={styles.footerRow}>
                        <View style={styles.avatarRow}>
                            {requestMembers.slice(0, 5).map((member, index) => (
                                <View key={member.id} style={[styles.avatarContainer, { borderColor: colors.surface, marginLeft: index > 0 ? -12 : 0, zIndex: 10 - index }]}>
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

    const pendingRequests = requests.filter(req => {
        const requestMembers = group.members.filter(m => req.memberIds.includes(m.id));
        const paidCount = req.membersPaid?.length || 0;
        return paidCount < requestMembers.length;
    });

    const settledRequests = requests.filter(req => {
        const requestMembers = group.members.filter(m => req.memberIds.includes(m.id));
        const paidCount = req.membersPaid?.length || 0;
        return paidCount >= requestMembers.length;
    });

    const requestsToDisplay = activeTab === 'pending' ? pendingRequests : settledRequests;

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surfaceHighlight }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{group.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'pending' ? '#FFF' : colors.textSecondary }]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'settled' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setActiveTab('settled')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'settled' ? '#FFF' : colors.textSecondary }]}>Settled</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={requestsToDisplay}
                renderItem={renderRequestItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No {activeTab} requests</Text>
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
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Request</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                            placeholder="Request Title (e.g. Lunch, Petrol)"
                            placeholderTextColor={colors.textSecondary}
                            value={newRequestTitle}
                            onChangeText={setNewRequestTitle}
                        />

                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Select Icon</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                            {REQUEST_ICONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon.name}
                                    style={[styles.iconOption, selectedIcon === icon.name && styles.selectedIconOption]}
                                    onPress={() => setSelectedIcon(icon.name)}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }, selectedIcon === icon.name && { backgroundColor: colors.primary, borderColor: colors.primaryLight }]}>
                                        <Ionicons name={icon.name as any} size={24} color={selectedIcon === icon.name ? "#FFF" : colors.textSecondary} />
                                    </View>
                                    <Text style={[styles.iconLabel, { color: colors.textSecondary }, selectedIcon === icon.name && { color: colors.primaryLight }]}>{icon.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Select Members</Text>
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                            {group.members.map(member => (
                                <TouchableOpacity
                                    key={member.id}
                                    style={[styles.memberRow, { backgroundColor: colors.surfaceHighlight + '10' }, selectedMembers.includes(member.id) && { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}
                                    onPress={() => toggleMemberSelection(member.id)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Avatar source={{ uri: member.avatar }} size={32} />
                                        <Text style={[styles.memberName, { color: colors.textPrimary }, selectedMembers.includes(member.id) && { color: colors.textPrimary }]}>
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
                            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
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
    } as ViewStyle,
    headerTitle: {
        ...(typography.h3 as TextStyle),
        fontWeight: 'bold',
        fontSize: 20,
    } as TextStyle,
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: layout.spacing.l,
        marginBottom: layout.spacing.s,
        gap: 12,
    } as ViewStyle,
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: layout.borderRadius.l,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(156, 163, 175, 0.3)', // Default border
    } as ViewStyle,
    tabText: {
        ...(typography.button as TextStyle),
        fontWeight: '600',
    } as TextStyle,

    listContent: {
        padding: layout.spacing.l,
        paddingBottom: 100,
    } as ViewStyle,
    card: {
        borderRadius: layout.borderRadius.xl,
        padding: layout.spacing.l,
        marginBottom: layout.spacing.m,
        borderWidth: 1,
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
        fontWeight: '700',
    } as TextStyle,
    timeText: {
        ...(typography.caption as TextStyle),
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
        color: '#10B981', // Always green
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
    } as ViewStyle,
    messageText: {
        ...(typography.h3 as TextStyle),
        fontWeight: '600',
        fontSize: 18,
        flex: 1,
    } as TextStyle,
    progressContainer: {
        height: 4,
        borderRadius: 2,
        marginBottom: layout.spacing.m,
        overflow: 'hidden',
    } as ViewStyle,
    progressBar: {
        height: '100%',
        backgroundColor: '#10B981',
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
        borderRadius: 12,
    } as ViewStyle,
    moreAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    } as ViewStyle,
    moreAvatarText: {
        fontSize: 10,
        fontWeight: 'bold',
    } as TextStyle,
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        opacity: 0.8,
    } as ViewStyle,
    emptyText: {
        ...(typography.h3 as TextStyle),
        marginTop: layout.spacing.l,
    } as TextStyle,
    emptySubtext: {
        ...(typography.body2 as TextStyle),
        marginTop: 8,
        textAlign: 'center',
        width: '70%',
    } as TextStyle,
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        borderRadius: 30,
        shadowColor: '#000',
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
        justifyContent: 'flex-end', // Bottom sheet style? Or center? Center is fine.
        padding: layout.spacing.m,
    } as ViewStyle,
    modalContent: {
        borderRadius: layout.borderRadius.xl,
        padding: layout.spacing.xl,
        maxHeight: '85%',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    } as ViewStyle,
    modalTitle: {
        ...(typography.h2 as TextStyle),
        marginBottom: layout.spacing.xl,
        textAlign: 'center',
    } as TextStyle,
    input: {
        borderRadius: layout.borderRadius.l,
        padding: layout.spacing.m,
        borderWidth: 1,
        marginBottom: layout.spacing.xl,
        fontSize: 16,
    } as TextStyle,
    sectionTitle: {
        ...(typography.caption as TextStyle),
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
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 8,
    } as ViewStyle,
    selectedIconCircle: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    } as ViewStyle,
    iconLabel: {
        fontSize: 11,
        fontWeight: '600',
    } as TextStyle,
    selectedIconLabel: {
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
        borderWidth: 1,
        borderColor: 'transparent',
    } as ViewStyle,
    selectedMemberRow: {
        borderWidth: 1,
    } as ViewStyle,
    memberName: {
        marginLeft: 12,
        ...(typography.body1 as TextStyle),
        fontWeight: '500',
    } as TextStyle,
    selectedMemberName: {
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
        borderRadius: layout.borderRadius.l,
        backgroundColor: 'transparent',
    } as ViewStyle,
    cancelButtonText: {
        ...(typography.button as TextStyle),
        fontWeight: '600',
    } as TextStyle,
});
