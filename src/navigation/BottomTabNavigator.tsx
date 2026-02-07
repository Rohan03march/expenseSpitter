import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GroupListScreen } from '../screens/GroupListScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ name, color, size, focused }: { name: any, color: string, size: number, focused: boolean }) => {
    return (
        <View style={[styles.iconContainer, focused && styles.iconFocused]}>
            <Ionicons name={name} size={size} color={color} />
        </View>
    );
};

export const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            id={undefined}
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 85 : 60,
                },
                tabBarBackground: () => (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                ),
                tabBarShowLabel: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tab.Screen
                name="Home"
                component={GroupListScreen}
                options={{
                    tabBarIcon: (props) => <TabBarIcon name={props.focused ? "home" : "home-outline"} {...props} />
                }}
            />
            <Tab.Screen
                name="Add"
                component={CreateGroupScreen}
                options={{
                    tabBarIcon: (props) => <TabBarIcon name={props.focused ? "add-circle" : "add-circle-outline"} {...props} size={32} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: (props) => <TabBarIcon name={props.focused ? "person" : "person-outline"} {...props} />
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: (props) => <TabBarIcon name={props.focused ? "settings" : "settings-outline"} {...props} />
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    iconFocused: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    }
});
