import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import uuid from 'react-native-uuid';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/Authcontext';

type Theme = {
  background: string;
  card: string;
  text: string;
  subText: string;
  inputText: string;
  accent: string;
  border: string;
  placeholder: string;
};

export default function AddSpotScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const [region, setRegion] = useState<Region>({
    latitude: 46.603354,
    longitude: 1.888334,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme: Theme = {
    background: isDark ? '#121212' : '#f9f9f9',
    card: isDark ? '#2c2c2e' : '#ffffff',
    text: isDark ? '#ffffff' : '#121212',
    subText: isDark ? '#aaa' : '#555',
    inputText: isDark ? '#ddd' : '#333',
    accent: '#fe9f0a',
    border: isDark ? '#333' : '#ddd',
    placeholder: isDark ? '#888' : '#999',
  };

  const { user } = useAuth();

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

      // if (!allowedCountries.includes(country)) {
      //   Alert.alert('Invalid Location', 'Spots can only be added in France, Germany, or Canada for now.');
      // }
    } catch (e) {
      console.warn('Geocoding failed:', e);
      Alert.alert('Error', 'Unable to determine your country. Please check your internet or location settings.');
    }
  })();
}, []);


 const pickImage = async () => {
  console.log("pickImage called 🚀");

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'We need access to your media to pick an image.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  console.log("Picker result:", result);

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
    <ScrollView contentContainerStyle={styles.container(theme)}>
      <View style={styles.top}>
        <TouchableOpacity onPress={() => router.replace('/home/home')} style={styles.doneWrapper}>
          <Text style={styles.donebutton(theme)}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.placeholderText(theme)}>Add New Spot</Text>
        <TouchableOpacity onPress={saveSpot} style={styles.doneWrapper}>
          <Text style={styles.donebutton(theme)}>Save</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={pickImage} style={styles.addPhotoBox(theme)}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ height: 200, width: '100%', borderRadius: 12 }} />
        ) : (
          <>
            <MaterialIcons name="add-photo-alternate" color={theme.accent} size={44} />
            <Text style={styles.addPhotoText(theme)}>Add Photo</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.helperText(theme)}>📸 Tap to add a photo of the kombucha spot</Text>

      <TextInput
        placeholder="Store Name"
        placeholderTextColor={theme.placeholder}
        value={name}
        onChangeText={setName}
        style={styles.input(theme)}
      />

      <TextInput
        placeholder="Comment (Optional)"
        placeholderTextColor={theme.placeholder}
        value={comment}
        onChangeText={setComment}
        style={styles.input1(theme)}
      />

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle(theme)}>Location</Text>
        <TouchableOpacity
          onPress={() => {
            if (location) {
              setRegion({
                ...region,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              fetchAddressFromCoords(location.coords.latitude, location.coords.longitude);
            }
          }}
        >
          <Text style={styles.sectionLink(theme)}>Use Current Location</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 13, color: theme.subText, marginBottom: 10 }}>
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

// Styles — all theme-safe, typed properly
const styles = {
  container: (theme: Theme): StyleProp<ViewStyle> => ({
    padding: 16,
    backgroundColor: theme.background,
    flexGrow: 1,
  }),
  top: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  } as ViewStyle,
  doneWrapper: {
    padding: 4,
  } as ViewStyle,
  donebutton: (theme: Theme): StyleProp<TextStyle> => ({
    fontSize: 18,
    color: theme.accent,
  }),
  placeholderText: (theme: Theme): StyleProp<TextStyle> => ({
    color: theme.text,
    fontSize: 20,
  }),
  addPhotoBox: (theme: Theme): StyleProp<ViewStyle> => ({
    height: 200,
    backgroundColor: theme.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  }),
  addPhotoText: (theme: Theme): StyleProp<TextStyle> => ({
    color: theme.subText,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  }),
  helperText: (theme: Theme): StyleProp<TextStyle> => ({
    textAlign: 'center',
    color: theme.subText,
    marginBottom: 20,
    fontSize: 13,
  }),
  input: (theme: Theme): StyleProp<TextStyle> => ({
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: theme.inputText,
  }),
  input1: (theme: Theme): StyleProp<TextStyle> => ({
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 24,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
    color: theme.inputText,
    textAlign: 'left',
  }),
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  } as ViewStyle,
  sectionTitle: (theme: Theme): StyleProp<TextStyle> => ({
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  }),
  sectionLink: (theme: Theme): StyleProp<TextStyle> => ({
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
  }),
  mapWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  } as ViewStyle,
  map: {
    height: 200,
    width: '100%',
  } as ViewStyle,
};
