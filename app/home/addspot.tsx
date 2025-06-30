import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import uuid from 'react-native-uuid';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/Authcontext';



export default function AddSpotScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const router = useRouter();
  const [region, setRegion] = useState({
    latitude: 46.603354,
    longitude: 1.888334,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [isSaving, setIsSaving] = useState(false);
const [address, setAddress] = useState(''); // <-- stores real address

useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setRegion({
        ...region,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const { latitude, longitude } = currentLocation.coords;

      // 🌍 Geo-fencing countries
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBb37aZ7mLZqvKhtIkNhhYu5KOnUwl6YWo`
      );
const components: Array<{ types: string[]; long_name: string }> = res.data.results[0]?.address_components || [];

const country = components.find((c) => c.types.includes("country"))?.long_name;

const fullAddress = res.data.results[0]?.formatted_address;
setAddress(fullAddress || ''); // fallback to empty if not found


    } catch (e) {
      console.warn('Geocoding failed:', e);
      Alert.alert('Error', 'Unable to determine your country. Please check your internet or location settings.');
    }
  })();
}, []);


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
const isValidName = (input: string) => {
  const bannedWords = ['poop', 'test', '123', 'yo'];
  const pattern = /^[A-Za-zÀ-ÿ\s'-]{3,}$/;
  return (
    pattern.test(input) &&
    !bannedWords.some(bad => input.toLowerCase().includes(bad))
  );
};
const fetchAddressFromCoords = async (latitude: number, longitude: number) => {
  try {
    const res = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=f2b6935d699b4c6b87fb7c6f3669e235`
    );

    const fullAddress = res.data.results[0]?.formatted;
    setAddress(fullAddress || 'Unknown Address');
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    setAddress('Unknown Address');
  }
};


const { user } = useAuth();

  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${uuid.v4()}.jpg`;

    const { data, error } = await supabase.storage.from('spots').upload(fileName, blob, {
      contentType: 'image/jpeg',
    });

    if (error) throw error;
    return supabase.storage.from('spots').getPublicUrl(data.path).data.publicUrl;
  };
const saveSpot = async () => {
  if (!name || !location) {
    Alert.alert('Missing Data', 'Please fill in all required fields.');
    return;
  }

  if (!isValidName(name)) {
    Alert.alert('Invalid Name', 'Please enter a proper store name without emojis or banned words.');
    return;
  }

  if (Platform.OS === 'ios' && !user) {
    router.replace('/(auth)/signin?redirectTo=/home/add-spot' as never);
    return;
  }

  setIsSaving(true);

  try {
    // 📍 Reverse geocode to get country and full address
    const res = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${region.latitude},${region.longitude}&key=AIzaSyBb37aZ7mLZqvKhtIkNhhYu5KOnUwl6YWo`
    );

    const components: Array<{ types: string[]; long_name: string }> = res.data.results[0]?.address_components || [];
    const country = components.find((c) => c.types.includes("country"))?.long_name;
    const fullAddress = res.data.results[0]?.formatted_address || 'Unknown Address';

    // ✅ Restrict based on country only when saving
    const allowedCountries = ['France', 'Germany', 'Canada'];
    if (!country || !allowedCountries.includes(country)) {
      Alert.alert('Invalid Location', 'Spots can only be added in France, Germany, or Canada for now.');
      setIsSaving(false);
      return;
    }

    let photoUrl = 'placeholder';
    if (imageUri) {
      photoUrl = await uploadImage(imageUri);
    }

    const { error } = await supabase.from('kombuspots').insert([
      {
        id: uuid.v4(),
        name,
        address: fullAddress,
        latitude: region.latitude,
        longitude: region.longitude,
        comment: comment || null,
        photo_url: photoUrl,
        seen_count: 0,
        like_count: 0,
      },
    ]);

    if (error) throw error;

    Alert.alert('Success', 'Spot added successfully!');
    navigation.goBack();
  } catch (err: any) {
    Alert.alert('Error', err.message);
  } finally {
    setIsSaving(false);
  }
};




  return (
<ScrollView contentContainerStyle={styles.container}>
  <View style={styles.top}>
     <TouchableOpacity onPress={() => router.replace('/home/home')} style={styles.doneWrapper}>
      <Text style={styles.donebutton}>Cancel</Text>
    </TouchableOpacity>
    <Text style={styles.placeholderText}>Add New Spot</Text>
    <TouchableOpacity onPress={() => router.replace('/home/home')} style={styles.doneWrapper}>
      <Text style={styles.donebutton}>Save</Text>
    </TouchableOpacity>
  </View>
  <TouchableOpacity onPress={pickImage} style={styles.addPhotoBox}>
    {imageUri ? (
      <Image source={{ uri: imageUri }} style={{ height: 200, width: '100%', borderRadius: 12 }} />
    ) : (
      <>
       <MaterialIcons name="add-photo-alternate" color='#fe9f0a' size={44} />
        <Text style={styles.addPhotoText}>Add Photo</Text>
      </>
    )}
  </TouchableOpacity>

  <Text style={styles.helperText}>📸 Tap to add a photo of the kombucha spot</Text>

  <TextInput placeholder="Store Name" value={name} onChangeText={setName} style={styles.input} />
  <TextInput placeholder="Comment (Optional)" value={comment} onChangeText={setComment} style={styles.input1} />

  <View style={styles.sectionTitleRow}>
    <Text style={styles.sectionTitle}>Location</Text>
    <TouchableOpacity onPress={() => {
      if (location) {
        setRegion({
          ...region,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        fetchAddressFromCoords(location.coords.latitude, location.coords.longitude);
      }
    }}>
      <Text style={styles.sectionLink}>Use Current Location</Text>
    </TouchableOpacity>
  </View>
  <Text style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>
    Tap on the map to select a location
  </Text>

<View style={styles.mapWrapper}>
  <MapView
    region={region}
    onPress={(e) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setRegion((prev) => ({ ...prev, latitude, longitude }));
      fetchAddressFromCoords(latitude, longitude);
    }}
    style={styles.map}
  >
    <Marker
      coordinate={{ latitude: region.latitude, longitude: region.longitude }}
      draggable
      onDragEnd={(e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setRegion((prev) => ({ ...prev, latitude, longitude }));
        fetchAddressFromCoords(latitude, longitude);
      }}
      image={require('../../assets/image.png')}
    />
  </MapView>
</View>

</ScrollView>

  );
}
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#121212',
    flexGrow: 1,
  },
  top: {
    flexDirection:'row',
  height: 60,
  justifyContent:'space-between',
  alignItems: 'center',
  marginTop: 20,
  position: 'relative',
  width: '100%',
},
doneWrapper: {
  // position: 'absolute',
  // right: 20,
  // justifyContent: 'center',
},

donebutton: {
  // fontWeight: '600',
  fontSize: 18,
  color: '#fe9f0a'
},
  placeholderText: {
    color: 'white',
    fontSize: 20,
    // marginTop:20
    
  },
  addPhotoBox: {
    height: 200,
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPhotoText: {
    color: '#555',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  helperText: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
    fontSize: 13,
  },
  input: {
    // borderWidth: 0.5,
    backgroundColor:'#2c2c2e',
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color:'#555'
  },
    input1: {
  backgroundColor: '#2c2c2e',
  borderColor: '#ddd',
  borderRadius: 5,
  paddingVertical: 24,
  paddingHorizontal: 12, // better for left alignment
  fontSize: 16,
  marginBottom: 12,
  color: '#ff9f00',
  textAlign: 'left',
},

  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9f00',
  },
 mapWrapper: {
  borderRadius: 25,
  overflow: 'hidden',
  marginBottom: 20,
},

map: {
  height: 200,
  width: '100%',
},

});
