/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {moderateScale, verticalScale} from '../utils/metrics';
import {BASE_URL} from '../utils/Constants';
import {useUserStore} from '../zustand/store';

const FarmerPost = ({post, onCommentPress}) => {
  const [likes, setLikes] = useState(post.likeCount); // Local state for likes
  const userData = useUserStore(state => state.userData);

  console.log(post.farmer);
  const handleLikePress = async () => {
    // Increase the local like count
    const cleanedToken = userData.token.replace(/"/g, '');
    setLikes(prevLikes => prevLikes + 1);

    try {
      // Make the API request to like the post
      const response = await fetch(`${BASE_URL}/like/post/${post.id}`, {
        // Replace with your actual API URL
        method: 'POST', // or 'PUT' depending on your API design
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
        body: JSON.stringify({userId: 'user-id'}), // Include user ID if required
      });

      if (!response.ok) {
        throw new Error('Failed to like the post');
      }
    } catch (error) {
      console.error('Error liking the post:', error);
      // Optionally, revert the like count if there's an error
      setLikes(prevLikes => prevLikes - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://avatar.iran.liara.run/public/23',
          }}
          style={styles.profilePic}
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{post.farmer.name}</Text>
          {/* <Text style={styles.location}>Yavatmal, Maharashtra</Text> */}
          <Text style={styles.timestamp}>21 Nov 2021 09:30 am</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="ellipsis-vertical" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.tagsContainer}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: moderateScale(11),
            color: 'black',
          }}>
          {post.content}
        </Text>
      </View>

      <Image
        source={{
          uri: post.image,
        }}
        style={styles.mainImage}
      />

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLikePress}>
          <AntDesign name="like2" size={20} color="#000" />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>

        {/* Trigger the onCommentPress when the comment icon is pressed */}
        <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
          <Icon name="chatbubble-outline" size={20} color="#000" />
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share-social-outline" size={20} color="#000" />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  name: {
    fontSize: moderateScale(13),
    color: 'black',
    fontFamily: 'Poppins-Medium',
  },
  location: {
    fontSize: 14,
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  moreButton: {
    padding: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#FFE4B5',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
  },
  tagText: {
    color: '#8B4513',
  },
  mainImage: {
    width: '100%',
    height: verticalScale(150),
    borderRadius: moderateScale(10),
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: verticalScale(10),
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    color: 'black',
  },
});

export default FarmerPost;
