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
import { supabase } from '../../lib/supabase';


export default function ContentView() {
  const [region, setRegion] = useState({
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
});

  const [spots, setSpots] = useState<Spot[]>([]);
  const [searchText, setSearchText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      setErrorMessage(`Failed to load spots: ${error}`);
    }
  };
function clusterSpots(spots: Spot[], zoomLevel: number): Spot[] {
  if (zoomLevel <= 0.5) return spots; // don't cluster

  const grouped: Spot[] = [];
  const seen: { [key: string]: Spot } = {};

  const RADIUS_KM = 5;

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  for (let spot of spots) {
    let clustered = false;
    for (let key in seen) {
      const other = seen[key];
      if (
        haversine(spot.latitude, spot.longitude, other.latitude, other.longitude) <= RADIUS_KM
      ) {
        clustered = true;
        break;
      }
    }
    if (!clustered) {
      const key = `${spot.latitude.toFixed(2)}-${spot.longitude.toFixed(2)}`;
      seen[key] = spot;
      grouped.push(spot);
    }
  }

  return grouped;
}

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
  // setErrorMessage(`Search failed: ${(error as Error).message}`);
}


  };
interface Spot {
  id: string | number;
  latitude: number;
  longitude: number;
  [key: string]: any; // optional: allows other unknown fields without error
}

  useEffect(() => {
    getLocationAsync();
    fetchSpots();
  }, []);

  return (
    <View style={styles.container}>
      {region && (
        <MapView
  style={styles.map}
  region={region}
  showsUserLocation
  onRegionChangeComplete={(newRegion) => {
    setRegion(newRegion); // update region so we know zoom level
  }}
>
{clusterSpots(spots, region.latitudeDelta).map((spot, index) => (
  <Marker
    key={spot.id ?? index}
    coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
    onPress={() =>
      router.push({
        pathname: '/home/spotdetail',
        params: { spot: JSON.stringify(spot) },
      })
    }
    image={require('../../assets/image.png')}
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
    backgroundColor:' rgb(255,191,0)',
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
