import {View, Text, ScrollView, StyleSheet} from 'react-native';
import React from 'react';

const TermsAndPrivacypolicies = ({route, navigation}) => {
  const {path} = route.params;

  const pageTitle = path === 'terms' ? 'Terms & Conditions' : 'Privacy Policy';

  React.useLayoutEffect(() => {
    navigation.setOptions({title: pageTitle}); // Set header dynamically
  }, [navigation, pageTitle]);

  return (
    <View style={styles.container}>
      <ScrollView>
        {path === 'terms' ? (
          <View>
            <Text style={styles.heading}>Terms & Conditions</Text>
            <Text style={styles.content}>
              Welcome to our app. These terms and conditions outline the rules
              and regulations for the use of our services. By accessing this
              app, you agree to abide by these terms. Failure to comply may
              result in suspension of your account.
            </Text>
            <Text style={styles.subHeading}>Usage Guidelines:</Text>
            <Text style={styles.content}>
              1. You must provide accurate information during registration.
              {'\n'}
              2. Do not misuse the services provided by the app.{'\n'}
              3. Abide by local laws and regulations when using the app.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.heading}>Privacy Policy</Text>
            <Text style={styles.content}>
              Your privacy is important to us. This privacy policy outlines how
              we collect, use, and protect your data while using our app.
            </Text>
            <Text style={styles.subHeading}>Data Collection:</Text>
            <Text style={styles.content}>
              1. We collect personal information such as email, phone number,
              and location to improve your experience.{'\n'}
              2. All data collected is stored securely and not shared with
              unauthorized third parties.
            </Text>
            <Text style={styles.subHeading}>Your Rights:</Text>
            <Text style={styles.content}>
              - You can request access to or deletion of your personal data by
              contacting us at support@example.com.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
    marginBottom: 16,
  },
});

export default TermsAndPrivacypolicies;
