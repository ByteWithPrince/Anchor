/**
 * Anchor Live GPS Service
 * Uses HTML5 Geolocation API with Haversine formula distance calculation and
 * strict stationary jitter / GPS drift filtering for realistic outdoor tracking.
 */

// Haversine formula to compute distance between two coordinates in kilometers
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
    this.lastAcceptedPoint = null;
    this.lastAcceptedTime = null;
    this.currentSpeed = 0;
  }

  // Start tracking real physical GPS
  start(onUpdate, onError) {
    if (this.isTracking) return;
    this.isTracking = true;
    this.coordinates = [];
    this.totalDistanceKm = 0;
    this.lastAcceptedPoint = null;
    this.lastAcceptedTime = null;
    this.currentSpeed = 0;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (onError) onError(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const now = position.timestamp || Date.now();

        // 1. Accuracy Filter: Ignore fixes with low accuracy > 30 meters (e.g. indoor multipath drift)
        if (accuracy && accuracy > 30) {
          if (onUpdate) {
            onUpdate({
              distanceKm: this.totalDistanceKm,
              currentCoord: { lat: latitude, lng: longitude, speed: 0, accuracy },
              path: this.coordinates,
              isStationary: true,
              accuracy,
              speed: 0
            });
          }
          return;
        }

        const newPoint = { lat: latitude, lng: longitude, timestamp: now, accuracy };

        // Initial GPS fix acquisition
        if (!this.lastAcceptedPoint) {
          this.lastAcceptedPoint = newPoint;
          this.lastAcceptedTime = now;
          this.coordinates.push(newPoint);
          if (onUpdate) {
            onUpdate({
              distanceKm: 0,
              currentCoord: newPoint,
              path: this.coordinates,
              isStationary: true,
              accuracy,
              speed: 0
            });
          }
          return;
        }

        // 2. Stationary & Micro-Movement Drift Filter
        const deltaKm = calculateHaversineDistance(
          this.lastAcceptedPoint.lat,
          this.lastAcceptedPoint.lng,
          latitude,
          longitude
        );
        const deltaMeters = deltaKm * 1000;
        const timeDeltaSec = Math.max(0.5, (now - this.lastAcceptedTime) / 1000);
        
        // Instantaneous speed in m/s: use device hardware speed if valid, otherwise compute from delta
        const calculatedSpeed = speed !== null && speed !== undefined && speed >= 0
          ? speed
          : deltaMeters / timeDeltaSec;

        this.currentSpeed = calculatedSpeed;

        // Ignore micro-movements: delta < 3 meters (0.003 km) OR speed < 0.5 m/s (~1.8 km/h, stationary idle)
        // Also reject impossible teleportation jumps (> 500 meters or > 35 m/s / 126 km/h)
        const isJitter = deltaMeters < 3 || calculatedSpeed < 0.5;
        const isTeleportation = deltaMeters > 500 || calculatedSpeed > 35;

        if (!isJitter && !isTeleportation) {
          this.totalDistanceKm += deltaKm;
          this.lastAcceptedPoint = newPoint;
          this.lastAcceptedTime = now;
          this.coordinates.push(newPoint);
        }

        if (onUpdate) {
          onUpdate({
            distanceKm: Number(this.totalDistanceKm.toFixed(3)),
            currentCoord: newPoint,
            path: this.coordinates,
            isStationary: isJitter,
            accuracy,
            speed: this.currentSpeed
          });
        }
      },
      (error) => {
        if (onError) onError(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  }

  // Stop tracking and clear hardware watch
  stop() {
    this.isTracking = false;
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    return {
      distanceKm: this.totalDistanceKm,
      path: this.coordinates
    };
  }
}

export const gpsService = new GpsTracker();
