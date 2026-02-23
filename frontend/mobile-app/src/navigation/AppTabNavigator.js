import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import SelectDocumentScreen from '../screens/SelectDocumentScreen';
import RequestFormScreen from '../screens/RequestFormScreen';
import PaymentReviewScreen from '../screens/PaymentReviewScreen';
import RequestSuccessScreen from '../screens/RequestSuccessScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStack = ({ user, dispatch }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardList">
        {(props) => (
          <DashboardScreen {...props} user={user} dispatch={dispatch} />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Request Details',
          headerTintColor: colors.primary[600],
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            color: colors.text.primary,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen name="NewRequest">
        {(props) => <SelectDocumentScreen {...props} />}
      </Stack.Screen>
      <Stack.Screen name="RequestForm" component={RequestFormScreen} />
      <Stack.Screen name="PaymentReview" component={PaymentReviewScreen} />
      <Stack.Screen 
        name="RequestSuccess" 
        component={RequestSuccessScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back
        }}
      />
    </Stack.Navigator>
  );
};

export default function AppTabNavigator({ user, dispatch }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.text.muted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.7 }}>🏠</Text>
          ),
        }}
      >
        {(props) => (
          <DashboardStack {...props} user={user} dispatch={dispatch} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.7 }}>👤</Text>
          ),
        }}
      >
        {(props) => (
          <ProfileScreen {...props} user={user} dispatch={dispatch} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
