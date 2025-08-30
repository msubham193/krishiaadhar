// screens/HomeScreen.js (Updated with FCM integration)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import { blue } from '../utils/Colors';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SearchBox from '../components/SearchBox';


import { AnimatedButton } from '@duarn/animated-button';
import { BorderEffectButton, NeonBorderButton } from '@duarn/border-effect-button';
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
};

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

interface ServiceCardProps {
  title: string;
  subtitle: string;
  imageUrl: any;
  onPress?: () => void;
  iconName?: string;
  color?: string;
}

// Contact Support Modal Component
const ContactSupportModal = ({ visible, onClose }) => {
  const supportNumber = '+917978029866';

  const handleCall = () => {
    Linking.openURL(`tel:${supportNumber}`);
    onClose();
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${supportNumber}&text=Hello, I need support with KrishiAadhar`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.supportModal}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.modalHeader}
          >
            <MaterialIcons name="support-agent" size={32} color={colors.white} />
            <Text style={styles.modalTitle}>Contact Support</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalContent}>
            <Text style={styles.supportText}>
              Need help? Our support team is here to assist you 24/7
            </Text>

            <View style={styles.contactInfo}>
              <MaterialIcons name="phone" size={20} color={colors.primary} />
              <Text style={styles.phoneNumber}>{supportNumber}</Text>
            </View>

            <View style={styles.supportOptions}>
              <TouchableOpacity style={styles.supportOption} onPress={handleCall}>
                <View style={[styles.optionIcon, { backgroundColor: colors.success }]}>
                  <MaterialIcons name="call" size={24} color={colors.white} />
                </View>
                <Text style={styles.optionTitle}>Call Now</Text>
                <Text style={styles.optionSubtitle}>Direct phone support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.supportOption} onPress={handleWhatsApp}>
                <View style={[styles.optionIcon, { backgroundColor: '#25D366' }]}>
                  <MaterialIcons name="chat" size={24} color={colors.white} />
                </View>
                <Text style={styles.optionTitle}>WhatsApp</Text>
                <Text style={styles.optionSubtitle}>Chat with support</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.supportHours}>
              <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
              <Text style={styles.hoursText}>Available 24/7 for your assistance</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Knowledge Base Modal Component
const KnowledgeBaseModal = ({ visible, onClose }) => {
  const knowledgeItems = [
    {
      title: 'Getting Started',
      subtitle: 'Learn the basics of KrishiAadhar',
      icon: 'play-circle-outline',
      color: colors.primary,
    },
    {
      title: 'Crop Management',
      subtitle: 'Best practices for crop planning',
      icon: 'agriculture',
      color: colors.success,
    },
    {
      title: 'Smart Irrigation',
      subtitle: 'Setup and optimize your irrigation',
      icon: 'water-drop',
      color: colors.primary,
    },
    {
      title: 'Troubleshooting',
      subtitle: 'Common issues and solutions',
      icon: 'build',
      color: colors.warning,
    },
    {
      title: 'Video Tutorials',
      subtitle: 'Step-by-step video guides',
      icon: 'play-arrow',
      color: colors.error,
    },
    {
      title: 'FAQ',
      subtitle: 'Frequently asked questions',
      icon: 'help-outline',
      color: '#8B5CF6',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.knowledgeModal}>
          <LinearGradient
            colors={[colors.success, '#34D399']}
            style={styles.modalHeader}
          >
            <MaterialIcons name="library-books" size={32} color={colors.white} />
            <Text style={styles.modalTitle}>Knowledge Base</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.knowledgeContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.knowledgeIntro}>
              Explore our comprehensive guides and tutorials to get the most out of KrishiAadhar
            </Text>

            <View style={styles.knowledgeGrid}>
              {knowledgeItems.map((item, index) => (
                <TouchableOpacity key={index} style={styles.knowledgeItem}>
                  <View style={[styles.knowledgeIcon, { backgroundColor: `${item.color}20` }]}>
                    <MaterialIcons name={item.icon} size={24} color={item.color} />
                  </View>
                  <View style={styles.knowledgeText}>
                    <Text style={styles.knowledgeTitle}>{item.title}</Text>
                    <Text style={styles.knowledgeSubtitle}>{item.subtitle}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.searchSection}>
              <Text style={styles.searchTitle}>Can't find what you're looking for?</Text>
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search knowledge base..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Feedback Modal Component
const FeedbackModal = ({ visible, onClose }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['Bug Report', 'Feature Request', 'General Feedback', 'Suggestion'];

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    Alert.alert(
      'Thank You!',
      'Your feedback has been submitted successfully. We appreciate your input!',
      [{
        text: 'OK', onPress: () => {
          setRating(0);
          setFeedback('');
          setSelectedCategory('');
          onClose();
        }
      }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.feedbackModal}>
          <LinearGradient
            colors={[colors.warning, '#FBBF24']}
            style={styles.modalHeader}
          >
            <MaterialIcons name="feedback" size={32} color={colors.white} />
            <Text style={styles.modalTitle}>Send Feedback</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.feedbackContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.feedbackIntro}>
              Help us improve KrishiAadhar by sharing your thoughts and suggestions
            </Text>

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>How would you rate your experience?</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <MaterialIcons
                      name={rating >= star ? 'star' : 'star-border'}
                      size={32}
                      color={rating >= star ? '#FFA726' : colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.categorySection}>
              <Text style={styles.sectionTitle}>Feedback Category</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category && styles.selectedChip
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category && styles.selectedChipText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Feedback Text */}
            <View style={styles.textSection}>
              <Text style={styles.sectionTitle}>Your Feedback</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Tell us about your experience, suggestions, or issues..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                value={feedback}
                onChangeText={setFeedback}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <MaterialIcons name="send" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced Service Card Component
const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  subtitle,
  imageUrl,
  onPress,
  iconName = 'agriculture',
  color = colors.primary,
}) => {
  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardImageContainer}>
        <Image source={imageUrl} style={styles.cardImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.cardOverlay}
        />
        <View style={[styles.cardIcon, { backgroundColor: color }]}>
          <MaterialIcons name={iconName} size={20} color={colors.white} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        <View style={styles.cardAction}>
          <Text style={[styles.actionText, { color }]}>Learn More</Text>
          <MaterialIcons name="arrow-forward" size={16} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Stats Card Component
const StatsCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({
  title,
  value,
  icon,
  color,
}) => (
  <View style={styles.statsCard}>
    <View style={[styles.statsIcon, { backgroundColor: `${color}20` }]}>
      <MaterialIcons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statsContent}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  </View>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [greeting, setGreeting] = useState({ text: '', icon: '', color: '' });
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({
        text: 'Good Morning',
        icon: 'wb-sunny',
        color: '#FFA726'
      });
    } else if (hour >= 12 && hour < 17) {
      setGreeting({
        text: 'Good Afternoon',
        icon: 'wb-sunny',
        color: '#FF9800'
      });
    } else if (hour >= 17 && hour < 20) {
      setGreeting({
        text: 'Good Evening',
        icon: 'wb-twilight',
        color: '#FF7043'
      });
    } else {
      setGreeting({
        text: 'Good Night',
        icon: 'brightness-3',
        color: '#9C27B0'
      });
    }

    // Initialize FCM and load notification count
    initializeFCMAndNotifications();

    // Set up app state listener to refresh notifications when app becomes active
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        loadNotificationCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializeFCMAndNotifications = async () => {
    try {
      // Initialize FCM
      const fcmResult = await NotificationService.initializeFCM();
      if (fcmResult.success) {
        console.log('FCM initialized successfully on home screen');
      } else {
        console.log('FCM initialization failed:', fcmResult.error);
      }

      // Load initial notification count
      await loadNotificationCount();
    } catch (error) {
      console.log('Initialize FCM and notifications error:', error);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadNotificationCount(count);
    } catch (error) {
      console.log('Load notification count error:', error);
    }
  };

  const services = [
    {
      title: 'Smart Irrigation Setup',
      subtitle: 'Automated, efficient irrigation system for optimal water usage',
      imageUrl: require('../assets/images/smartirigation.webp'),
      screen: 'smartirrigation',
      icon: 'water-drop',
      color: colors.primary,
    },
    {
      title: 'Digital Soil Health Map',
      subtitle: 'Analyze and map soil health with precision technology',
      imageUrl: require('../assets/images/digitalsoil.webp'),
      screen: 'soilhealthmap',
      icon: 'terrain',
      color: '#8B5CF6',
    },
    {
      title: 'Crop Health Monitor',
      subtitle: 'Real-time crop monitoring and health assessment',
      imageUrl: require('../assets/images/crophelth.webp'),
      screen: 'crophealthmonitor',
      icon: 'local-florist',
      color: colors.success,
    },
    {
      title: 'Drone Spraying',
      subtitle: 'Efficient aerial spraying for large-scale farms',
      imageUrl: require('../assets/images/dronespraying.webp'),
      screen: 'dronesparying',
      icon: 'flight',
      color: '#F59E0B',
    },
    {
      title: 'Crop Calendar',
      subtitle: 'Manage your crops efficiently with smart planning',
      imageUrl: require('../assets/images/cropcalender.webp'),
      screen: 'createCropCalendar',
      icon: 'calendar-today',
      color: '#9b9d00ff',
    },
    {
      title: 'Crop Tracker',
      subtitle: 'Manage your crops efficiently with smart planning',
      imageUrl: require('../assets/images/cropcalender.webp'),
      screen: 'yourcropcalendar',
      icon: 'calendar-today',
      color: '#EF4444',
    },
    {
      title: 'Expert Visit',
      subtitle: 'Schedule an expert visit for personalized guidance',
      imageUrl: require('../assets/images/expertvisit.webp'),
      screen: 'expertvisit',
      icon: 'person',
      color: '#06B6D4',
    },
  ];

  const stats = [
    { title: 'Active Farms', value: '1,250+', icon: 'agriculture', color: colors.success },
    { title: 'Crop Yield', value: '95%', icon: 'trending-up', color: colors.warning },
    { title: 'Water Saved', value: '40%', icon: 'water-drop', color: colors.primary },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section with Search and Notification */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.searchContainer}>
              <SearchBox />
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('notification')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="notifications" size={24} color={colors.text} />
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Banner */}
        <View style={styles.welcomeSection}>
          <ImageBackground
            source={require('../assets/images/bg.jpg')}
            style={styles.bannerBackground}
            imageStyle={styles.bannerImage}
          >
            <LinearGradient
              colors={[colors.gradient1, colors.gradient2]}
              style={styles.bannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.bannerContent}>
                <View style={styles.greetingContainer}>
                  <MaterialIcons
                    name={greeting.icon}
                    size={20}
                    color={greeting.color}
                    style={styles.greetingIcon}
                  />
                  <Text style={styles.greetingText}>{greeting.text}!</Text>
                </View>
                <Text style={styles.bannerTitle}>Welcome to KrishiAadhar</Text>
                <Text style={styles.bannerSubtitle}>
                  Transform your farming with smart technology and expert guidance
                </Text>

                <TouchableOpacity style={styles.exploreButton}>
                  <Text style={styles.exploreButtonText}>Explore Services</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Farm Statistics</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </ScrollView>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Services</Text>
          </View>

          <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                title={service.title}
                subtitle={service.subtitle}
                imageUrl={service.imageUrl}
                iconName={service.icon}
                color={service.color}
                onPress={() => navigation.navigate(service.screen)}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setSupportModalVisible(true)}
            >
              <MaterialIcons name="support-agent" size={32} color={colors.primary} />
              <Text style={styles.quickActionText}>Contact Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setKnowledgeModalVisible(true)}
            >
              <MaterialIcons name="article" size={32} color={colors.success} />
              <Text style={styles.quickActionText}>Knowledge Base</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setFeedbackModalVisible(true)}
            >
              <MaterialIcons name="feedback" size={32} color={colors.warning} />
              <Text style={styles.quickActionText}>Send Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: verticalScale(20) }} />
      </ScrollView>

      {/* Modals */}
      <ContactSupportModal
        visible={supportModalVisible}
        onClose={() => setSupportModalVisible(false)}
      />
      <KnowledgeBaseModal
        visible={knowledgeModalVisible}
        onClose={() => setKnowledgeModalVisible(false)}
      />
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header styles with notification
  header: {
    paddingHorizontal: horizontalScale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(8),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchContainer: {
    flex: 1,
    marginRight: horizontalScale(12),
  },
  notificationButton: {
    position: 'relative',
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: moderateScale(4),
    right: moderateScale(4),
    backgroundColor: colors.error,
    borderRadius: moderateScale(10),
    minWidth: horizontalScale(18),
    height: verticalScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(4),
  },
  badgeText: {
    color: colors.white,
    fontSize: moderateScale(10),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  welcomeSection: {
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(16),
  },
  bannerBackground: {
    height: verticalScale(180),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  bannerImage: {
    borderRadius: moderateScale(16),
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'center',
    padding: moderateScale(20),
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  greetingIcon: {
    marginRight: horizontalScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  greetingText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
  },
  bannerTitle: {
    color: colors.white,
    fontSize: moderateScale(20),
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    marginTop: verticalScale(4),
  },
  bannerSubtitle: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    marginTop: verticalScale(8),
    lineHeight: moderateScale(20),
    opacity: 0.9,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(8),
    marginTop: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exploreButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginRight: horizontalScale(8),
    fontFamily: 'Poppins-Medium',
  },
  statsSection: {
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.text,
    marginBottom: verticalScale(12),
    fontFamily: 'Poppins-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginRight: horizontalScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    minWidth: horizontalScale(140),
  },
  statsIcon: {
    width: horizontalScale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  statsContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statsValue: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Poppins-Bold',
  },
  statsTitle: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
  },
  servicesSection: {
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: moderateScale(14),
    color: colors.primary,
    fontWeight: '500',
    marginRight: horizontalScale(4),
    fontFamily: 'Poppins-Medium',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    backgroundColor: colors.white,
    width: '48%',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    marginBottom: verticalScale(16),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardImageContainer: {
    position: 'relative',
    height: verticalScale(120),
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  cardIcon: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    width: horizontalScale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: moderateScale(16),
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(18),
  },
  cardSubtitle: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    lineHeight: moderateScale(16),
    marginBottom: verticalScale(12),
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  quickActionsSection: {
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: colors.white,
    width: '30%',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  quickActionText: {
    fontSize: moderateScale(12),
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: verticalScale(8),
    fontFamily: 'Poppins-Medium',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Support Modal Styles
  supportModal: {
    width: '90%',
    maxWidth: horizontalScale(400),
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(20),
    paddingBottom: moderateScale(16),
  },
  modalTitle: {
    flex: 1,
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.white,
    marginLeft: horizontalScale(12),
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  modalContent: {
    padding: moderateScale(20),
  },
  supportText: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(20),
    fontFamily: 'Poppins-Regular',
    lineHeight: moderateScale(20),
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(20),
  },
  phoneNumber: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text,
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-SemiBold',
  },
  supportOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
  supportOption: {
    flex: 1,
    alignItems: 'center',
    padding: moderateScale(16),
    marginHorizontal: horizontalScale(4),
    borderRadius: moderateScale(12),
    backgroundColor: colors.background,
  },
  optionIcon: {
    width: horizontalScale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  optionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: verticalScale(4),
  },
  optionSubtitle: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  supportHours: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginLeft: horizontalScale(6),
    fontFamily: 'Poppins-Regular',
  },

  // Knowledge Base Modal Styles
  knowledgeModal: {
    width: '95%',
    height: '80%',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  knowledgeContent: {
    flex: 1,
    padding: moderateScale(20),
  },
  knowledgeIntro: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(20),
    fontFamily: 'Poppins-Regular',
    lineHeight: moderateScale(20),
  },
  knowledgeGrid: {
    marginBottom: verticalScale(20),
  },
  knowledgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  knowledgeIcon: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  knowledgeText: {
    flex: 1,
  },
  knowledgeTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: verticalScale(2),
  },
  knowledgeSubtitle: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
  },
  searchSection: {
    marginTop: verticalScale(20),
  },
  searchTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: verticalScale(12),
    fontFamily: 'Poppins-SemiBold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.text,
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-Regular',
  },

  // Feedback Modal Styles
  feedbackModal: {
    width: '95%',
    height: '85%',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  feedbackContent: {
    flex: 1,
    padding: moderateScale(20),
  },
  feedbackIntro: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(24),
    fontFamily: 'Poppins-Regular',
    lineHeight: moderateScale(20),
  },
  ratingSection: {
    marginBottom: verticalScale(24),
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    padding: moderateScale(4),
    marginHorizontal: horizontalScale(2),
  },
  categorySection: {
    marginBottom: verticalScale(24),
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: horizontalScale(8),
  },
  categoryChip: {
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Medium',
  },
  selectedChipText: {
    color: colors.white,
  },
  textSection: {
    marginBottom: verticalScale(24),
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    backgroundColor: colors.background,
    minHeight: verticalScale(120),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: moderateScale(16),
    borderRadius: moderateScale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.white,
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-SemiBold',
  },
});

export default HomeScreen;