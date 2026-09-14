/**
 * Anchor Live GPS Service
 * Uses HTML5 Geolocation API with Haversine formula distance calculation
 * and includes a simulated movement generator for desktop testing.
 */

// Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class GpsTracker {
  constructor() {
    this.watchId = null;
    this.coordinates = [];
    this.totalDistanceKm = 0;
    this.isTracking = false;
    this.simulatedTimer = null;
  }

  // Start tracking real hardware GPS
  start(onUpdate, onError) {
    if (this.isTracking) return;
    this.isTracking = true;
    this.coordinates = [];
    this.totalDistanceKm = 0;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (onError) onError(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const newCoord = { lat: latitude, lng: longitude, timestamp: Date.now(), speed: speed || 0 };

        if (this.coordinates.length > 0) {
          const lastCoord = this.coordinates[this.coordinates.length - 1];
          const deltaKm = calculateHaversineDistance(lastCoord.lat, lastCoord.lng, latitude, longitude);
          
          // Filter out tiny GPS jitter (< 2 meters) and impossible teleportation (> 500 meters per second)
          if (deltaKm > 0.002 && deltaKm < 0.5) {
            this.totalDistanceKm += deltaKm;
          }
        }

        this.coordinates.push(newCoord);
        if (onUpdate) {
          onUpdate({
            distanceKm: this.totalDistanceKm,
            currentCoord: newCoord,
            path: this.coordinates
          });
        }
      },
      (error) => {
        if (onError) onError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );
  }

  // Stop tracking
  stop() {
    this.isTracking = false;
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.simulatedTimer) {
      clearInterval(this.simulatedTimer);
      this.simulatedTimer = null;
    }
    return {
      distanceKm: this.totalDistanceKm,
      path: this.coordinates
    };
  }

  // Simulator for testing indoors or on desktop devices without real GPS movement
  startSimulation(onUpdate) {
    if (this.isTracking) this.stop();
    this.isTracking = true;
    this.coordinates = [];
    this.totalDistanceKm = 0;

    // Center starting point (Central Park outdoor running loop simulation)
    let curLat = 40.785091;
    let curLng = -73.968285;
    let heading = 0;

    this.coordinates.push({ lat: curLat, lng: curLng, timestamp: Date.now() });

    this.simulatedTimer = setInterval(() => {
      // Advance by ~15-20 meters every second (simulates a solid 10-12 km/h running pace)
      heading += (Math.random() - 0.5) * 0.2;
      const stepKm = 0.015 + Math.random() * 0.005; // ~15-20 meters
      
      curLat += (stepKm / 111) * Math.cos(heading);
      curLng += (stepKm / (111 * Math.cos((curLat * Math.PI) / 180))) * Math.sin(heading);

      this.totalDistanceKm += stepKm;
      const newCoord = { lat: curLat, lng: curLng, timestamp: Date.now(), speed: 3.2 };
      this.coordinates.push(newCoord);

      if (onUpdate) {
        onUpdate({
          distanceKm: this.totalDistanceKm,
          currentCoord: newCoord,
          path: this.coordinates
        });
      }
    }, 1000);
  }
}

export const gpsService = new GpsTracker();
