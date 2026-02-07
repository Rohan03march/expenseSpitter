import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { IntroScreen } from '../screens/IntroScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { RootStackParamList } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Ensure installed or handle via context
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AuthNavigator = () => {
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
        const checkIntro = async () => {
            try {
                const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');
                setIsFirstLaunch(hasSeenIntro === null);
            } catch (error) {
                console.error('Error checking intro status:', error);
                setIsFirstLaunch(true); // Default to showing intro on error
            }
        };

        checkIntro();
    }, []);

    if (isFirstLaunch === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName={isFirstLaunch ? "Intro" : "Welcome"}
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right'
            }}
        >
            <Stack.Screen name="Intro" component={IntroScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
    );
};
