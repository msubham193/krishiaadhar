import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { blue } from '../utils/Colors';

const colors = {
    primary: blue,
    white: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
};

const ActivityCard = ({ activity, onEdit, onDelete, showActions = false }) => {
    const formatTime = (time) => {
        return time || 'Not set';
    };

    const getActivityIcon = (activityName) => {
        const name = activityName?.toLowerCase() || '';

        if (name.includes('water') || name.includes('irrigation')) {
            return 'water-drop';
        } else if (name.includes('fertiliz') || name.includes('manure')) {
            return 'eco';
        } else if (name.includes('plant') || name.includes('seed')) {
            return 'nature';
        } else if (name.includes('harvest')) {
            return 'agriculture';
        } else if (name.includes('spray') || name.includes('pesticide')) {
            return 'spray';
        } else {
            return 'event-note';
        }
    };

    const getActivityColor = (activityName) => {
        const name = activityName?.toLowerCase() || '';

        if (name.includes('water') || name.includes('irrigation')) {
            return colors.primary;
        } else if (name.includes('fertiliz') || name.includes('manure')) {
            return colors.success;
        } else if (name.includes('plant') || name.includes('seed')) {
            return colors.success;
        } else if (name.includes('harvest')) {
            return colors.warning;
        } else if (name.includes('spray') || name.includes('pesticide')) {
            return '#EF4444';
        } else {
            return colors.textSecondary;
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                {/* Activity Icon and Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons
                            name={getActivityIcon(activity.activityName)}
                            size={24}
                            color={getActivityColor(activity.activityName)}
                        />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.activityName} numberOfLines={1}>
                            {activity.activityName}
                        </Text>
                        <View style={styles.timeContainer}>
                            <MaterialIcons name="access-time" size={14} color={colors.textSecondary} />
                            <Text style={styles.timeText}>
                                {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                            </Text>
                        </View>
                    </View>
                    {showActions && (
                        <View style={styles.actionsContainer}>
                            {onEdit && (
                                <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(activity)}>
                                    <MaterialIcons name="edit" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                            {onDelete && (
                                <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(activity)}>
                                    <MaterialIcons name="delete" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Description */}
                {activity.description && (
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{activity.description}</Text>
                    </View>
                )}

                {/* Status or Progress Bar (if needed) */}
                {activity.status && (
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: getActivityColor(activity.activityName) }]} />
                        <Text style={styles.statusText}>{activity.status}</Text>
                    </View>
                )}
            </View>

            {/* Left Border Color Indicator */}
            <View style={[styles.leftBorder, { backgroundColor: getActivityColor(activity.activityName) }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: moderateScale(8),
        marginBottom: verticalScale(8),
        elevation: 1,
        shadowColor: colors.cardShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        overflow: 'hidden',
        position: 'relative',
    },
    cardContent: {
        padding: moderateScale(12),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: verticalScale(8),
    },
    iconContainer: {
        width: horizontalScale(40),
        height: verticalScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: `${colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: horizontalScale(12),
    },
    headerText: {
        flex: 1,
    },
    activityName: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        color: colors.text,
        fontFamily: 'Poppins-SemiBold',
        marginBottom: verticalScale(4),
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: moderateScale(12),
        color: colors.textSecondary,
        marginLeft: horizontalScale(4),
        fontFamily: 'Poppins-Regular',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: moderateScale(8),
        borderRadius: moderateScale(4),
        marginLeft: horizontalScale(4),
    },
    descriptionContainer: {
        marginTop: verticalScale(4),
        paddingLeft: horizontalScale(52), // Align with header text
    },
    description: {
        fontSize: moderateScale(12),
        color: colors.textSecondary,
        lineHeight: moderateScale(16),
        fontFamily: 'Poppins-Regular',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: verticalScale(8),
        paddingLeft: horizontalScale(52),
    },
    statusDot: {
        width: horizontalScale(6),
        height: verticalScale(6),
        borderRadius: moderateScale(3),
        marginRight: horizontalScale(6),
    },
    statusText: {
        fontSize: moderateScale(11),
        color: colors.textSecondary,
        fontFamily: 'Poppins-Regular',
        textTransform: 'capitalize',
    },
    leftBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: horizontalScale(3),
    },
});

export default ActivityCard;