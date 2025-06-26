import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../supabase';


export default function ContentView() {
  const [region, setRegion] = useState(null);
  const [spots, setSpots] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const navigation = useNavigation();
  const router=useRouter();

  const getLocationAsync = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Access',
        'Please enable location access in Settings to see your current position and find nearby kombucha spots.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  const fetchSpots = async () => {
    try {
      const { data, error } = await supabase.from('kombuspots').select('*');
      if (error) throw error;
      setSpots(data);
    } catch (error) {
      setErrorMessage(`Failed to load spots: ${error.message}`);
    }
  };

  const searchLocation = async () => {
    if (!searchText) return;
    try {
      const geoResp = await Location.geocodeAsync(searchText);
      if (geoResp.length > 0) {
        const location = geoResp[0];
        setRegion({
  latitude: 48.8566, // Paris
  longitude: 2.3522,
  latitudeDelta: 6,  // big zoom out so you see all spots
  longitudeDelta: 6,
});

      }
    } catch (error) {
      setErrorMessage(`Search failed: ${error.message}`);
    }
  };

  useEffect(() => {
    getLocationAsync();
    fetchSpots();
  }, []);

  return (
    <View style={styles.container}>
      {region && (
        <MapView style={styles.map} region={region} showsUserLocation>
          {spots.map((spot) => (
          <Marker
  key={spot.id}
  coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
  onPress={() =>
    router.push({
      pathname: '/home/spotdetail',
      params: { spot: JSON.stringify(spot) }
    })
  }
  image={require('../../assets/1024.png')} // ✅ Put it here
/>


          ))}
        </MapView>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={searchLocation}
        />
        <Button title="Search" onPress={searchLocation} />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/home/addspot')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor:' rgb(255, 87, 51)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabIcon: {
    color: 'white',
    fontSize: 30,
  },
});
