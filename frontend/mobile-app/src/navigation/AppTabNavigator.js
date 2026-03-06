import React from 'react';
import { Text, Image, View, StyleSheet } from 'react-native';
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
import { Feather } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStack = ({ user, dispatch, t }) => {
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
          headerTitle: t('request_detail_header_title'),
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
  const { t } = useTranslation();
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
          tabBarLabel: t('common_home'),
          tabBarIcon: ({ color, focused }) => (
               <Feather name="home" size={25} color={color} />
          ),
        }}
      >
        {(props) => (
          <DashboardStack {...props} user={user} dispatch={dispatch} t={t} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: t('common_profile'),
          tabBarIcon: ({ color, focused }) => (
            user?.profilePicture ? (
              <View style={[
                styles.profileImageContainer,
                focused && styles.profileImageContainerActive
              ]}>
                <Image 
                  source={{ uri: user.profilePicture }} 
                  style={styles.profileImage}
                />
              </View>
            ) : (
              <View style={[
                styles.defaultProfileContainer,
                focused && styles.defaultProfileContainerActive
              ]}>
                <FontAwesome name="user" size={18} color={color} />
              </View>
            )
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

const styles = StyleSheet.create({
  profileImageContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileImageContainerActive: {
    borderColor: colors.primary[600],
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  defaultProfileContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  defaultProfileContainerActive: {
    borderColor: colors.primary[600],
  },
});
