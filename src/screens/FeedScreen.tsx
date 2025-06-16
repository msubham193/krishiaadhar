import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  FlatList,
  RefreshControl,
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FarmerPost from '../components/FarmerPost';
import SearchBox from '../components/SearchBox';
import {blue} from '../utils/Colors';
import {BASE_URL} from '../utils/Constants';
import {useUserStore} from '../zustand/store';

const {height} = Dimensions.get('window');

const FeedScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true); // State for activity indicator
  const userData = useUserStore(state => state.userData);

  const onCommentPress = post => {
    if (userData.role === 'FARMER') {
      Alert.alert('Only experts can comment');
      return;
    }
    setSelectedPost(post);
    setModalVisible(true);
  };

  useEffect(() => {
    fetchFeedPost();
  }, []);

  const fetchFeedPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/posts/all`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setPosts(data.response);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false); // Hide activity indicator once data is fetched
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeedPost(); // Fetch posts on refresh
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <SearchBox />

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={blue} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <FarmerPost
              post={item}
              onCommentPress={() => onCommentPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[blue]}
            />
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Comments for {selectedPost?.content}
            </Text>
            <View style={styles.commentSection}>
              {selectedPost?.comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image
                    source={{uri: comment.user.image}}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUsername}>
                      {comment.user.name}
                    </Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    {comment.user.role === 'expert' && (
                      <Text style={styles.expertTag}>Expert</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
            <TextInput
              placeholder="Add a comment..."
              style={styles.commentInput}
            />
            <TouchableOpacity style={styles.commentSubmit}>
              <Text style={styles.commentSubmitText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: height * 0.8,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  expertTag: {
    color: '#FF4500',
    fontWeight: 'bold',
    backgroundColor: '#FFE4B5',
    borderRadius: 10,
    paddingHorizontal: 5,
    marginTop: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  commentSection: {
    flex: 1,
    marginBottom: 16,
  },
  commentUsername: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 16,
    marginVertical: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  commentSubmit: {
    backgroundColor: blue,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  commentSubmitText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: blue,
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default FeedScreen;
