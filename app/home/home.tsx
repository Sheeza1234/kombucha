import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Keyboard,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { supabase } from '../../lib/supabase';

interface Spot {
  id: string | number;
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface Cluster {
  spots: Spot[];
  center: { latitude: number; longitude: number };
}

export default function ContentView() {
  const [region, setRegion] = useState<Region>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [spots, setSpots] = useState<Spot[]>([]);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const getLocationAsync = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Access',
        'Please enable location access in Settings to see your current position.',
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
      console.error(`Failed to load spots:`, error);
    }
  };

  useEffect(() => {
    getLocationAsync();
    fetchSpots();
  }, []);

  const [isSearching, setIsSearching] = useState(false);

// const searchLocation = async () => {
//   // if (isSearching) return; // prevent rapid double calls
//   setIsSearching(true);
//   // setTimeout(() => setIsSearching(false), 1000);

//   if (!searchText) return;
//   try {
//     const geoResp = await Location.geocodeAsync(searchText);
//     if (geoResp.length > 0) {
//       const location = geoResp[0];
//       setRegion({
//         latitude: location.latitude,
//         longitude: location.longitude,
//         latitudeDelta: 6,
//         longitudeDelta: 6,
//       });
//     }
//   } catch (error) {
//     console.error('Search failed:', error);
//   }
// };

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
 }
  // ============ Clustering logic ============
  const calculateClusters = (spots: Spot[], region: Region): Cluster[] => {
  const clusters: Cluster[] = [];
  const clustered = new Set<number>();

  // Adjust clustering dynamically based on zoom level
  let clusterRadiusKm = 2;
  if (region.latitudeDelta > 0.5) clusterRadiusKm = 15;
  if (region.latitudeDelta > 2) clusterRadiusKm = 30;
  if (region.latitudeDelta > 5) clusterRadiusKm = 80;
  if (region.latitudeDelta > 10) clusterRadiusKm = 200;

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  for (let i = 0; i < spots.length; i++) {
    if (clustered.has(i)) continue;

    const cluster: Cluster = {
      spots: [spots[i]],
      center: { latitude: spots[i].latitude, longitude: spots[i].longitude },
    };
    clustered.add(i);

    for (let j = i + 1; j < spots.length; j++) {
      if (clustered.has(j)) continue;
      const dist = haversine(
        spots[i].latitude,
        spots[i].longitude,
        spots[j].latitude,
        spots[j].longitude
      );
      if (dist < clusterRadiusKm) {
        cluster.spots.push(spots[j]);
        clustered.add(j);
      }
    }

    if (cluster.spots.length > 1) {
      const latSum = cluster.spots.reduce((sum, s) => sum + s.latitude, 0);
      const lonSum = cluster.spots.reduce((sum, s) => sum + s.longitude, 0);
      cluster.center = {
        latitude: latSum / cluster.spots.length,
        longitude: lonSum / cluster.spots.length,
      };
    }

    clusters.push(cluster);
  }

  return clusters;
};


  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        onRegionChangeComplete={setRegion}
      >
        {calculateClusters(spots, region).flatMap((cluster, idx) => {
          if (cluster.spots.length <= 3) {
            return cluster.spots.map((spot, i) => (
              <Marker
                key={`${idx}-${i}`}
                coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                onPress={() =>
                  router.push({
                    pathname: '/home/spotdetail',
                    params: { spot: JSON.stringify(spot) },
                  })
                }
                image={require('../../assets/image.png')}
              />
            ));
          } else {
            return (
              <Marker
                key={`cluster-${idx}`}
                coordinate={cluster.center}
                onPress={() =>
                  Alert.alert('Cluster', `${cluster.spots.length} spots here. Zoom in.`)
                }
              >
                <View style={styles.clusterMarker}>
                  {/* <Image
                    source={require('../../assets/1024.png')}
                    style={styles.clusterImage}
                  /> */}
                  <Text style={styles.clusterText}>{cluster.spots.length}+</Text>
                </View>
              </Marker>
            );
          }
        })}
      </MapView>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => {
  Keyboard.dismiss();
  searchLocation();
}}

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
  container: { flex: 1 },
  map: { flex: 1 },
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
  searchInput: { flex: 1, padding: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
      backgroundColor: 'rgb(255,191,0)',
  },
  fabIcon: { color: 'white', fontSize: 30 },
 clusterMarker: {
  backgroundColor: 'rgb(255,191,0)',
  borderRadius: 20,
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
},

  clusterText: { color: 'black', fontWeight: 'bold' },
  clusterImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
