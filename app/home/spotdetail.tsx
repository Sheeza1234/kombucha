import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function SpotDetailScreen() {
  const params = useLocalSearchParams();

  // Assuming you passed a full spot object as a JSON string under `spot`
  const spot = JSON.parse(params.spot as string);

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {spot.photoURL ? (
        <Image source={{ uri: spot.photoURL }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No Photo Available</Text>
        </View>
      )}

      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Store Name</Text>
        <Text style={styles.value}>{spot.name}</Text>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{spot.address}</Text>

        {spot.comment && (
          <>
            <Text style={styles.label}>Comment</Text>
            <Text style={styles.comment}>{spot.comment}</Text>
          </>
        )}

        <Text style={styles.label}>Coordinates</Text>
        <Text style={styles.coordinates}>
          Lat: {spot.latitude.toFixed(6)}, Lng: {spot.longitude.toFixed(6)}
        </Text>
      </View>

      <MapView
        style={styles.map}
        region={{
          latitude: spot.latitude,
          longitude: spot.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={{ latitude: spot.latitude, longitude: spot.longitude }} title={spot.name} />
      </MapView>

      <TouchableOpacity style={styles.directionsButton} onPress={openInMaps}>
        <Text style={styles.directionsText}>Get Directions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 250,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  placeholderImage: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  detailsContainer: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  comment: {
    marginTop: 8,
    fontSize: 16,
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 10,
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
  },
  map: {
    width: '100%',
    height: 200,
    marginTop: 20,
  },
  directionsButton: {
    backgroundColor: 'orange',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  directionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
