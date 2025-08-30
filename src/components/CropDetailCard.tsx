import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { blue } from '../utils/Colors';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';
import { useNavigation } from '@react-navigation/native';

const colors = {
  primary: blue,
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

const CropDetailCard = ({ crop, onAddActivity, showActivityButton = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const userData = useUserStore(state => state.userData);
  const navigation = useNavigation();

  const fetchActivities = async () => {
    if (!expanded || !crop?.id) return;

    setLoadingActivities(true);
    const cleanedToken = userData.token.replace(/"/g, '');

    try {
      // Since activities are already included in the crop data, we can use them directly
      if (crop.FarmerCropCalendarActivity) {
        setActivities(crop.FarmerCropCalendarActivity);
        setLoadingActivities(false);
        return;
      }

      // Fallback: fetch activities if not included in crop data
      const response = await fetch(
        `${BASE_URL}/farmer/cropcalendar/all`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': cleanedToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const currentCrop = data?.response?.find(item => item.id === crop.id);
        setActivities(currentCrop?.FarmerCropCalendarActivity || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      // If activities are already in the crop data, use them directly
      if (crop?.FarmerCropCalendarActivity) {
        setActivities(crop.FarmerCropCalendarActivity);
      } else {
        fetchActivities();
      }
    }
  }, [expanded, crop]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getSeasonColor = (season) => {
    switch (season?.toLowerCase()) {
      case 'kharif':
        return colors.success;
      case 'rabi':
        return colors.warning;
      case 'zaid':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const handleViewCalendar = () => {
    navigation.navigate('CropCalendarView', { cropCalendar: crop });
  };

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityName}>{item.activityName}</Text>
        <Text style={styles.activityTime}>
          {item.startTime} - {item.endTime}
        </Text>
      </View>
      <Text style={styles.activityDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      {/* Main Card Content */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {crop.projectName}
            </Text>
            <View style={[styles.seasonBadge, { backgroundColor: getSeasonColor(crop.season) }]}>
              <Text style={styles.seasonText}>{crop.season}</Text>
            </View>
          </View>

          <Text style={styles.cropName}>{crop.cropName}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="category" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{crop.cropType}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="landscape" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{crop.fieldSize} acres</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.locationText}>{crop.location}</Text>
            </View>
            <Text style={styles.startDate}>
              Started: {formatDate(crop.startDate)}
            </Text>
          </View>
        </View>

        <View style={styles.expandIcon}>
          <MaterialIcons
            name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={24}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Additional Details */}
          <View style={styles.additionalDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seed Variety:</Text>
              <Text style={styles.detailValue}>{crop.seedVariety}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Crop Variety:</Text>
              <Text style={styles.detailValue}>{crop.cropVariety}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{crop.projectDescription}</Text>
            </View>
          </View>

          {/* Activities Section */}
          <View style={styles.activitiesSection}>
            <View style={styles.activitiesHeader}>
              <Text style={styles.activitiesTitle}>Activities</Text>
              <View style={styles.activityButtons}>
                <TouchableOpacity
                  style={styles.viewCalendarButton}
                  onPress={handleViewCalendar}
                >
                  <MaterialIcons name="calendar-view-month" size={16} color={colors.white} />
                  <Text style={styles.viewCalendarText}>View Calendar</Text>
                </TouchableOpacity>
                {showActivityButton && (
                  <TouchableOpacity
                    style={styles.addActivityButton}
                    onPress={() => onAddActivity && onAddActivity()}
                  >
                    <MaterialIcons name="add" size={16} color={colors.white} />
                    <Text style={styles.addActivityText}>Add Activity</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {loadingActivities ? (
              <View style={styles.loadingActivities}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading activities...</Text>
              </View>
            ) : activities.length > 0 ? (
              <FlatList
                data={activities}
                renderItem={renderActivityItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                showsVerticalScrollIndicator={false}
                style={styles.activitiesList}
              />
            ) : (
              <View style={styles.noActivities}>
                <MaterialIcons name="event-note" size={40} color={colors.textSecondary} />
                <Text style={styles.noActivitiesText}>No activities added yet</Text>
                {showActivityButton && (
                  <Text style={styles.noActivitiesSubtext}>
                    Tap "Add Activity" to get started
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginVertical: verticalScale(4),
    marginHorizontal: horizontalScale(2),
  },
  cardHeader: {
    flexDirection: 'row',
    padding: moderateScale(16),
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  projectTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
    marginRight: horizontalScale(8),
  },
  seasonBadge: {
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  seasonText: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    color: colors.white,
    fontFamily: 'Poppins-Medium',
  },
  cropName: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.primary,
    marginBottom: verticalScale(8),
    fontFamily: 'Poppins-Medium',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(8),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: horizontalScale(16),
  },
  detailText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginLeft: horizontalScale(4),
    fontFamily: 'Poppins-Regular',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginLeft: horizontalScale(4),
    fontFamily: 'Poppins-Regular',
  },
  startDate: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
  },
  expandIcon: {
    marginLeft: horizontalScale(8),
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  additionalDetails: {
    padding: moderateScale(16),
    backgroundColor: colors.background,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(8),
  },
  detailLabel: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: colors.text,
    width: horizontalScale(100),
    fontFamily: 'Poppins-Medium',
  },
  detailValue: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  activitiesSection: {
    padding: moderateScale(16),
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    flexWrap: 'wrap',
  },
  activitiesTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: verticalScale(8),
  },
  activityButtons: {
    flexDirection: 'row',
    gap: horizontalScale(8),
  },
  viewCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  viewCalendarText: {
    fontSize: moderateScale(11),
    color: colors.white,
    marginLeft: horizontalScale(4),
    fontFamily: 'Poppins-Medium',
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  addActivityText: {
    fontSize: moderateScale(11),
    color: colors.white,
    marginLeft: horizontalScale(4),
    fontFamily: 'Poppins-Medium',
  },
  loadingActivities: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
  },
  loadingText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-Regular',
  },
  activitiesList: {
    maxHeight: verticalScale(200),
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(8),
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  activityName: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    fontFamily: 'Poppins-Medium',
  },
  activityTime: {
    fontSize: moderateScale(11),
    color: colors.primary,
    fontFamily: 'Poppins-Regular',
  },
  activityDescription: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    lineHeight: moderateScale(16),
    fontFamily: 'Poppins-Regular',
  },
  noActivities: {
    alignItems: 'center',
    paddingVertical: verticalScale(24),
  },
  noActivitiesText: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    marginTop: verticalScale(8),
    fontFamily: 'Poppins-Regular',
  },
  noActivitiesSubtext: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginTop: verticalScale(4),
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
});

export default CropDetailCard;