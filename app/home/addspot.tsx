import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

      const allowedCountries = ['France', 'Germany', 'Canada'];

if (!country || !allowedCountries.includes(country)) {
  Alert.alert('Invalid Location', 'Spots can only be added in France, Germany, or Canada for now.');
}

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
 // ✅ works with expo-router

    return;
  }

  setIsSaving(true);

  try {
    // 📍 Fetch address from OpenCage API
    const res = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${region.latitude}+${region.longitude}&key=f2b6935d699b4c6b87fb7c6f3669e235`
    );

    const fullAddress = res.data.results[0]?.formatted || 'Unknown Address';

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
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity onPress={pickImage} style={{ marginBottom: 16 }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ height: 200, borderRadius: 10 }} />
        ) : (
          <View style={{ height: 200, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 10 }}>
            <Text>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput placeholder="Store Name" value={name} onChangeText={setName} style={{ borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 }} />
      <TextInput placeholder="Comment (optional)" value={comment} onChangeText={setComment} style={{ borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 }} />

      <MapView
        region={region}
       onPress={(e) => {
  const { latitude, longitude } = e.nativeEvent.coordinate;
  setRegion((prev) => ({ ...prev, latitude, longitude }));
  fetchAddressFromCoords(latitude, longitude); // 🔄 update address
}}
        style={{ height: 200, borderRadius: 10, marginBottom: 16 }}
      >
        <Marker
  coordinate={{ latitude: region.latitude, longitude: region.longitude }}
  draggable
 onDragEnd={(e) => {
  const { latitude, longitude } = e.nativeEvent.coordinate;
  setRegion((prev) => ({ ...prev, latitude, longitude }));
  fetchAddressFromCoords(latitude, longitude); // 🔄 update address
}}
  image={require('../../assets/image.png')}
/>

      </MapView>

      <Button title="Use My Location" onPress={() => {
        if (location) {
          setRegion({
            ...region,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          fetchAddressFromCoords(location.coords.latitude, location.coords.longitude);

        }
      }} color="rgb(255,191,0)', 'rgb(255,191,0)" />

      <View style={{ marginTop: 20 }}>
        {isSaving ? <ActivityIndicator size="large" color="rgb(255,191,0)', 'rgb(255,191,0)" /> : <Button title="Save Spot" onPress={saveSpot} color="rgb(255,191,0)', 'rgb(255,191,0)" />}
      </View>
    </ScrollView>
  );
}
