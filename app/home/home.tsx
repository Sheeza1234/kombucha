import { EvilIcons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
  const [isSearching, setIsSearching] = useState(false);
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
      console.error('Failed to load spots:', error);
    }
  };

  useEffect(() => {
    getLocationAsync();
    fetchSpots();
  }, []);

  const searchLocation = async () => {
    if (isSearching) return;
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1000);

    if (!searchText) return;

    try {
      const geoResp = await Location.geocodeAsync(searchText);
      if (geoResp.length > 0) {
        const location = geoResp[0];
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 6,
          longitudeDelta: 6,
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const calculateClusters = (spots: Spot[], region: Region): Cluster[] => {
    const clusters: Cluster[] = [];
    const clustered = new Set<number>();
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
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
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
        mapType="standard"
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
                  <Text style={styles.clusterText}>{cluster.spots.length}+</Text>
                </View>
              </Marker>
            );
          }
        })}
      </MapView>

      {/* Custom Header */}
      <View style={styles.header}>
        
        <Text style={styles.headerTitle}>Kombu Map</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => console.log('Send')}>
            <Feather name="send" size={20} color="#fe9f0a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={fetchSpots} style={{ marginLeft: 15 }}>
            <Feather name="rotate-ccw" size={20} color='#fe9f0a' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
         <EvilIcons name="search" color="white" size={24} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          placeholderTextColor="white"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            searchLocation();
          }}
        />
      </View>

      {/* Floating Add Button */}
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
    backgroundColor: '#000',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
header: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 80,
  backgroundColor: '#c4c4c4',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 40,
  paddingHorizontal: 20,
  zIndex: 10,
  borderBottomWidth: 0.5,
  borderBottomColor: '#444',
},
headerTitle: {
  fontSize: 24,
  fontWeight: '600',
  color: 'white',
},

  headerIcons: {
    position: 'absolute',
     paddingTop: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
searchContainer: {
  position: 'absolute',
  top: 90,
  left: 10,
  right: 10,
  backgroundColor: '#c4c4c4',
  borderRadius: 16,
  paddingHorizontal: 12,
  paddingVertical: 8,
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 9,
  color:'black'
},
searchInput: {
  flex: 1,
  padding: 8,
  // color: 'black',
  fontSize: 16,
},

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fe9f0a',
    elevation: 5,
  },
  fabIcon: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  clusterMarker: {
    backgroundColor: '#fe9f0a',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterText: {
    color: 'black',
    fontWeight: 'bold',
  },
});
