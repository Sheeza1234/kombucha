import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { useAuth } from '.'; // custom hook/context

const SignInScreen = () => {
  const { signInWithApple,signInWithGoogle, isLoading, errorMessage, isSignedIn } = useAuth();
  const [showError, setShowError] = useState(false);
  const navigation=useNavigation();
  const [appleAvailable, setAppleAvailable] = useState(false);

useEffect(() => {
  const checkAppleAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setAppleAvailable(available);
  };
  checkAppleAvailability();
}, []);


  useEffect(() => {
    if (errorMessage) {
      Alert.alert('Sign In Error', errorMessage, [{ text: 'OK', onPress: () => setShowError(false) }]);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (isSignedIn) {
      // Navigate to Home
      navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    }
  }, [isSignedIn]);

  return (
    <LinearGradient
      colors={['rgba(255,165,0,0.8)', 'rgba(255,165,0,0.4)']}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>🍾</Text>
          <Text style={styles.title}>KombuMap</Text>
          <Text style={styles.subtitle}>Discover the best kombucha spots around you</Text>
        </View>

        <View style={styles.signInSection}>
          <Text style={styles.welcome}>Welcome!</Text>
          <Text style={styles.prompt}>Sign in to save your favorite spots and add new discoveries</Text>
<TouchableOpacity
  onPress={signInWithGoogle}
  style={{
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    width: 250,
    alignItems: 'center',
  }}
>
  <Text style={{ fontWeight: '600', color: '#333' }}>Continue with Google</Text>
</TouchableOpacity>

          {appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={25}
              style={styles.appleButton}
              onPress={signInWithApple}
            />
          )}

          {isLoading && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Your privacy is important to us</Text>
          <Text style={styles.footerSubText}>We only use your information to personalize your experience</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between', padding: 30 },
  header: { alignItems: 'center', marginTop: 80 },
  icon: { fontSize: 80, color: 'white', textShadowColor: '#000', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 10 },
  title: { fontSize: 34, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5 },
  subtitle: { fontSize: 16, color: 'white', textAlign: 'center', marginTop: 10 },
  signInSection: { alignItems: 'center' },
  welcome: { fontSize: 20, fontWeight: '600', color: 'white' },
  prompt: { fontSize: 14, color: 'white', textAlign: 'center', paddingHorizontal: 20, marginVertical: 10 },
  appleButton: { width: 250, height: 44, alignSelf: 'center' },
  footer: { alignItems: 'center', marginBottom: 20 },
  footerText: { fontSize: 12, color: 'white' },
  footerSubText: { fontSize: 10, color: 'white', textAlign: 'center', marginTop: 4 },
});

export default SignInScreen;
