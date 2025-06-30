import { Entypo, EvilIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const { width } = Dimensions.get('window');
const contentWidth = width * 0.93;



export default function SpotDetailScreen() {
  const params = useLocalSearchParams();
  const navigation=useNavigation();
  const router=useRouter()
  // Assuming you passed a full spot object as a JSON string under `spot`
  const spot = JSON.parse(params.spot as string);

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>

    <ScrollView
  style={styles.scroll} // apply background color here
  contentContainerStyle={styles.container}
>
<View style={styles.top}>
  <Text style={styles.placeholderText}>Kombucha Spot</Text>
  <TouchableOpacity onPress={() => router.replace('/home/home')} style={styles.doneWrapper}>
    <Text style={styles.donebutton}>Done</Text>
  </TouchableOpacity>
</View>


      {spot.photoURL ? (
        <Image source={{ uri: spot.photoURL }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <EvilIcons name="image" color="white" size={49} />
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


      <TouchableOpacity style={styles.directionsButton} onPress={openInMaps}>
        <Entypo name="direction" color="white" size={24} />
        <Text style={styles.directionsText}>Get Directions</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
  flex: 1,
  backgroundColor: '#121212',
},
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
  backgroundColor: '#2c2c2e',
  borderRadius: 15,
},
  placeholderText: {
    color: 'white',
    fontSize: 20,
    marginTop:10
    
  },
detailsContainer: {
  backgroundColor: '#2c2c2e',
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

headerTitle: {
  color: 'white',
  fontSize: 20,
  fontWeight: '800',
  position: 'absolute',
  left: 0,
  right: 0,
  textAlign: 'center',
},

doneWrapper: {
  position: 'absolute',
  right: 20,
  justifyContent: 'center',
},

donebutton: {
  fontWeight: '600',
  fontSize: 16,
  color: '#fe9f0a',
},
  label: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  comment: {
    marginTop: 8,
    fontSize: 16,
    backgroundColor: '#2c2c2e',
    color: '#ddd',
    // padding: 12,
    borderRadius: 10,
  },
  coordinates: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  directionsText: {
    color:'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

