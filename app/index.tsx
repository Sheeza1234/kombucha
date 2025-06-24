import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from './(auth)'; // make sure this is implemented
const SplashScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (user) {
        navigation.reset({ index: 0, routes: [{ name: 'home/home' }] }); // or 'Tabs' if using bottom tabs
      } else {
        navigation.reset({ index: 0, routes: [{ name: '(auth)/sigin' }] });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <LinearGradient
      colors={['rgb(255, 87, 51)', 'rgb(255,87,51)']}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* <Ionicons name="wine" size={80} color="white" style={styles.shadow} /> */}
        <Text style={styles.title}>KombuMap</Text>
        {isLoading && <ActivityIndicator size="large" color="#fff" />}
      </View>
    </LinearGradient>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  shadow: {
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
});
