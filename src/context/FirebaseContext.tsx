import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile,
    updatePassword
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    addDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    runTransaction
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// --- Types ---
export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
}

export interface Group {
    id: string;
    name: string;
    image: string | null;
    members: User[];
    memberIds: string[];
    totalExpenses: number;
    createdBy: string;
    createdAt?: any;
}

export interface GroupRequest {
    id: string;
    groupId: string;
    title: string;
    createdBy: string;
    createdAt: any;
    memberIds: string[];
    icon?: string;
    totalAmount?: number;
    membersPaid?: string[]; // Array of member IDs who have paid/contributed
}

export interface Expense {
    id: string;
    groupId: string;
    requestId?: string; // Optional: Link to a specific request
    title: string;
    amount: number;
    paidBy: string;
    splitWith: string[];
    date: number;
    type?: 'expense' | 'settlement';
}

export interface Message {
    id: string;
    groupId: string;
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
    reactions?: Record<string, string[]>;
}

interface FirebaseContextType {
    user: User | null;
    loading: boolean;
    groups: Group[];
    expenses: Expense[];
    groupRequests: GroupRequest[]; // New state
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    createGroup: (name: string, image: string | null) => Promise<void>;
    createRequest: (groupId: string, title: string, memberIds: string[], icon?: string) => Promise<void>; // Updated function
    deleteRequest: (requestId: string) => Promise<void>; // New function
    deleteGroup: (groupId: string) => Promise<void>;
    searchUser: (email: string) => Promise<User | null>;
    addMember: (groupId: string, user: User) => Promise<void>;
    addMemberToRequest: (requestId: string, userId: string) => Promise<void>; // New function
    removeMemberFromRequest: (requestId: string, userId: string) => Promise<void>; // New function
    removeMember: (groupId: string, memberId: string) => Promise<void>;
    addExpense: (groupId: string, title: string, amount: number, paidBy: string, splitWith: string[], type?: 'expense' | 'settlement', requestId?: string) => Promise<void>;
    deleteExpense: (groupId: string, expenseId: string, requestId?: string) => Promise<void>;
    getGroupExpenses: (groupId: string, requestId?: string) => Expense[];
    getGroupBalances: (groupId: string, requestId?: string) => Record<string, number>;
    getGroupRequests: (groupId: string) => GroupRequest[]; // New function
    currency: string;
    formatCurrency: (amount: number) => string;
    toggleCurrency: () => void;
    updateUserProfile: (name: string, avatar?: string) => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
    sendMessage: (groupId: string, text: string, replyTo?: { id: string, senderName: string, text: string }) => Promise<void>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
}

export const FirebaseContext = createContext<FirebaseContextType>({} as FirebaseContextType);


