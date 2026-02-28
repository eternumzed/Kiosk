import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function AuthStackNavigator({ dispatch }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} dispatch={dispatch} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
