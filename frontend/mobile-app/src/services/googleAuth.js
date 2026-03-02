import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Required for expo-auth-session
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration

const GOOGLE_CLIENT_ID = {
  expo: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
  ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  web: '410554279522-jm96cq4bn0oblcumtecp6n283qtqqb10.apps.googleusercontent.com',
};

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_CLIENT_ID.expo,
    iosClientId: GOOGLE_CLIENT_ID.ios,
    androidClientId: GOOGLE_CLIENT_ID.android,
    webClientId: GOOGLE_CLIENT_ID.web,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      scheme: 'kiosk-mobile-app',
      useProxy: true,
    }),
  });

  return { request, response, promptAsync };
};

export const getGoogleUserInfo = async (accessToken) => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    throw error;
  }
};

export default {
  useGoogleAuth,
  getGoogleUserInfo,
  GOOGLE_CLIENT_ID,
};