interface FirebaseProviderProps {
    children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<Group[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [groupRequests, setGroupRequests] = useState<GroupRequest[]>([]);
    const [currency, setCurrency] = useState<'USD' | 'INR'>('INR');

    // --- Auth Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({
                        id: firebaseUser.uid,
                        name: userData.name || firebaseUser.displayName || "User",
                        email: firebaseUser.email || "",
                        avatar: userData.avatar || firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                    });
                } else {
                    setUser({
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || "User",
                        email: firebaseUser.email || "",
                        avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                    });
                }
            } else {
                setUser(null);
                setGroups([]);
                setExpenses([]);
                setGroupRequests([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- Groups Listener ---
    useEffect(() => {
        if (!user) {
            setGroups([]);
            return;
        }

        const q = query(collection(db, "groups"), where("memberIds", "array-contains", user.id));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedGroups: Group[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    image: data.image,
                    members: data.members || [],
                    memberIds: data.memberIds || [],
                    totalExpenses: data.totalExpenses || 0,
                    createdBy: data.createdBy
                };
            });
            setGroups(fetchedGroups);
        });

        return () => unsubscribe();
    }, [user]);

    // --- Group Requests Listener ---
    useEffect(() => {
        if (!user) {
            setGroupRequests([]);
            return;
        }

        // Listen for requests where user is a member
        // Also could be creator, but creator should be in memberIds
        const q = query(collection(db, "requests"), where("memberIds", "array-contains", user.id));

        console.log(`[FirebaseContext] Listening for requests for user: ${user.id}`);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRequests: GroupRequest[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data
                } as GroupRequest;
            });
            setGroupRequests(fetchedRequests);

            // Optional: We could also fetch expenses here to calculate 'membersPaid' dynamically?
            // Or we can stick to just UI calculation in GroupRequestsScreen if expenses are available there.
            // But expenses are fetched per group. So we have them in context!
            // BUT 'expenses' state in context might not be fully loaded or filtered yet.
            // Actually, we do load expenses for first 10 groups.
            // Let's defer calculation to the Screen component where we have access to context 'expenses'.
            // No, the user wants it on the card.
            // Let's just rely on visual calculation in the Screen for now.
        }, (error) => {
            console.error("[FirebaseContext] Requests listener error:", error);
            Alert.alert("Error", "Failed to fetch requests: " + error.message);
        });

        return () => unsubscribe();
    }, [user]);


    // --- Expenses Listener ---
    useEffect(() => {
        if (groups.length === 0) {
            setExpenses([]);
            return;
        }

        const groupIds = groups.map(g => g.id).slice(0, 10);
        if (groupIds.length === 0) return;

        const q = query(collection(db, "expenses"), where("groupId", "in", groupIds));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedExpenses: Expense[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date?.toMillis ? data.date.toMillis() : data.date
                } as Expense;
            });
            setExpenses(fetchedExpenses);
        });

        return () => unsubscribe();
    }, [groups]);


    // --- Actions ---

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (name: string, email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const u = userCredential.user;

        await updateProfile(u, { displayName: name });
        await setDoc(doc(db, "users", u.uid), {
            name,
            email,
            avatar: `https://i.pravatar.cc/150?u=${u.uid}`,
            createdAt: new Date(),
        });
    };

    const updateUserProfile = async (name: string, avatar?: string) => {
        if (!auth.currentUser || !user) return;

        await updateProfile(auth.currentUser, {
            displayName: name,
            photoURL: avatar || auth.currentUser.photoURL
        });

        const userRef = doc(db, "users", user.id);
        const updateData: any = { name };
        if (avatar) updateData.avatar = avatar;

        await updateDoc(userRef, updateData);

        setUser(prev => prev ? { ...prev, name, avatar: avatar || prev.avatar } : null);
    };

    const changePassword = async (newPassword: string) => {
        if (!auth.currentUser) return;
        await updatePassword(auth.currentUser, newPassword);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const createGroup = async (name: string, image: string | null) => {
        if (!user) return;

        const newGroup = {
            name,
            image,
            memberIds: [user.id],
            members: [user],
            createdBy: user.id,
            totalExpenses: 0,
            createdAt: new Date()
        };

        await addDoc(collection(db, "groups"), newGroup);
    };

    const createRequest = async (groupId: string, title: string, memberIds: string[], icon: string = 'documents-outline') => {
        if (!user) return;

        // Ensure creator is in memberIds
        const allMemberIds = Array.from(new Set([...memberIds, user.id]));

        const newRequest = {
            groupId,
            title,
            createdBy: user.id,
            memberIds: allMemberIds,
            createdAt: new Date(),
            totalAmount: 0, // Optional: tracking total spend for request
            icon,
            membersPaid: [] // No one paid by default
        };

        await addDoc(collection(db, "requests"), newRequest);
    };

    const deleteRequest = async (requestId: string) => {
        if (!user) return;

        // 1. Fetch all expenses linked to this request
        const expensesQ = query(collection(db, "expenses"), where("requestId", "==", requestId));
        const snapshot = await getDocs(expensesQ);

        // 2. Delete each expense (and update group totals)
        const deletePromises = snapshot.docs.map(doc => deleteExpense(doc.id));
        await Promise.all(deletePromises);

        // 3. Delete the request itself
        await deleteDoc(doc(db, "requests", requestId));
    };

    const deleteGroup = async (groupId: string) => {
        if (!user) return;

        // 1. Fetch all requests linked to this group
        const requestsQ = query(collection(db, "requests"), where("groupId", "==", groupId));
        const requestsSnapshot = await getDocs(requestsQ);

        // 2. Delete all requests (and their expenses via existing logic? No, createRequest deletion handles its own expenses)
        // Actually, deleteRequest already deletes its expenses. So we can just call deleteRequest for each request.
        const deleteRequestPromises = requestsSnapshot.docs.map(doc => deleteRequest(doc.id));
        await Promise.all(deleteRequestPromises);

        // 3. Delete expenses that are NOT linked to a request (direct group expenses)
        // Expenses with requestId were deleted above. We need to catch any stragglers if any? 
        // Our app puts almost all expenses in requests now, but 'General' expenses might exist.
        // Let's safe-delete all expenses with this groupId just in case.
        const expensesQ = query(collection(db, "expenses"), where("groupId", "==", groupId));
        const expensesSnapshot = await getDocs(expensesQ);
        const deleteExpensePromises = expensesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteExpensePromises);

        // 4. Delete the group itself
        await deleteDoc(doc(db, "groups", groupId));
    };

    const addMemberToGroup = async (groupId: string, userToAdd: User) => {
        const groupRef = doc(db, "groups", groupId);
        const group = groups.find(g => g.id === groupId);

        if (group && group.memberIds && group.memberIds.includes(userToAdd.id)) {
            Alert.alert("Already a Member", "This user is already in the group.");
            return;
        }

        await updateDoc(groupRef, {
            members: arrayUnion(userToAdd),
            memberIds: arrayUnion(userToAdd.id)
        });

        Alert.alert("Success", `${userToAdd.name} added to the group.`);
    };

    const addMemberToRequest = async (requestId: string, userId: string) => {
        const requestRef = doc(db, "requests", requestId);
        await updateDoc(requestRef, {
            memberIds: arrayUnion(userId)
        });
    };

    const removeMemberFromRequest = async (requestId: string, userId: string) => {
        const requestRef = doc(db, "requests", requestId);
        await updateDoc(requestRef, {
            memberIds: arrayRemove(userId)
        });
    };

    const removeMember = async (groupId: string, memberId: string) => {
        const groupRef = doc(db, "groups", groupId);
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const updatedMembers = group.members.filter(m => m.id !== memberId);
        const updatedMemberIds = updatedMembers.map(m => m.id);

        await updateDoc(groupRef, {
            members: updatedMembers,
            memberIds: updatedMemberIds
        });
    };

    const searchUser = async (email: string): Promise<User | null> => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        return {
            id: userDoc.id,
            name: userData.name || "User",
            email: userData.email,
            avatar: userData.avatar || `https://i.pravatar.cc/150?u=${userDoc.id}`
        };
    };

    const addExpense = async (groupId: string, title: string, amount: number, paidBy: string, splitWith: string[], type: 'expense' | 'settlement' = 'expense', requestId?: string) => {
        const expenseData: any = {
            groupId,
            title,
            amount,
            paidBy,
            splitWith,
            date: new Date(),
            type
        };

        if (requestId) {
            expenseData.requestId = requestId;
        }

        await addDoc(collection(db, "expenses"), expenseData);

        if (type === 'expense') {
            const groupRef = doc(db, "groups", groupId);
            const group = groups.find(g => g.id === groupId);
            if (group) {
                await updateDoc(groupRef, {
                    totalExpenses: (group.totalExpenses || 0) + amount
                });
            }
        }

        // If linked to a request, mark the payer as 'paid'
        if (requestId) {
            const requestRef = doc(db, "requests", requestId);
            await updateDoc(requestRef, {
                membersPaid: arrayUnion(paidBy),
                // Optional: Increment totalAmount if we want to track it
                // totalAmount: increment(amount) 
            });
        }
    };

    const deleteExpense = async (expenseId: string) => {
        const expenseRef = doc(db, "expenses", expenseId);
        const expenseDoc = await getDoc(expenseRef);

        if (expenseDoc.exists()) {
            const data = expenseDoc.data() as Expense;

            // Delete the expense document
            await deleteDoc(expenseRef);

            // If it was an expense (not settlement), reduce group total
            if (data.type === 'expense' || !data.type) {
                const groupRef = doc(db, "groups", data.groupId);
                // We use increment(-amount) for atomic update
                const { increment } = require('firebase/firestore');
                // Actually need to import increment from firebase/firestore at top, 
                // but since I can't easily add import at top with this tool without reading whole file,
                // I will try to use the existing updateDoc.
                // Wait, I plan to use 'increment' but it wasn't imported.
                // Let's use getDoc and update for now to be safe with imports, 
                // OR assume I can just do previous implementation pattern.

                // Let's check imports. 'increment' is NOT in imports.
                // I'll stick to read-modify-write for safety or add 'increment' to imports in a separate step?
                // Read-modify-write is safer given current context visibility.

                const groupDoc = await getDoc(groupRef);
                if (groupDoc.exists()) {
                    const groupData = groupDoc.data();
                    const newTotal = (groupData.totalExpenses || 0) - data.amount;
                    await updateDoc(groupRef, {
                        totalExpenses: Math.max(0, newTotal)
                    });
                }
            }
        }
    };

    const getGroupExpenses = (groupId: string, requestId?: string) => {
        let groupExp = expenses.filter(e => e.groupId === groupId);

        if (requestId) {
            groupExp = groupExp.filter(e => e.requestId === requestId);
        }

        return groupExp.sort((a, b) => b.date - a.date);
    };

    const getGroupRequests = (groupId: string) => {
        return groupRequests.filter(r => r.groupId === groupId);
    };

    const getGroupBalances = (groupId: string, requestId?: string) => {
        const groupExpenses = getGroupExpenses(groupId, requestId);
        const balances: { [userId: string]: number } = {};

        // Use group members to initialize balances?
        // If requestId is present, maybe use request members?
        // For simplicity, we initialize with Group Members.
        const group = groups.find(g => g.id === groupId);
        if (group && group.members) {
            group.members.forEach(m => balances[m.id] = 0);
        }

        groupExpenses.forEach(expense => {
            const paidBy = expense.paidBy;
            const amount = expense.amount;
            const splitBy = expense.splitWith.length;
            if (splitBy === 0) return;
            const splitAmount = amount / splitBy;

            balances[paidBy] = (balances[paidBy] || 0) + amount;

            expense.splitWith.forEach(memberId => {
                balances[memberId] = (balances[memberId] || 0) - splitAmount;
            });
        });

        return balances;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const toggleCurrency = () => {
        setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
    };

    const sendMessage = async (groupId: string, text: string, replyTo?: { id: string, senderName: string, text: string }) => {
        if (!user) return;

        await addDoc(collection(db, "messages"), {
            groupId,
            text,
            senderId: user.id,
            senderName: user.name,
            avatar: user.avatar,
            timestamp: Date.now(),
            replyTo: replyTo || null,
        });
    };

    const addReaction = async (messageId: string, emoji: string) => {
        if (!user) return;
        const messageRef = doc(db, "messages", messageId);

        try {
            await runTransaction(db, async (transaction) => {
                const messageDoc = await transaction.get(messageRef);
                if (!messageDoc.exists()) return;

                const data = messageDoc.data() as Message;
                const reactions = data.reactions || {};

                let wasRemoved = false;
                // Remove user from ALL existing reactions
                Object.keys(reactions).forEach(key => {
                    if (reactions[key].includes(user.id)) {
                        reactions[key] = reactions[key].filter((id: string) => id !== user.id);
                        if (key === emoji) wasRemoved = true;
                    }
                });

                // Add to new emoji unless we just toggled it off
                if (!wasRemoved) {
                    if (!reactions[emoji]) reactions[emoji] = [];
                    reactions[emoji].push(user.id);
                }

                // Cleanup empty keys
                Object.keys(reactions).forEach(key => {
                    if (reactions[key].length === 0) {
                        delete reactions[key];
                    }
                });

                transaction.update(messageRef, { reactions });
            });
        } catch (e) {
            console.error("Transaction failed: ", e);
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "messages", messageId));
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    return (
        <FirebaseContext.Provider value={{
            user,
            loading,
            groups,
            expenses,
            groupRequests,
            login,
            signup,
            logout,
            createGroup,
            createRequest,
            deleteRequest,
            deleteGroup,
            addMember: addMemberToGroup,
            addMemberToRequest,
            removeMemberFromRequest,
            searchUser,
            removeMember,
            addExpense,
            deleteExpense,
            getGroupExpenses,
            getGroupBalances,
            getGroupRequests,
            currency,
            formatCurrency,
            toggleCurrency,
            updateUserProfile,
            changePassword,
            sendMessage,
            addReaction,
            deleteMessage,
        }}>
            {children}
        </FirebaseContext.Provider>
    );
};
