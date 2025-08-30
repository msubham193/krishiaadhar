import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { blue } from '../utils/Colors';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';
import AddActivityModal from '../components/AddActivityModal';

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
  calendarBackground: '#FFFFFF',
  selectedDay: blue,
  activityDot: '#10B981',
};

const STORAGE_KEY = 'crop_calendar_activities';

const CropCalendarScreen2 = ({ navigation, route }) => {
  const { cropCalendar } = route.params || {};
  const [selectedDate, setSelectedDate] = useState('');
  const [activitiesByDate, setActivitiesByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDateActivities, setSelectedDateActivities] = useState([]);
  const [addActivityModalVisible, setAddActivityModalVisible] = useState(false);
  const userData = useUserStore(state => state.userData);

  // Load activities from local storage
  const loadActivitiesFromStorage = async () => {
    try {
      if (!cropCalendar?.id) return {};
      
      const storageKey = `${STORAGE_KEY}_${cropCalendar.id}`;
      const storedActivities = await AsyncStorage.getItem(storageKey);
      
      if (storedActivities) {
        const activities = JSON.parse(storedActivities);
        console.log('Loaded activities from storage:', activities);
        return activities;
      }
      
      return {};
    } catch (error) {
      console.error('Error loading activities from storage:', error);
      return {};
    }
  };

  // Fetch activities from server and merge with local storage
  const fetchActivities = async () => {
    if (!cropCalendar?.id) return;
    
    setLoading(true);
    
    try {
      // Load local activities first
      const localActivities = await loadActivitiesFromStorage();
      
      // Try to fetch from server
      const cleanedToken = userData.token.replace(/"/g, '');
      const response = await fetch(`${BASE_URL}/farmer/cropcalendar/all`, {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
      });

      let serverActivities = {};
      if (response.ok) {
        const data = await response.json();
        const currentCrop = data?.response?.find(item => item.id === cropCalendar.id);
        const cropActivities = currentCrop?.FarmerCropCalendarActivity || [];
        
        // Convert server activities to date-based format
        // For demo, distribute server activities across dates
        cropActivities.forEach((activity, index) => {
          const demoDate = new Date();
          demoDate.setDate(demoDate.getDate() + index + 3); // Start from 3 days ahead
          const dateKey = demoDate.toISOString().split('T')[0];
          
          if (!serverActivities[dateKey]) {
            serverActivities[dateKey] = [];
          }
          
          serverActivities[dateKey].push({
            ...activity,
            date: dateKey,
            isLocal: false,
          });
        });
      }

      // Merge local and server activities (avoid duplicates)
      const mergedActivities = { ...serverActivities };
      
      // Add local activities (avoid duplicates by checking activity content)
      Object.keys(localActivities).forEach(date => {
        if (!mergedActivities[date]) {
          mergedActivities[date] = [];
        }
        
        // Filter out duplicates based on activity name, time, and description
        const existingActivities = mergedActivities[date];
        const newLocalActivities = localActivities[date].filter(localActivity => {
          return !existingActivities.some(existing => 
            existing.activityName === localActivity.activityName &&
            existing.startTime === localActivity.startTime &&
            existing.endTime === localActivity.endTime &&
            existing.description === localActivity.description
          );
        });
        
        mergedActivities[date] = [
          ...existingActivities,
          ...newLocalActivities,
        ];
      });

      console.log('Merged activities:', mergedActivities);
      setActivitiesByDate(mergedActivities);
      processActivitiesForCalendar(mergedActivities);
      
    } catch (error) {
      console.error('Error fetching activities:', error);
      
      // If server fails, use only local activities
      const localActivities = await loadActivitiesFromStorage();
      setActivitiesByDate(localActivities);
      processActivitiesForCalendar(localActivities);
    } finally {
      setLoading(false);
    }
  };

  // Process activities to create marked dates for calendar
  const processActivitiesForCalendar = (activitiesData) => {
    const marked = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Mark dates that have activities
    Object.keys(activitiesData).forEach(dateKey => {
      const activities = activitiesData[dateKey];
      if (activities && activities.length > 0) {
        marked[dateKey] = {
          marked: true,
          dotColor: colors.activityDot,
          activities: activities,
        };
      }
    });

    // Mark today as selected if no date is selected
    if (!selectedDate) {
      if (!marked[today]) {
        marked[today] = { activities: [] };
      }
      marked[today] = {
        ...marked[today],
        selected: true,
        selectedColor: colors.selectedDay,
      };
      setSelectedDate(today);
      setSelectedDateActivities(marked[today]?.activities || []);
    } else {
      // Update selected date
      if (!marked[selectedDate]) {
        marked[selectedDate] = { activities: [] };
      }
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.selectedDay,
      };
      setSelectedDateActivities(marked[selectedDate]?.activities || []);
    }

    setMarkedDates(marked);
    console.log('Processed marked dates:', marked);
  };

  // Handle date selection
  const onDayPress = (day) => {
    const dateKey = day.dateString;
    setSelectedDate(dateKey);
    
    // Update marked dates to show selected date
    const updatedMarked = { ...markedDates };
    
    // Remove previous selection
    Object.keys(updatedMarked).forEach(date => {
      if (updatedMarked[date]?.selected) {
        updatedMarked[date] = {
          ...updatedMarked[date],
          selected: false,
          selectedColor: undefined,
        };
      }
    });
    
    // Mark new selection
    if (!updatedMarked[dateKey]) {
      updatedMarked[dateKey] = { activities: [] };
    }
    updatedMarked[dateKey] = {
      ...updatedMarked[dateKey],
      selected: true,
      selectedColor: colors.selectedDay,
    };
    
    setMarkedDates(updatedMarked);
    const activitiesForDate = activitiesByDate[dateKey] || [];
    setSelectedDateActivities(activitiesForDate);
    
    console.log('Selected date:', dateKey);
    console.log('Activities for selected date:', activitiesForDate);
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [cropCalendar?.id])
  );

  const handleActivityAdded = () => {
    // Reload activities after adding new one
    fetchActivities();
    setAddActivityModalVisible(false);
  };

  // Clear all activities (for testing)
  const clearAllActivities = async () => {
    Alert.alert(
      'Clear Activities',
      'Are you sure you want to clear all activities for this crop calendar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const storageKey = `${STORAGE_KEY}_${cropCalendar.id}`;
              await AsyncStorage.removeItem(storageKey);
              setActivitiesByDate({});
              setSelectedDateActivities([]);
              setMarkedDates({});
              Alert.alert('Success', 'All activities cleared');
            } catch (error) {
              console.error('Error clearing activities:', error);
              Alert.alert('Error', 'Failed to clear activities');
            }
          },
        },
      ]
    );
  };

  const getActivityIcon = (activityName) => {
    const name = activityName?.toLowerCase() || '';
    if (name.includes('water') || name.includes('irrigation')) return 'water-drop';
    if (name.includes('fertiliz') || name.includes('manure')) return 'eco';
    if (name.includes('plant') || name.includes('seed')) return 'nature';
    if (name.includes('harvest')) return 'agriculture';
    if (name.includes('spray') || name.includes('pesticide')) return 'spray';
    return 'event-note';
  };

  const getActivityColor = (activityName) => {
    const name = activityName?.toLowerCase() || '';
    if (name.includes('water') || name.includes('irrigation')) return colors.primary;
    if (name.includes('fertiliz') || name.includes('manure')) return colors.success;
    if (name.includes('plant') || name.includes('seed')) return colors.success;
    if (name.includes('harvest')) return colors.warning;
    if (name.includes('spray') || name.includes('pesticide')) return colors.error;
    return colors.textSecondary;
  };

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: `${getActivityColor(item.activityName)}20` }]}>
        <MaterialIcons 
          name={getActivityIcon(item.activityName)} 
          size={20} 
          color={getActivityColor(item.activityName)} 
        />
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityName}>{item.activityName}</Text>
          {item.isLocal && (
            <View style={styles.localBadge}>
              <Text style={styles.localBadgeText}>Local</Text>
            </View>
          )}
        </View>
        <Text style={styles.activityTime}>
          {item.startTime} - {item.endTime}
        </Text>
        <Text style={styles.activityDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  const renderDayActivities = () => {
    if (selectedDateActivities.length === 0) {
      return (
        <View style={styles.noActivitiesContainer}>
          <MaterialIcons name="event-available" size={48} color={colors.textSecondary} />
          <Text style={styles.noActivitiesText}>No activities scheduled</Text>
          <Text style={styles.noActivitiesSubtext}>
            Tap the + button to add an activity for {selectedDate}
          </Text>
          <TouchableOpacity 
            style={styles.quickAddButton}
            onPress={() => setAddActivityModalVisible(true)}
          >
            <MaterialIcons name="add" size={20} color={colors.white} />
            <Text style={styles.quickAddText}>Add Activity</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={selectedDateActivities}
        renderItem={renderActivityItem}
        keyExtractor={(item, index) => `${item.id || index}_${item.date || selectedDate}_${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.activitiesList}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{cropCalendar?.projectName}</Text>
          <Text style={styles.headerSubtitle}>
            {cropCalendar?.cropName} • {cropCalendar?.season}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setAddActivityModalVisible(true)}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={clearAllActivities}
            style={[styles.addButton, { marginLeft: horizontalScale(8) }]}
          >
            <MaterialIcons name="delete-sweep" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.calendarBackground,
              calendarBackground: colors.calendarBackground,
              textSectionTitleColor: colors.textSecondary,
              dayTextColor: colors.text,
              todayTextColor: colors.primary,
              selectedDayTextColor: colors.white,
              monthTextColor: colors.text,
              indicatorColor: colors.primary,
              selectedDayBackgroundColor: colors.selectedDay,
              arrowColor: colors.primary,
              disabledArrowColor: colors.border,
              textDayFontFamily: 'Poppins-Regular',
              textMonthFontFamily: 'Poppins-SemiBold',
              textDayHeaderFontFamily: 'Poppins-Medium',
              textDayFontSize: moderateScale(14),
              textMonthFontSize: moderateScale(16),
              textDayHeaderFontSize: moderateScale(12),
            }}
            style={styles.calendar}
          />
        </View>

        {/* Selected Date Info */}
        <View style={styles.selectedDateContainer}>
          <View style={styles.selectedDateHeader}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <View style={styles.activityCount}>
              <Text style={styles.activityCountText}>
                {selectedDateActivities.length} activities
              </Text>
            </View>
          </View>
        </View>

        {/* Activities for Selected Date */}
        <View style={styles.activitiesContainer}>
          {renderDayActivities()}
        </View>

        {/* Storage Info */}
        <View style={styles.storageInfo}>
          <MaterialIcons name="storage" size={16} color={colors.textSecondary} />
          <Text style={styles.storageInfoText}>
            Activities are stored locally and synced when possible
          </Text>
        </View>
      </ScrollView>

      {/* Add Activity Modal */}
      <AddActivityModal
        visible={addActivityModalVisible}
        onClose={() => setAddActivityModalVisible(false)}
        cropCalendar={cropCalendar}
        onActivityAdded={handleActivityAdded}
        selectedDate={selectedDate}
      />
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
    marginTop: verticalScale(16),
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: verticalScale(40),
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: moderateScale(8),
    marginRight: horizontalScale(12),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.white,
    fontFamily: 'Poppins-SemiBold',
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: colors.white,
    fontFamily: 'Poppins-Regular',
    opacity: 0.9,
    marginTop: verticalScale(2),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: moderateScale(8),
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: colors.white,
    margin: horizontalScale(16),
    borderRadius: moderateScale(12),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  calendar: {
    paddingBottom: verticalScale(16),
  },
  selectedDateContainer: {
    backgroundColor: colors.white,
    marginHorizontal: horizontalScale(16),
    marginBottom: verticalScale(8),
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  activityCount: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  activityCountText: {
    fontSize: moderateScale(12),
    color: colors.primary,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  activitiesContainer: {
    backgroundColor: colors.white,
    marginHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
    borderRadius: moderateScale(12),
    minHeight: verticalScale(200),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activitiesList: {
    padding: moderateScale(16),
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  activityIcon: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(2),
  },
  activityName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  localBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: horizontalScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  localBadgeText: {
    fontSize: moderateScale(10),
    color: colors.white,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  activityTime: {
    fontSize: moderateScale(12),
    color: colors.primary,
    fontFamily: 'Poppins-Medium',
    marginBottom: verticalScale(4),
  },
  activityDescription: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    lineHeight: moderateScale(16),
  },
  noActivitiesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(32),
    minHeight: verticalScale(200),
  },
  noActivitiesText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: colors.text,
    marginTop: verticalScale(12),
    fontFamily: 'Poppins-Medium',
  },
  noActivitiesSubtext: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(8),
    lineHeight: moderateScale(16),
    fontFamily: 'Poppins-Regular',
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
    marginTop: verticalScale(16),
  },
  quickAddText: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-Medium',
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(16),
  },
  storageInfoText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-Regular',
  },
});

export default CropCalendarScreen2;