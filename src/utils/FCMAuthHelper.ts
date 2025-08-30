// utils/FCMAuthHelper.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/notificationService';

class FCMAuthHelper {

    // Call this function after successful login
    static async onUserLogin(accessToken) {

        
        try {
            console.log('=== FCM LOGIN SETUP START ===');
            console.log('Access token received:', accessToken ? 'YES' : 'NO');

            // Store the access token
            await AsyncStorage.setItem('access_token', accessToken);
            console.log('Access token stored in AsyncStorage');

            // Verify token was stored
            const storedToken = await AsyncStorage.getItem('access_token');
            console.log('Verification - token in storage:', storedToken ? 'YES' : 'NO');

            // Check for pending FCM token
            const pendingToken = await AsyncStorage.getItem('pending_fcm_token');
            console.log('Pending FCM token exists:', pendingToken ? 'YES' : 'NO');

            // Initialize FCM with authentication
            console.log('Calling initializeFCMWithAuth...');
            const result = await NotificationService.initializeFCMWithAuth();

            console.log('FCM initialization result:', result);
            console.log('=== FCM LOGIN SETUP END ===');

            if (result.success) {
                return { success: true, message: 'Notifications enabled' };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.log('FCM auth setup error:', error);
            return { success: false, error: error.message };
        }
    }

    // Call this function on app startup to check if user is logged in
    static async checkAndSetupFCM() {
        try {
            console.log('=== FCM STARTUP CHECK ===');

            // Check both storage methods
            const accessToken = await AsyncStorage.getItem('access_token');
            const userData = await AsyncStorage.getItem('userData');

            console.log('Direct access_token found:', accessToken ? 'YES' : 'NO');
            console.log('userData found:', userData ? 'YES' : 'NO');

            if (accessToken || userData) {
                console.log('User is already logged in, setting up FCM with auth...');
                const result = await NotificationService.initializeFCMWithAuth();
                console.log('FCM auth setup result:', result);
                return result;
            } else {
                console.log('User not logged in, initializing FCM without auth...');
                const result = await NotificationService.initializeFCM();
                console.log('FCM basic setup result:', result);
                return result;
            }
        } catch (error) {
            console.log('Check and setup FCM error:', error);
            return { success: false, error: error.message };
        }
    }

    // Call this function when user logs out
    static async onUserLogout() {
        try {
            console.log('User logged out, cleaning up FCM data...');

            // Remove access token
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('userData');

            // Keep FCM token for future use but mark as pending
            const fcmToken = await NotificationService.getStoredFCMToken();
            if (fcmToken) {
                await AsyncStorage.setItem('pending_fcm_token', fcmToken);
            }

            console.log('FCM cleanup completed');
            return { success: true };
        } catch (error) {
            console.log('FCM logout cleanup error:', error);
            return { success: false, error: error.message };
        }
    }

    // Force refresh and register FCM token (useful for troubleshooting)
    static async refreshFCMToken() {
        try {
            console.log('=== FORCE FCM REFRESH ===');

            const result = await NotificationService.refreshAndSendToken();

            console.log('Force refresh result:', result);

            if (result.success) {
                console.log('FCM token refreshed and registered successfully');
                return { success: true, token: result.token };
            } else {
                console.log('FCM token refresh failed:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.log('Refresh FCM token error:', error);
            return { success: false, error: error.message };
        }
    }

    // Debug function to check current state
    static async debugCurrentState() {
        try {
            console.log('=== FCM DEBUG STATE ===');
            const accessToken = await AsyncStorage.getItem('access_token');
            const userData = await AsyncStorage.getItem('userData');
            const fcmToken = await AsyncStorage.getItem('fcm_token');
            const pendingToken = await AsyncStorage.getItem('pending_fcm_token');

            console.log('Access token:', accessToken ? 'EXISTS' : 'MISSING');
            console.log('User data:', userData ? 'EXISTS' : 'MISSING');
            console.log('FCM token:', fcmToken ? 'EXISTS' : 'MISSING');
            console.log('Pending token:', pendingToken ? 'EXISTS' : 'MISSING');

            if (fcmToken) {
                console.log('FCM token preview:', fcmToken.substring(0, 50) + '...');
            }

            if (userData) {
                const parsed = JSON.parse(userData);
                console.log('User data token:', parsed.token ? 'EXISTS' : 'MISSING');
            }

            return {
                hasAccessToken: !!accessToken,
                hasUserData: !!userData,
                hasFCMToken: !!fcmToken,
                hasPendingToken: !!pendingToken
            };
        } catch (error) {
            console.log('Debug state error:', error);
            return null;
        }
    }
}

export default FCMAuthHelper;