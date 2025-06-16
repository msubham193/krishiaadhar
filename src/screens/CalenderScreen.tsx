import React, {useState, useEffect} from 'react';
import {
  View,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import {Agenda} from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Entypo';
import {launchImageLibrary} from 'react-native-image-picker';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import {blue} from '../utils/Colors';
import {BASE_URL} from '../utils/Constants';
import {useUserStore} from '../zustand/store';

const App = ({navigation, route}) => {
  const [items, setItems] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const userData = useUserStore(state => state.userData);

  const {id} = route.params;
  console.log(id);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const savedItems = await AsyncStorage.getItem(`agendaItems${id}`);
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
    } catch (e) {
      console.error('Failed to load items.', e);
    }
  };

  const saveActivities = async newItems => {
    try {
      await AsyncStorage.setItem(`agendaItems${id}`, JSON.stringify(newItems));
      setItems(newItems);
    } catch (e) {
      console.error('Failed to save items.', e);
    }
  };

  const addActivity = async () => {
    setModalVisible(false);
    if (!selectedDate || !title || !startTime || !endTime) return;

    const newItems = {...items};

    if (!newItems[selectedDate]) {
      newItems[selectedDate] = [];
    }

    const newActivity = {
      title,
      description,
      timeRange: `${startTime} - ${endTime}`,
      completed: false,
      image: image ? image.uri : null,
      caption,
    };

    newItems[selectedDate].push(newActivity);

    // Save activities locally
    saveActivities(newItems);

    // Prepare FormData for the POST request
    const formData = new FormData();
    if (image) {
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg', // adjust type if necessary
        name: image.fileName || 'image.jpg', // provide a default name if not available
      });
    }
    formData.append('content', caption);
    const cleanedToken = userData.token.replace(/"/g, '');
    try {
      // Make the POST request
      const response = await fetch(`${BASE_URL}/farmer/posts/create`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-access-token': cleanedToken,
        },
      });

      const result = await response.json();
      console.log(result);
      if (response.ok) {
        console.log('Activity added successfully:', result);
      } else {
        console.error('Error adding activity:', result);
      }
    } catch (error) {
      console.error('Failed to make the POST request:', error);
    }

    // Reset modal state and close it
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setImage(null);
    setCaption('');
  };

  const toggleCompleted = (day, index) => {
    const newItems = {...items};
    newItems[day][index].completed = !newItems[day][index].completed;

    if (newItems[day][index].completed) {
      newItems[day].splice(index, 1);
    }

    setItems(newItems);
    saveActivities(newItems);
  };

  const loadItems = day => {
    const newItems = {...items};
    for (let i = -15; i < 85; i++) {
      const time = day.timestamp + i * 24 * 60 * 60 * 1000;
      const strTime = new Date(time).toISOString().split('T')[0];

      if (!newItems[strTime]) {
        newItems[strTime] = [];
      }
    }
    setItems(newItems);
  };

  const pickImage = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        setImage(response.assets[0]);
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Main')}>
          <Ionicons name="chevron-left" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Scheduler</Text>
      </View>

      <Agenda
        items={items}
        loadItemsForMonth={loadItems}
        selected={selectedDate}
        onDayPress={day => {
          setSelectedDate(day.dateString);
        }}
        renderItem={(item, _, index) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>{item.timeRange}</Text>
            {item.image && (
              <Image source={{uri: item.image}} style={styles.itemImage} />
            )}
            {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
          </View>
        )}
        renderEmptyData={() => (
          <View style={styles.emptyDate}>
            <Text>No activities for this day!</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Activity</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="cross" size={30} color="red" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="black"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description"
              value={description}
              placeholderTextColor="black"
              onChangeText={setDescription}
              multiline={true}
            />
            <TextInput
              style={styles.input}
              placeholder="Start Time (e.g. 9:00 AM)"
              value={startTime}
              placeholderTextColor="black"
              onChangeText={setStartTime}
            />
            <TextInput
              style={styles.input}
              placeholder="End Time (e.g. 5:00 PM)"
              value={endTime}
              placeholderTextColor="black"
              onChangeText={setEndTime}
            />

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Text>Pick an Image</Text>
            </TouchableOpacity>
            {image && (
              <Image source={{uri: image.uri}} style={styles.previewImage} />
            )}

            <TextInput
              style={styles.input}
              placeholder="Image Caption"
              value={caption}
              placeholderTextColor="black"
              onChangeText={setCaption}
            />

            <TouchableOpacity onPress={addActivity} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: blue,
    paddingTop: verticalScale(40),
    paddingHorizontal: verticalScale(20),
    height: verticalScale(80),
  },
  backButton: {
    marginRight: horizontalScale(10),
  },
  headerTitle: {
    fontSize: moderateScale(16),
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
  },
  item: {
    backgroundColor: 'white',
    padding: horizontalScale(20),
    marginVertical: verticalScale(10),
    borderRadius: moderateScale(5),
    position: 'relative',
  },
  title: {
    fontSize: moderateScale(14),
    color: 'black',
    fontFamily: 'Poppins-SemiBold',
  },
  emptyDate: {
    padding: horizontalScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: verticalScale(40),
    right: horizontalScale(20),
    backgroundColor: blue,
    width: horizontalScale(60),
    height: verticalScale(60),
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    color: 'white',
    fontSize: moderateScale(30),
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: moderateScale(10),
    padding: horizontalScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-Bold',
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: moderateScale(5),
    padding: moderateScale(10),
    marginVertical: verticalScale(5),
    color: 'black',
  },
  descriptionInput: {
    height: verticalScale(80),
    color: 'black',
  },
  imagePicker: {
    backgroundColor: 'lightgray',
    padding: moderateScale(10),
    borderRadius: moderateScale(5),
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },
  previewImage: {
    width: horizontalScale(100),
    height: verticalScale(100),
    marginVertical: verticalScale(10),
  },
  addButton: {
    backgroundColor: blue,
    borderRadius: moderateScale(5),
    padding: moderateScale(10),
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
  },
  caption: {
    fontSize: moderateScale(12),
    color: 'gray',
  },
  itemImage: {
    width: '100%',
    height: verticalScale(100),
    marginVertical: verticalScale(10),
  },
});

export default App;
