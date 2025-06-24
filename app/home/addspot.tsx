import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import uuid from 'react-native-uuid';
import { supabase } from '../supabase';

export default function AddSpotScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState({
    latitude: 46.603354,
    longitude: 1.888334,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setRegion({
        ...region,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

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

    setIsSaving(true);

    try {
      let photoUrl = 'placeholder';
      if (imageUri) {
        photoUrl = await uploadImage(imageUri);
      }

      const { error } = await supabase.from('kombuspots').insert([
        {
          id: uuid.v4(),
          name,
          address: 'Selected Location',
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
        onPress={(e) => setRegion({
          ...region,
          latitude: e.nativeEvent.coordinate.latitude,
          longitude: e.nativeEvent.coordinate.longitude
        })}
        style={{ height: 200, borderRadius: 10, marginBottom: 16 }}
      >
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
      </MapView>

      <Button title="Use My Location" onPress={() => {
        if (location) {
          setRegion({
            ...region,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      }} color="#FFA500" />

      <View style={{ marginTop: 20 }}>
        {isSaving ? <ActivityIndicator size="large" color="#FFA500" /> : <Button title="Save Spot" onPress={saveSpot} color="#FFA500" />}
      </View>
    </ScrollView>
  );
}
