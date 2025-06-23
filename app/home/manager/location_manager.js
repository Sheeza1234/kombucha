import * as Location from 'expo-location';

class LocationManager {
  location = null;
  isLocationEnabled = false;
  authorizationStatus = 'not_determined';

  listeners = new Set();

  constructor() {
    this.init();
  }

  async init() {
    console.log('📍 Initializing LocationManager...');
    await this.updatePermissionStatus();
  }

  async updatePermissionStatus() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.authorizationStatus = status;
      this.isLocationEnabled = status === 'granted';

      console.log(`📍 Location permission status: ${status}`);
    } catch (error) {
      console.error('❌ Failed to check permission', error);
    }
  }

  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.authorizationStatus = status;
      this.isLocationEnabled = status === 'granted';

      console.log(`📍 Permission request result: ${status}`);

      if (this.isLocationEnabled) {
        this.getCurrentLocation();
      } else {
        this.setDefaultLocation();
      }
    } catch (err) {
      console.error('❌ Request permission failed:', err);
    }
  }

  async getCurrentLocation() {
    console.log('📍 Requesting current location...');
    if (!this.isLocationEnabled) {
      console.warn('⚠️ Location services disabled');
      this.setDefaultLocation();
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.location = location.coords;
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Location error:', error.message);
      this.setDefaultLocation();
    }
  }

  setDefaultLocation() {
    console.warn('📍 Using default location (Paris)');
    this.location = {
      latitude: 48.8566,
      longitude: 2.3522,
    };
    this.notifyListeners();
  }

  onLocationChange(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.location);
    }
  }
}

export default new LocationManager();
