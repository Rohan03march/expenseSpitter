import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Group, Expense } from '../context/FirebaseContext';

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    Intro: undefined;
    Welcome: undefined;
    Login: undefined;
    Signup: undefined;
    GroupList: undefined;
    CreateGroup: undefined;
    GroupDetails: { group: any }; // Replace 'any' with explicit Group type later
    GroupRequests: { group: Group };
    GroupDashboard: { group: Group; requestId?: string; requestTitle?: string };
    AddExpense: { group: Group; expense?: Expense; recipientId?: string; amount?: number; requestId?: string; requestMemberIds?: string[]; initialType?: 'expense' | 'settlement' };
    Settings: undefined;
    Profile: undefined;
    Chat: { group: Group };
    Balances: { group: Group };
    ExpenseDetails: { group: Group; expense: Expense };
};

export type AuthScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type MainScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
