/**
 * One-shot GPS for optional quest unlocks.
 *
 * We never watch the phone. Ask once, then stop. Missions without
 * coordinates ignore this. If permission is denied, the mission still
 * offers “We’re here”.
 */

export function haversineMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function locateOnce() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ error: "no-gps" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => resolve({ error: error.code === 1 ? "denied" : "failed" }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
    );
  });
}

export function gpsGate(mission, here) {
  const spot = mission.location;
  if (!spot) return "open";
  const nearby = spot.nearbyMeters || spot.radiusMeters || 500;
  const unlock = spot.unlockMeters || spot.radiusMeters || 200;
  if (!here || here.error) return "unknown";
  const meters = haversineMeters(here, spot);
  if (meters <= unlock) return "unlocked";
  if (meters <= nearby) return "nearby";
  return "locked";
}
