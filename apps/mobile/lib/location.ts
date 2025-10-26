import * as Location from 'expo-location';

export type CityLocationResult =
  | {
      kind: 'success';
      city: string | null;
      region: string | null;
      country: string | null;
      latitude: number;
      longitude: number;
    }
  | { kind: 'denied'; message: string }
  | { kind: 'error'; message: string };

export async function fetchCityLocation(): Promise<CityLocationResult> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    if (!existing.granted) {
      const requested = await Location.requestForegroundPermissionsAsync();
      if (!requested.granted) {
        return {
          kind: 'denied',
          message: 'Location permission is required to share your city with Fermi.',
        };
      }
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const [placemark] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    return {
      kind: 'success',
      city: placemark?.city ?? placemark?.subregion ?? null,
      region: placemark?.region ?? placemark?.subregion ?? null,
      country: placemark?.country ?? null,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.warn('Failed to fetch city location', error);
    return {
      kind: 'error',
      message: 'Unable to determine your location right now.',
    };
  }
}
