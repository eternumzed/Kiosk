import React, { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import AuthStackNavigator from './src/navigation/AuthStackNavigator';
import AppTabNavigator from './src/navigation/AppTabNavigator';
import SplashScreen from './src/screens/SplashScreen';
import NotificationService from './src/services/notificationService';
import './src/i18n';
import { loadSavedLanguage } from './src/i18n';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef(null);
  
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            user: action.user || null,
            isLoading: false,
          };
        case 'LOGIN':
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload?.token ?? action.token,
            user: action.payload?.user ?? action.user ?? prevState.user,
          };
        case 'LOGOUT':
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            user: null,
          };
        case 'UPDATE_USER':
          return {
            ...prevState,
            user: action.payload ?? prevState.user,
          };
        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      user: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      let user;
      try {
        await loadSavedLanguage();
        userToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await AsyncStorage.getItem('user');
        user = storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {
        console.error('Failed to restore token:', e);
      }

      dispatch({ type: 'RESTORE_TOKEN', token: userToken, user });
    };

    // Initialize notifications on app start
    NotificationService.initialize(navigationRef);

    bootstrapAsync();

    return () => {
      NotificationService.cleanup();
    };
  }, []);

  // Register push token whenever an auth token is available.
  // User profile hydration can lag behind token restore in some app states.
  useEffect(() => {
    if (state.userToken) {
      NotificationService.registerPendingToken();
    }
  }, [state.userToken]);

  // Retry token sync when app returns to foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && state.userToken) {
        NotificationService.registerPendingToken();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [state.userToken]);

  if (state.isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {state.userToken == null ? (
          <Stack.Screen name="Auth" options={{ animationEnabled: false }}>
            {(props) => <AuthStackNavigator {...props} dispatch={dispatch} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="App" options={{ animationEnabled: false }}>
            {(props) => (
              <AppTabNavigator
                {...props}
                user={state.user}
                dispatch={dispatch}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
