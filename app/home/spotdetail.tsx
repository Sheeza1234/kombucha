import { Entypo, EvilIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const contentWidth = width * 0.93;

export default function SpotDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const spot = JSON.parse(params.spot as string);
  const colorScheme = useColorScheme() || 'light';

  const isDark = colorScheme === 'dark';

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#f5f5f5' }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#f5f5f5' }}
        contentContainerStyle={styles.container}
      >
        <View style={styles.top}>
          <Text style={[styles.placeholderText, { color: isDark ? '#fff' : '#222' }]}>
            Kombucha Spot
          </Text>
          <TouchableOpacity onPress={() => router.replace('/home/home')} style={styles.doneWrapper}>
            <Text style={[styles.donebutton, { color: '#fe9f0a' }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {spot.photoURL ? (
          <Image source={{ uri: spot.photoURL }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: isDark ? '#2c2c2e' : '#ddd' }]}>
            <EvilIcons name="image" color={isDark ? "white" : "#555"} size={49} />
            <Text style={[styles.placeholderText, { color: isDark ? '#fff' : '#333' }]}>
              No Photo Available
            </Text>
          </View>
        )}

        <View style={[styles.detailsContainer, { backgroundColor: isDark ? '#2c2c2e' : '#fff' }]}>
          <Text style={[styles.label, { color: isDark ? '#999' : '#666' }]}>Store Name</Text>
          <Text style={[styles.value, { color: isDark ? '#fff' : '#000' }]}>{spot.name}</Text>

          <Text style={[styles.label, { color: isDark ? '#999' : '#666' }]}>Address</Text>
          <Text style={[styles.value, { color: isDark ? '#fff' : '#000' }]}>{spot.address}</Text>

          {spot.comment && (
            <>
              <Text style={[styles.label, { color: isDark ? '#999' : '#666' }]}>Comment</Text>
              <Text style={[styles.comment, { color: isDark ? '#ddd' : '#333' }]}>
                {spot.comment}
              </Text>
            </>
          )}

          <Text style={[styles.label, { color: isDark ? '#aaa' : '#666' }]}>Coordinates</Text>
          <Text style={[styles.coordinates, { color: isDark ? '#aaa' : '#666' }]}>
            Lat: {spot.latitude.toFixed(6)}, Lng: {spot.longitude.toFixed(6)}
          </Text>
        </View>

        <TouchableOpacity style={styles.directionsButton} onPress={openInMaps}>
          <Entypo name="direction" color="white" size={24} />
          <Text style={styles.directionsText}>Get Directions</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingTop: 0,
    alignItems: 'center',
  },
  image: {
    width: contentWidth,
    height: 250,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    backgroundColor: '#2c2c2e',
  },
  placeholderImage: {
    width: contentWidth,
    height: 200,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  placeholderText: {
    fontSize: 20,
    marginTop: 10,
  },
  detailsContainer: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    width: contentWidth,
  },
  directionsButton: {
    flexDirection: 'row',
    backgroundColor: '#fe9f0a',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: contentWidth,
  },
  top: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
    width: '100%',
  },
  doneWrapper: {
    position: 'absolute',
    right: 20,
    justifyContent: 'center',
  },
  donebutton: {
    fontWeight: '600',
    fontSize: 16,
  },


headerTitle: {
  color: 'white',
  fontSize: 20,
  fontWeight: '800',
  position: 'absolute',
  left: 0,
  right: 0,
  textAlign: 'center',
},

  label: {
    fontSize: 12,
    marginTop: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  comment: {
    marginTop: 8,
    fontSize: 16,
    borderRadius: 10,
  },
  coordinates: {
    fontSize: 12,
    marginTop: 4,
  },
  directionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

