// screens/NotificationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Dimensions,
    Animated,
} from 'react-native';
import { blue } from '../utils/Colors';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import NotificationService from '../services/notificationService';

const { width } = Dimensions.get('window');

// Color palette
const colors = {
    primary: blue,
    secondary: '#4CAF50',
    background: '#F8FAFC',
    white: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    gradient1: '#667eea',
    gradient2: '#764ba2',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    unread: '#FEF3C7',
    unreadBorder: '#F59E0B',
};

interface NotificationScreenProps {
    navigation: {
        goBack: () => void;
        navigate: (screen: string, params?: any) => void;
    };
}

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fcmToken, setFcmToken] = useState(null);
    const [tokenStatus, setTokenStatus] = useState('checking');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState('all');

    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        initializeScreen();
        startPulseAnimation();
    }, []);

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const initializeScreen = async () => {
        setLoading(true);
        try {
            await loadNotifications();
            await checkFCMToken();
        } catch (error) {
            console.log('Initialize screen error:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkFCMToken = async () => {
        try {
            setTokenStatus('checking');

            // Try to get stored token first
            let token = await NotificationService.getStoredFCMToken();

            if (!token) {
                // If no stored token, initialize FCM
                const result = await NotificationService.initializeFCM();
                if (result.success) {
                    token = result.token;
                    setTokenStatus('active');
                } else {
                    setTokenStatus('error');
                    console.log('FCM initialization failed:', result.error);
                    return;
                }
            } else {
                setTokenStatus('active');
            }

            setFcmToken(token);

            // Refresh token and send to server
            const refreshResult = await NotificationService.refreshAndSendToken();
            if (refreshResult.success) {
                console.log('FCM token refreshed and sent to server');
                setTokenStatus('synced');
            } else {
                console.log('Failed to send token to server:', refreshResult.error);
                setTokenStatus('sync-error');
            }

        } catch (error) {
            console.log('Check FCM token error:', error);
            setTokenStatus('error');
        }
    };

    const loadNotifications = async () => {
        try {
            const storedNotifications = await NotificationService.getStoredNotifications();
            setNotifications(storedNotifications);

            const count = await NotificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.log('Load notifications error:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadNotifications();
            await checkFCMToken();
        } catch (error) {
            console.log('Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const markAsRead = async (notificationId) => {
        try {
            await NotificationService.markNotificationAsRead(notificationId);
            await loadNotifications();
        } catch (error) {
            console.log('Mark as read error:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await NotificationService.deleteNotification(notificationId);
                            await loadNotifications();
                        } catch (error) {
                            console.log('Delete notification error:', error);
                        }
                    }
                }
            ]
        );
    };

    const clearAllNotifications = async () => {
        Alert.alert(
            'Clear All Notifications',
            'Are you sure you want to clear all notifications?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await NotificationService.clearAllNotifications();
                            await loadNotifications();
                        } catch (error) {
                            console.log('Clear all notifications error:', error);
                        }
                    }
                }
            ]
        );
    };

    const retryFCMSetup = async () => {
        setTokenStatus('checking');
        await checkFCMToken();
    };

    const getFilteredNotifications = () => {
        switch (selectedFilter) {
            case 'unread':
                return notifications.filter(n => !n.isRead);
            case 'read':
                return notifications.filter(n => n.isRead);
            default:
                return notifications;
        }
    };

    const getStatusIcon = () => {
        switch (tokenStatus) {
            case 'active':
            case 'synced':
                return 'check-circle';
            case 'checking':
                return 'hourglass-empty';
            case 'error':
            case 'sync-error':
                return 'error';
            default:
                return 'help';
        }
    };

    const getStatusColor = () => {
        switch (tokenStatus) {
            case 'active':
            case 'synced':
                return colors.success;
            case 'checking':
                return colors.warning;
            case 'error':
            case 'sync-error':
                return colors.error;
            default:
                return colors.textSecondary;
        }
    };

    const getStatusText = () => {
        switch (tokenStatus) {
            case 'checking':
                return 'Setting up notifications...';
            case 'active':
                return 'Notifications active';
            case 'synced':
                return 'Notifications synced';
            case 'error':
                return 'Setup failed';
            case 'sync-error':
                return 'Sync failed';
            default:
                return 'Unknown status';
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const NotificationCard = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                !item.isRead && styles.unreadCard
            ]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
                    <MaterialIcons name={item.iconName} size={20} color={item.iconColor} />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {formatTime(item.timestamp)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(item.id)}
                >
                    <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {item.actionable && (
                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>{item.actionText || 'View Details'}</Text>
                        <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const FilterButton = ({ filter, label, count }) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                selectedFilter === filter && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter(filter)}
        >
            <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilterText
            ]}>
                {label}
            </Text>
            {count > 0 && (
                <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const filteredNotifications = getFilteredNotifications();

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialIcons name="arrow-back" size={24} color={colors.white} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Notifications</Text>
                            {unreadCount > 0 && (
                                <View style={styles.headerBadge}>
                                    <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        {notifications.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearAllNotifications}
                            >
                                <MaterialIcons name="clear-all" size={24} color={colors.white} />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>
            </View>

            {/* FCM Status Card */}
            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <Animated.View style={[
                        styles.statusIconContainer,
                        {
                            opacity: tokenStatus === 'checking' ? animatedValue : 1,
                        }
                    ]}>
                        <MaterialIcons
                            name={getStatusIcon()}
                            size={20}
                            color={getStatusColor()}
                        />
                    </Animated.View>
                    <Text style={styles.statusText}>{getStatusText()}</Text>
                    {(tokenStatus === 'error' || tokenStatus === 'sync-error') && (
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={retryFCMSetup}
                        >
                            <MaterialIcons name="refresh" size={16} color={colors.primary} />
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {fcmToken && (
                    <View style={styles.tokenInfo}>
                        <Text style={styles.tokenLabel}>FCM Token:</Text>
                        <Text style={styles.tokenText} numberOfLines={1}>
                            {fcmToken.substring(0, 20)}...{fcmToken.substring(fcmToken.length - 20)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Filter Buttons */}
            {notifications.length > 0 && (
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <FilterButton
                            filter="all"
                            label="All"
                            count={notifications.length}
                        />
                        <FilterButton
                            filter="unread"
                            label="Unread"
                            count={unreadCount}
                        />
                        <FilterButton
                            filter="read"
                            label="Read"
                            count={notifications.length - unreadCount}
                        />
                    </ScrollView>
                </View>
            )}

            {/* Notifications List */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {filteredNotifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons
                            name={selectedFilter === 'unread' ? 'mark-email-read' : 'notifications-none'}
                            size={64}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.emptyTitle}>
                            {selectedFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {selectedFilter === 'unread'
                                ? 'You have no unread notifications'
                                : 'When you receive notifications, they will appear here'
                            }
                        </Text>
                    </View>
                ) : (
                    <View style={styles.notificationsList}>
                        {filteredNotifications.map((notification) => (
                            <NotificationCard key={notification.id} item={notification} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: verticalScale(12),
        fontSize: moderateScale(16),
        color: colors.textSecondary,
        fontFamily: 'Poppins-Regular',
    },
    header: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerGradient: {
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(16),
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
    },
    backButton: {
        padding: moderateScale(8),
        marginRight: horizontalScale(8),
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: moderateScale(20),
        fontWeight: '600',
        color: colors.white,
        fontFamily: 'Poppins-SemiBold',
    },
    headerBadge: {
        backgroundColor: colors.white,
        borderRadius: moderateScale(10),
        minWidth: horizontalScale(20),
        height: verticalScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: horizontalScale(8),
    },
    headerBadgeText: {
        fontSize: moderateScale(12),
        fontWeight: '600',
        color: colors.primary,
        fontFamily: 'Poppins-SemiBold',
    },
    clearButton: {
        padding: moderateScale(8),
    },
    statusCard: {
        backgroundColor: colors.white,
        marginHorizontal: horizontalScale(16),
        marginTop: verticalScale(16),
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIconContainer: {
        marginRight: horizontalScale(8),
    },
    statusText: {
        flex: 1,
        fontSize: moderateScale(14),
        color: colors.text,
        fontFamily: 'Poppins-Medium',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
    },
    retryText: {
        fontSize: moderateScale(12),
        color: colors.primary,
        marginLeft: horizontalScale(4),
        fontFamily: 'Poppins-Medium',
    },
    tokenInfo: {
        marginTop: verticalScale(8),
        paddingTop: verticalScale(8),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    tokenLabel: {
        fontSize: moderateScale(12),
        color: colors.textSecondary,
        fontFamily: 'Poppins-Regular',
    },
    tokenText: {
        fontSize: moderateScale(10),
        color: colors.text,
        fontFamily: 'Poppins-Regular',
        backgroundColor: colors.background,
        padding: moderateScale(8),
        borderRadius: moderateScale(4),
        marginTop: verticalScale(4),
    },
    filtersContainer: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: moderateScale(20),
        backgroundColor: colors.white,
        marginRight: horizontalScale(8),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    activeFilterButton: {
        backgroundColor: colors.primary,
        elevation: 2,
    },
    filterText: {
        fontSize: moderateScale(14),
        color: colors.textSecondary,
        fontFamily: 'Poppins-Medium',
    },
    activeFilterText: {
        color: colors.white,
    },
    filterBadge: {
        backgroundColor: colors.error,
        borderRadius: moderateScale(8),
        minWidth: horizontalScale(16),
        height: verticalScale(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: horizontalScale(6),
    },
    filterBadgeText: {
        fontSize: moderateScale(10),
        color: colors.white,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
    scrollView: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(60),
        paddingHorizontal: horizontalScale(32),
    },
    emptyTitle: {
        fontSize: moderateScale(18),
        fontWeight: '600',
        color: colors.text,
        marginTop: verticalScale(16),
        textAlign: 'center',
        fontFamily: 'Poppins-SemiBold',
    },
    emptySubtitle: {
        fontSize: moderateScale(14),
        color: colors.textSecondary,
        marginTop: verticalScale(8),
        textAlign: 'center',
        lineHeight: moderateScale(20),
        fontFamily: 'Poppins-Regular',
    },
    notificationsList: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(20),
    },
    notificationCard: {
        backgroundColor: colors.white,
        borderRadius: moderateScale(12),
        marginBottom: verticalScale(12),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    unreadCard: {
        backgroundColor: colors.unread,
        borderLeftWidth: 4,
        borderLeftColor: colors.unreadBorder,
    },
    cardHeader: {
        flexDirection: 'row',
        padding: moderateScale(16),
    },
    iconContainer: {
        width: horizontalScale(40),
        height: verticalScale(40),
        borderRadius: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: horizontalScale(12),
    },
    cardContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(4),
    },
    notificationTitle: {
        flex: 1,
        fontSize: moderateScale(14),
        fontWeight: '600',
        color: colors.text,
        fontFamily: 'Poppins-SemiBold',
    },
    unreadTitle: {
        color: colors.text,
        fontWeight: '700',
    },
    unreadDot: {
        width: horizontalScale(8),
        height: verticalScale(8),
        borderRadius: moderateScale(4),
        backgroundColor: colors.primary,
        marginLeft: horizontalScale(8),
    },
    notificationMessage: {
        fontSize: moderateScale(12),
        color: colors.textSecondary,
        lineHeight: moderateScale(18),
        marginBottom: verticalScale(4),
        fontFamily: 'Poppins-Regular',
    },
    notificationTime: {
        fontSize: moderateScale(11),
        color: colors.textSecondary,
        fontFamily: 'Poppins-Regular',
    },
    deleteButton: {
        padding: moderateScale(4),
        marginLeft: horizontalScale(8),
    },
    actionSection: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(12),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: verticalScale(8),
    },
    actionText: {
        fontSize: moderateScale(12),
        color: colors.primary,
        fontWeight: '500',
        fontFamily: 'Poppins-Medium',
    },
});

export default NotificationScreen;