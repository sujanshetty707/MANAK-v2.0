import { Camera as CapCamera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface GeoLocationResult {
  lat: number;
  lng: number;
  address: string;
}

const DEFAULT_LOCATION: GeoLocationResult = {
  lat: 28.6139,
  lng: 77.2090,
  address: 'Connaught Place, New Delhi - 110001'
};

let cachedLocation: GeoLocationResult | null = null;

/**
 * Prompt native runtime permissions directly for Camera and Fine Location.
 */
export async function requestAllPermissionsDirectly(): Promise<void> {
  const isNative = Capacitor.isNativePlatform();

  // 1. Prompt Native Camera permissions if on Android / iOS
  if (isNative) {
    try {
      await CapCamera.requestPermissions({ permissions: ['camera', 'photos'] });
    } catch (e) {
      console.warn('[MANAK Permissions] Native camera permission prompt warning:', e);
    }
  }

  // 2. Prompt Geolocation permissions via HTML5 Navigator Geolocation
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            cachedLocation = {
              lat: latitude,
              lng: longitude,
              address: `GPS Geo-Tagged (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
            };
            resolve();
          },
          (err) => {
            console.warn('[MANAK Location] Geolocation prompt fallback:', err.message);
            resolve();
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
        );
      });
    } catch (e) {
      console.warn('[MANAK Location] Geolocation permission error:', e);
    }
  }
}

/**
 * Fetch current real GPS location coordinates.
 */
export async function getCurrentGeoLocation(): Promise<GeoLocationResult> {
  if (cachedLocation) return cachedLocation;

  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 30000
        });
      });

      const { latitude, longitude } = pos.coords;
      const result: GeoLocationResult = {
        lat: latitude,
        lng: longitude,
        address: `Audit Location (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`
      };
      cachedLocation = result;
      return result;
    } catch {
      // Return default location if GPS fails / permission denied
      return DEFAULT_LOCATION;
    }
  }

  return DEFAULT_LOCATION;
}
