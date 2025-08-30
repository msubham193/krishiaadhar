import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { blue, lightBlue } from '../utils/Colors';
import CropDetailCard from '../components/CropDetailCard';
import AddActivityModal from '../components/AddActivityModal';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';

const colors = {
  primary: blue,
  secondary: lightBlue,
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

const YourCropCalenderScreen = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState('created');
  const [ccrData, setCcrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addActivityModalVisible, setAddActivityModalVisible] = useState(false);
  const [selectedCropCalendar, setSelectedCropCalendar] = useState(null);
  const userData = useUserStore(state => state.userData);

  useEffect(() => {
    // Initial load when component mounts
    fetchCCR();
  }, []);

  // Auto-refresh whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('YourCropCalenderScreen focused - refreshing data...');
      fetchCCR();
    }, [])
  );

  const fetchCCR = async () => {
    setLoading(true);
    const cleanedToken = userData.token.replace(/"/g, '');

    try {
      console.log('Fetching crop calendars...');
      const response = await fetch(`${BASE_URL}/farmer/cropcalendar/all`, {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setCcrData(data?.response || []);
      console.log('Crop Calendar Data refreshed:', data?.response?.length || 0, 'items');
    } catch (error) {
      console.error('Error fetching crop calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCCR();
    setRefreshing(false);
  };

  const handleAddActivity = (cropCalendar) => {
    setSelectedCropCalendar(cropCalendar);
    setAddActivityModalVisible(true);
  };

  const handleActivityAdded = () => {
    // Refresh the data after adding activity to get updated FarmerCropCalendarActivity
    fetchCCR();
    setAddActivityModalVisible(false);
    setSelectedCropCalendar(null);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="agriculture" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {selectedOption === 'created' ? 'No Crop Calendars' : 'No Requests'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedOption === 'created'
          ? 'Start by creating your first crop calendar'
          : 'No requested calendars available'
        }
      </Text>
      {selectedOption === 'created' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('createCropCalendar')}
        >
          <MaterialIcons name="add" size={20} color={colors.white} />
          <Text style={styles.createButtonText}>Create Calendar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCropCard = ({ item, index }) => (
    <View style={styles.cardContainer}>
      <CropDetailCard
        crop={item}
        onAddActivity={() => handleAddActivity(item)}
        showActivityButton={selectedOption === 'created'}
      />
    </View>
  );

  const renderTabButton = (option, label) => (
    <TouchableOpacity
      onPress={() => setSelectedOption(option)}
      style={[
        styles.tabButton,
        selectedOption === option ? styles.activeTab : styles.inactiveTab,
      ]}
    >
      <Text style={[
        styles.tabText,
        selectedOption === option ? styles.activeTabText : styles.inactiveTabText,
      ]}>
        {label}
      </Text>
      {selectedOption === option && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Crop Calendar</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('createCropCalendar')}
          style={styles.addButton}
        >
          <MaterialIcons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('created', 'Created')}
        {renderTabButton('Requested', 'Requested')}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading crop calendars...</Text>
          </View>
        ) : ccrData.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={selectedOption === 'created' ? ccrData : []}
            renderItem={renderCropCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      {/* Add Activity Modal */}
      <AddActivityModal
        visible={addActivityModalVisible}
        onClose={() => {
          setAddActivityModalVisible(false);
          setSelectedCropCalendar(null);
        }}
        cropCalendar={selectedCropCalendar}
        onActivityAdded={handleActivityAdded}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginRight: horizontalScale(8),
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  addButton: {
    padding: moderateScale(8),
    marginLeft: horizontalScale(8),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: horizontalScale(16),
    marginTop: verticalScale(16),
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(8),
    position: 'relative',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  activeTabText: {
    color: colors.white,
  },
  inactiveTabText: {
    color: colors.textSecondary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: verticalScale(2),
    backgroundColor: colors.white,
    borderRadius: moderateScale(1),
  },
  content: {
    flex: 1,
    marginTop: verticalScale(16),
  },
  listContainer: {
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(20),
  },
  cardContainer: {
    marginBottom: verticalScale(12),
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(32),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.text,
    marginTop: verticalScale(16),
    fontFamily: 'Poppins-SemiBold',
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(8),
    lineHeight: moderateScale(20),
    fontFamily: 'Poppins-Regular',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: horizontalScale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    marginTop: verticalScale(24),
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-Medium',
  },
});

export default YourCropCalenderScreen;