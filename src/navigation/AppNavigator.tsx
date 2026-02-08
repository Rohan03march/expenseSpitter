import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FirebaseContext } from '../context/FirebaseContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { GroupListScreen } from '../screens/GroupListScreen';
import { GroupRequestsScreen } from '../screens/GroupRequestsScreen';
import { GroupDashboardScreen } from '../screens/GroupDashboardScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { BalancesScreen } from '../screens/BalancesScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { ExpenseDetailsScreen } from '../screens/ExpenseDetailsScreen';
import { IntroScreen } from '../screens/IntroScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    const { user, loading } = useContext(FirebaseContext);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
                initialRouteName={user ? "GroupList" : "Login"}
            >
                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="GroupList" component={GroupListScreen} />
                        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
                        <Stack.Screen name="GroupRequests" component={GroupRequestsScreen} />
                        <Stack.Screen name="GroupDashboard" component={GroupDashboardScreen} />
                        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="Balances" component={BalancesScreen} />
                        <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
                        {/* Intro and Welcome might be needed if logic requires them, but user is logged in here.
                            If strict auth flow, they might be accessible from Settings or conditional.
                            For now, let's add them to be safe if they are navigated to.
                        */}
                        <Stack.Screen name="Intro" component={IntroScreen} />
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
