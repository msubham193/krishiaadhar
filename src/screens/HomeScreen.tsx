import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  GestureResponderEvent,
  TextInput,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import {blue} from '../utils/Colors';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import LinearGradient from 'react-native-linear-gradient'; // Import LinearGradient
import Icon from 'react-native-vector-icons/Ionicons';
import FarmerPost from '../components/FarmerPost';
import SearchBox from '../components/SearchBox';

// Define types for props
interface HomeScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

interface CardProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  onPress?: (event: GestureResponderEvent) => void;
}

// Card Component
const ServiceCard: React.FC<CardProps> = ({
  title,
  subtitle,
  imageUrl,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={imageUrl} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <SearchBox />
        <ImageBackground
          source={require('../assets/images/bg.jpg')}
          style={styles.bannerImageBackground}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.4)']}
            style={styles.bannerGradient}>
            <Text style={styles.bannerTitle}>
              Explore KrishiAadhar Services
            </Text>
            <View style={styles.services}>
              <Text style={styles.serviceItem}>Smart Irrigation Setup</Text>
              <Text style={styles.serviceItem}>Digital Soil Health Map</Text>
              <Text style={styles.serviceItem}>Crop Health Monitor</Text>
              <Text style={styles.serviceItem}>Drone Spraying</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.cards}>
          <ServiceCard
            title="Smart Irrigation Setup"
            subtitle="Automated, efficient irrigation"
            imageUrl={require('../assets/images/smartirigation.webp')}
            onPress={() => navigation.navigate('smartirrigation')}
          />
          <ServiceCard
            title="Digital Soil Health Map"
            subtitle="Analyze and map soil health"
            imageUrl={require('../assets/images/digitalsoil.webp')}
            onPress={() => navigation.navigate('soilhealthmap')}
          />
          <ServiceCard
            title="Crop Health Monitor"
            subtitle="Real-time crop monitoring"
            imageUrl={require('../assets/images/crophelth.webp')}
            onPress={() => navigation.navigate('crophealthmonitor')}
          />
          <ServiceCard
            title="Drone Spraying"
            subtitle="Efficient aerial spraying"
            imageUrl={require('../assets/images/dronespraying.webp')}
            onPress={() => navigation.navigate('dronesparying')}
          />
          <ServiceCard
            title="Crop Calendar"
            subtitle="Manage your crops efficiently"
            imageUrl={require('../assets/images/cropcalender.webp')}
            onPress={() => navigation.navigate('CropCalendar')}
          />
          <ServiceCard
            title="Expert Visit"
            subtitle="Schedule an expert visit"
            imageUrl={require('../assets/images/expertvisit.webp')}
            onPress={() => navigation.navigate('expertvisit')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  bannerImageBackground: {
    height: verticalScale(120),
    marginHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Medium',
  },
  services: {
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
    fontSize: moderateScale(11),
  },
  serviceItem: {
    color: '#fff',
    fontSize: moderateScale(12),
    marginBottom: verticalScale(2),
    fontFamily: 'Poppins-Regular',
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: moderateScale(16),
  },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    marginBottom: verticalScale(16),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: verticalScale(80),
  },
  cardTitle: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-SemiBold',
    margin: moderateScale(4),
    color: 'black',
  },
  cardSubtitle: {
    fontSize: moderateScale(10),
    color: '#666',
    marginBottom: verticalScale(5),
    marginHorizontal: horizontalScale(5),
    fontFamily: 'Poppins-Regular',
  },
});

export default HomeScreen;
