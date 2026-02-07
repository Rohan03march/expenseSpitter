import React, { createContext, useState, ReactNode, useEffect } from 'react';

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
    members: string[]; // User IDs
    totalExpenses: number;
}

export interface Expense {
    id: string;
    groupId: string;
    title: string;
    amount: number;
    paidBy: string;
    splitWith: string[];
    date: number;
}

interface MockContextType {
    user: User | null;
    groups: Group[];
    expenses: Expense[];
    login: (email: string, password: string) => void;
    signup: (name: string, email: string, password: string) => void;
    logout: () => void;
    createGroup: (name: string, image: string | null) => void;
    deleteGroup: (groupId: string) => void;
    addMember: (groupId: string, memberId: string) => void;
    removeMember: (groupId: string, memberId: string) => void;
    addExpense: (groupId: string, title: string, amount: number, paidBy: string, splitWith: string[]) => void;
    deleteExpense: (expenseId: string) => void;
    getGroupExpenses: (groupId: string) => Expense[];
    getGroupBalances: (groupId: string) => { [userId: string]: number };
    currency: 'USD' | 'INR';
    formatCurrency: (amount: number) => string;
    toggleCurrency: () => void;
}

export const MockContext = createContext<MockContextType>({
    user: null,
    groups: [],
    expenses: [],
    login: () => { },
    signup: () => { },
    logout: () => { },
    createGroup: () => { },
    deleteGroup: () => { },
    addMember: () => { },
    removeMember: () => { },
    addExpense: () => { },
    deleteExpense: () => { },
    getGroupExpenses: () => [],
    getGroupBalances: () => ({}),
    currency: 'USD',
    formatCurrency: (amount) => `$${amount}`,
    toggleCurrency: () => { },
});

interface MockProviderProps {
    children: ReactNode;
}

// --- Initial Data ---
const INITIAL_GROUPS: Group[] = [
    {
        id: 'g1',
        name: 'Trip to Paris',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
        members: ['u1', 'u2', 'u3'],
        totalExpenses: 450
    },
    {
        id: 'g2',
        name: 'Apartment 404',
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop',
        members: ['u1', 'u4'],
        totalExpenses: 1200
    },
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', groupId: 'g1', title: 'Dinner at Eiffel Tower', amount: 200, paidBy: 'u1', splitWith: ['u1', 'u2', 'u3'], date: Date.now() - 10000000 },
    { id: 'e2', groupId: 'g1', title: 'Museum Tickets', amount: 60, paidBy: 'u2', splitWith: ['u1', 'u2', 'u3'], date: Date.now() - 8000000 },
];

// --- MOCK USERS ---
// --- MOCK USERS ---
export const MOCK_USERS = [
    { id: 'u1', name: 'John Doe', email: 'john@example.com', password: 'password', avatar: 'https://i.pravatar.cc/300' },
    { id: 'u2', name: 'Alice Smith', email: 'alice@example.com', password: 'password', avatar: 'https://i.pravatar.cc/301' },
    { id: 'u3', name: 'Bob', avatar: 'https://i.pravatar.cc/302' },
    { id: 'u4', name: 'Charlie', avatar: 'https://i.pravatar.cc/303' },
];

export const MockProvider: React.FC<MockProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
    const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

    const login = (email: string, password: string) => {
        console.log("Mock Login with:", email, password);
        const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (foundUser) {
            setUser({
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                avatar: foundUser.avatar,
            });
        } else {
            // Fallback for demo if not in list, or just alert?
            // Let's stick to the mock users for the specific request, but keep generic fall back for convenience if they type random stuff?
            // Actually, the user asked for *specific* 2 users.
            alert("Invalid credentials. Try john@example.com / password");
        }
    };

    const signup = (name: string, email: string, password: string) => {
        console.log("Mock Signup with:", name, email);
        const newUser = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            email,
            password,
            avatar: `https://i.pravatar.cc/150?u=${email}`,
        };
        MOCK_USERS.push(newUser); // Add to mock DB
        setUser({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            avatar: newUser.avatar,
        });
    };

    const logout = () => {
        setUser(null);
    };

    const createGroup = (name: string, image: string | null) => {
        const newGroup: Group = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            image,
            members: ['u1'], // Creator is member
            totalExpenses: 0
        };
        setGroups([newGroup, ...groups]);
    };

    const deleteGroup = (groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setExpenses(prev => prev.filter(e => e.groupId !== groupId));
    };

    const addMember = (groupId: string, memberId: string) => {
        setGroups(prev => prev.map(g => {
            if (g.id === groupId && !g.members.includes(memberId)) {
                return { ...g, members: [...g.members, memberId] };
            }
            return g;
        }));
    };

    const removeMember = (groupId: string, memberId: string) => {
        setGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                return { ...g, members: g.members.filter(m => m !== memberId) };
            }
            return g;
        }));
    };

    const addExpense = (groupId: string, title: string, amount: number, paidBy: string, splitWith: string[]) => {
        const newExpense: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            groupId,
            title,
            amount,
            paidBy,
            splitWith,
            date: Date.now(),
        };
        setExpenses([newExpense, ...expenses]);

        // Update group total logic if needed, but we calculate dynamic usually
        setGroups(groups.map(g => g.id === groupId ? { ...g, totalExpenses: g.totalExpenses + amount } : g));
    };

    const deleteExpense = (expenseId: string) => {
        const expenseToDelete = expenses.find(e => e.id === expenseId);
        if (expenseToDelete) {
            setExpenses(prev => prev.filter(e => e.id !== expenseId));
            setGroups(groups.map(g => g.id === expenseToDelete.groupId ? { ...g, totalExpenses: g.totalExpenses - expenseToDelete.amount } : g));
        }
    };

    const getGroupExpenses = (groupId: string) => {
        return expenses.filter(e => e.groupId === groupId).sort((a, b) => b.date - a.date);
    };

    const getGroupBalances = (groupId: string) => {
        const groupExpenses = getGroupExpenses(groupId);
        const balances: { [userId: string]: number } = {};

        // Initialize balances
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.members.forEach(m => balances[m] = 0);
        }

        groupExpenses.forEach(expense => {
            const paidBy = expense.paidBy;
            const amount = expense.amount;
            const splitBy = expense.splitWith.length;
            const splitAmount = amount / splitBy;

            // Payer gets back the full amount (temporarily)
            balances[paidBy] = (balances[paidBy] || 0) + amount;

            // Everyone involved pays their share (subtract from their balance)
            expense.splitWith.forEach(memberId => {
                balances[memberId] = (balances[memberId] || 0) - splitAmount;
            });
        });

        // Convert to list of debts (simplified: just returning net balances for now, 
        // or we can calculate transfers. Let's return the net balances object first for flexibility,
        // or better yet, a list of transfers: who owes whom).

        // Let's return a detailed balance object for the screen to process
        return balances;
    };

    const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const toggleCurrency = () => {
        setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
    };

    return (
        <MockContext.Provider value={{
            user,
            groups,
            expenses,
            currency,
            login,
            signup,
            logout,
            createGroup,
            deleteGroup,
            addMember,
            removeMember,
            addExpense,
            deleteExpense,
            getGroupExpenses,
            getGroupBalances,
            formatCurrency,
            toggleCurrency
        }}>
            {children}
        </MockContext.Provider>
    );
};
