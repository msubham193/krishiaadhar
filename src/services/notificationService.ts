// services/NotificationService.js
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

class NotificationService {
    constructor() {
        this.createNotificationListeners();
        this.baseURL = 'http://13.127.74.39:5000';
    }

    // Request permission for notifications
    async requestUserPermission() {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Authorization status:', authStatus);
                await this.getFCMToken();
                return true;
            } else {
                console.log('Permission denied');
                return false;
            }
        } catch (error) {
            console.log('Permission request error:', error);
            return false;
        }
    }

    // Get FCM token
    async getFCMToken() {
        try {
            const token = await messaging().getToken();
            if (token) {
                console.log('FCM Token generated:', token.substring(0, 50) + '...');
                await AsyncStorage.setItem('fcm_token', token);
                // Send token to your backend server
                const result = await this.sendTokenToServer(token);
                console.log('Send token result:', result);
                return token;
            } else {
                console.log('No FCM token received');
                return null;
            }
        } catch (error) {
            console.log('Get FCM token error:', error);
            return null;
        }
    }

    // Get stored FCM token
    async getStoredFCMToken() {
        try {
            const token = await AsyncStorage.getItem('fcm_token');
            return token;
        } catch (error) {
            console.log('Get stored FCM token error:', error);
            return null;
        }
    }

    // Get access token from storage
    async getAccessToken() {
        try {
            // First try direct access_token
            let token = await AsyncStorage.getItem('access_token');

            // If not found, try getting from userData
            if (!token) {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsedData = JSON.parse(userData);
                    token = parsedData.token;
                }
            }

            return token;
        } catch (error) {
            console.log('Get access token error:', error);
            return null;
        }
    }

    // Send token to your backend with proper headers
    async sendTokenToServer(token) {
        try {
            // Get access token from storage
            const accessToken = await this.getAccessToken();

            if (!accessToken) {
                console.log('No access token found, will retry when user logs in');
                // Store the token locally for later registration
                await AsyncStorage.setItem('pending_fcm_token', token);
                return { success: false, error: 'No access token found', pending: true };
            }

            const response = await fetch(`${this.baseURL}/add-fcmtoken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': accessToken,
                },
                body: JSON.stringify({
                    fcmToken: token,
                }),
            });

            const responseData = await response.json();

            if (response.ok) {
                console.log('Token sent to server successfully:', responseData);
                // Clear pending token on successful registration
                await AsyncStorage.removeItem('pending_fcm_token');
                return { success: true, data: responseData };
            } else {
                console.log('Failed to send token to server:', responseData);
                return { success: false, error: responseData };
            }
        } catch (error) {
            console.log('Send token to server error:', error);
            return { success: false, error: error.message };
        }
    }

    // Refresh FCM token and send to server
    async refreshAndSendToken() {
        try {
            const token = await messaging().getToken();
            if (token) {
                await AsyncStorage.setItem('fcm_token', token);
                const result = await this.sendTokenToServer(token);
                return { success: true, token, serverResponse: result };
            }
            return { success: false, error: 'Failed to get FCM token' };
        } catch (error) {
            console.log('Refresh and send token error:', error);
            return { success: false, error: error.message };
        }
    }

    // Register pending FCM token after user login
    async registerPendingFCMToken() {
        try {
            const pendingToken = await AsyncStorage.getItem('pending_fcm_token');
            if (pendingToken) {
                console.log('Found pending FCM token, attempting registration...');
                const result = await this.sendTokenToServer(pendingToken);
                if (result.success) {
                    console.log('Pending FCM token registered successfully');
                } else {
                    console.log('Failed to register pending FCM token:', result.error);
                }
                return result;
            }
            return { success: false, error: 'No pending token found' };
        } catch (error) {
            console.log('Register pending FCM token error:', error);
            return { success: false, error: error.message };
        }
    }

    // Initialize FCM for the app (works with or without authentication)
    async initializeFCM() {
        try {
            const permissionGranted = await this.requestUserPermission();
            if (permissionGranted) {
                const token = await this.getFCMToken();
                return { success: true, token };
            } else {
                return { success: false, error: 'Permission not granted' };
            }
        } catch (error) {
            console.log('Initialize FCM error:', error);
            return { success: false, error: error.message };
        }
    }

    // Initialize FCM for authenticated users
    async initializeFCMWithAuth() {
        try {
            const accessToken = await this.getAccessToken();
            if (!accessToken) {
                return { success: false, error: 'User not authenticated' };
            }

            const permissionGranted = await this.requestUserPermission();
            if (permissionGranted) {
                const token = await this.getFCMToken();
                // Register pending token if exists
                await this.registerPendingFCMToken();
                return { success: true, token };
            } else {
                return { success: false, error: 'Permission not granted' };
            }
        } catch (error) {
            console.log('Initialize FCM with auth error:', error);
            return { success: false, error: error.message };
        }
    }

    // Create notification listeners
    createNotificationListeners() {
        // Foreground message handler
        messaging().onMessage(async remoteMessage => {
            console.log('Foreground message:', remoteMessage);
            this.handleForegroundMessage(remoteMessage);
        });

        // Background message handler
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('Background message:', remoteMessage);
            this.saveNotificationToStorage(remoteMessage);
        });

        // Notification opened app handler
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('Notification opened app:', remoteMessage);
            this.handleNotificationNavigation(remoteMessage);
        });

        // App opened from quit state
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('App opened from quit state:', remoteMessage);
                    this.handleNotificationNavigation(remoteMessage);
                }
            });

        // Token refresh listener
        messaging().onTokenRefresh(async token => {
            console.log('Token refreshed:', token);
            await AsyncStorage.setItem('fcm_token', token);
            this.sendTokenToServer(token);
        });
    }

    // Handle foreground messages (show in-app notification)
    handleForegroundMessage(remoteMessage) {
        const { title, body } = remoteMessage.notification || {};

        Alert.alert(
            title || 'New Notification',
            body || 'You have a new message',
            [
                { text: 'Dismiss', style: 'cancel' },
                {
                    text: 'View',
                    onPress: () => this.handleNotificationNavigation(remoteMessage)
                }
            ]
        );

        // Save to local storage
        this.saveNotificationToStorage(remoteMessage);
    }

    // Save notification to AsyncStorage
    async saveNotificationToStorage(remoteMessage) {
        try {
            const notification = {
                id: remoteMessage.messageId || Date.now().toString(),
                title: remoteMessage.notification?.title || 'Notification',
                message: remoteMessage.notification?.body || 'New message',
                data: remoteMessage.data || {},
                timestamp: new Date(),
                isRead: false,
                type: remoteMessage.data?.type || 'system',
                priority: remoteMessage.data?.priority || 'medium',
                iconName: this.getIconFromType(remoteMessage.data?.type || 'system'),
                iconColor: this.getColorFromType(remoteMessage.data?.type || 'system'),
                actionable: remoteMessage.data?.actionable === 'true',
                actionText: remoteMessage.data?.actionText,
                actionRoute: remoteMessage.data?.actionRoute,
            };

            // Get existing notifications
            const existingNotifications = await this.getStoredNotifications();
            const updatedNotifications = [notification, ...existingNotifications];

            // Keep only last 50 notifications
            const limitedNotifications = updatedNotifications.slice(0, 50);

            await AsyncStorage.setItem(
                'stored_notifications',
                JSON.stringify(limitedNotifications)
            );

            console.log('Notification saved to storage');
        } catch (error) {
            console.log('Save notification error:', error);
        }
    }

    // Get stored notifications
    async getStoredNotifications() {
        try {
            const notifications = await AsyncStorage.getItem('stored_notifications');
            return notifications ? JSON.parse(notifications) : [];
        } catch (error) {
            console.log('Get stored notifications error:', error);
            return [];
        }
    }

    // Handle notification navigation
    handleNotificationNavigation(remoteMessage) {
        const { data } = remoteMessage;

        if (data?.screen) {
            // Navigate to specific screen
            // You'll need to pass navigation reference here
            console.log('Navigate to screen:', data.screen);
        }
    }

    // Get icon based on notification type
    getIconFromType(type) {
        const iconMap = {
            irrigation: 'water-drop',
            weather: 'cloud',
            crop: 'agriculture',
            expert: 'person',
            system: 'settings',
            reminder: 'schedule',
            default: 'notifications'
        };
        return iconMap[type] || iconMap.default;
    }

    // Get color based on notification type
    getColorFromType(type) {
        const colorMap = {
            irrigation: '#3B82F6',
            weather: '#F59E0B',
            crop: '#EF4444',
            expert: '#10B981',
            system: '#64748B',
            reminder: '#8B5CF6',
            default: '#3B82F6'
        };
        return colorMap[type] || colorMap.default;
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            const notifications = await this.getStoredNotifications();
            const updatedNotifications = notifications.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification
            );

            await AsyncStorage.setItem(
                'stored_notifications',
                JSON.stringify(updatedNotifications)
            );

            return updatedNotifications;
        } catch (error) {
            console.log('Mark as read error:', error);
            return [];
        }
    }

    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const notifications = await this.getStoredNotifications();
            const filteredNotifications = notifications.filter(
                notification => notification.id !== notificationId
            );

            await AsyncStorage.setItem(
                'stored_notifications',
                JSON.stringify(filteredNotifications)
            );

            return filteredNotifications;
        } catch (error) {
            console.log('Delete notification error:', error);
            return [];
        }
    }

    // Clear all notifications
    async clearAllNotifications() {
        try {
            await AsyncStorage.removeItem('stored_notifications');
            return [];
        } catch (error) {
            console.log('Clear all notifications error:', error);
            return [];
        }
    }

    // Get unread count
    async getUnreadCount() {
        try {
            const notifications = await this.getStoredNotifications();
            return notifications.filter(n => !n.isRead).length;
        } catch (error) {
            console.log('Get unread count error:', error);
            return 0;
        }
    }
}

export default new NotificationService();