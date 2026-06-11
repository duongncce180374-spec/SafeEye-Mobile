import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { useSos } from '../context/SosContext';
import type { SosAlert } from '../types/sos';

interface Device {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

interface MapScreenProps {
  devices: Device[];
  showUserLocation?: boolean;
}

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MapPoint = {
  id: string;
  kind: 'user' | 'device' | 'sos';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  color: string;
};

function getAlertId(alert: SosAlert) {
  return alert.id ?? alert.sosId ?? alert.sosEventId ?? '';
}

function getAlertCoordinate(alert: SosAlert): Coordinate | null {
  return typeof alert.latitude === 'number' && typeof alert.longitude === 'number'
    ? { latitude: alert.latitude, longitude: alert.longitude }
    : null;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMapHtml(points: MapPoint[], center: MapPoint) {
  const pointsJson = JSON.stringify(points);
  const centerJson = JSON.stringify(center);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      margin: 0;
      width: 100%;
      height: 100%;
      background: #0f172a;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .leaflet-container {
      background: #0f172a;
    }
    .panel {
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 10px;
      z-index: 1000;
      max-height: 34%;
      overflow: auto;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(51, 65, 85, 0.9);
      border-radius: 10px;
      padding: 10px;
      box-sizing: border-box;
    }
    .panel-title {
      color: #f8fafc;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .sub {
      color: #94a3b8;
      font-size: 11px;
      margin-bottom: 8px;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      gap: 8px;
      padding: 7px 0;
      border-top: 1px solid rgba(51, 65, 85, 0.7);
    }
    li:first-child {
      border-top: 0;
      padding-top: 0;
    }
    .dot {
      width: 11px;
      height: 11px;
      border-radius: 999px;
      margin-top: 4px;
      flex: 0 0 auto;
    }
    strong {
      display: block;
      color: #f8fafc;
      font-size: 12px;
      line-height: 1.35;
    }
    small {
      display: block;
      color: #cbd5e1;
      font-size: 11px;
      line-height: 1.35;
    }
    .attribution {
      position: absolute;
      right: 8px;
      bottom: 8px;
      z-index: 999;
      background: rgba(15, 23, 42, 0.75);
      color: #cbd5e1;
      font-size: 10px;
      padding: 4px 6px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="panel">
    <div class="panel-title">Coordinates</div>
    <div class="sub">Red = SOS, blue = you, pink = device</div>
    <ul id="coords"></ul>
  </div>
  <div class="attribution">© OpenStreetMap contributors</div>
  <script>
    const points = ${pointsJson};
    const center = ${centerJson};
    const map = L.map('map', { zoomControl: true });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    function esc(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function addPoint(point) {
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: point.kind === 'sos' ? 10 : 8,
        color: point.color,
        fillColor: point.color,
        fillOpacity: 0.92,
        weight: 2,
      }).addTo(map);

      marker.bindPopup(
        '<div style="min-width:160px">' +
          '<strong style="display:block;font-size:14px;margin-bottom:4px;color:#0f172a">' + esc(point.title) + '</strong>' +
          '<small style="display:block;font-size:12px;color:#475569;line-height:1.4">' + esc(point.description) + '</small>' +
          '<small style="display:block;font-size:12px;color:#475569;line-height:1.4;margin-top:4px">' +
            point.latitude.toFixed(6) + ', ' + point.longitude.toFixed(6) +
          '</small>' +
        '</div>'
      );
    }

    points.forEach(addPoint);

    const bounds = points.map((point) => [point.latitude, point.longitude]);
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
      if (map.getZoom() > 17) {
        map.setZoom(17);
      }
    } else {
      map.setView([center.latitude, center.longitude], 11);
    }

    const coords = document.getElementById('coords');
    coords.innerHTML = points.map((point) => (
      '<li>' +
        '<span class="dot" style="background:' + point.color + '"></span>' +
        '<div>' +
          '<strong>' + esc(point.title) + '</strong>' +
          '<small>' + esc(point.description) + '</small>' +
          '<small>' + point.latitude.toFixed(6) + ', ' + point.longitude.toFixed(6) + '</small>' +
        '</div>' +
      '</li>'
    )).join('');
  </script>
</body>
</html>`;
}

export function MapScreen({ devices, showUserLocation = true }: MapScreenProps) {
  const { user } = useAuth();
  const { activeAlerts, selectedAlert, lastRealtimeAlert } = useSos();
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        setError('Location permission denied');
      }
    } catch {
      setError('Current location is unavailable. Showing tracked SOS/device locations only.');
    } finally {
      setLoading(false);
    }
  }

  const mapPoints = useMemo<MapPoint[]>(() => {
    const userPoint =
      userLocation && showUserLocation
        ? [
            {
              id: 'user',
              kind: 'user' as const,
              title: user?.name || 'Your Location',
              description: 'Current user location',
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              color: '#2563eb',
            },
          ]
        : [];

    const devicePoints = devices.flatMap((device) =>
      device.latitude !== undefined && device.longitude !== undefined
        ? [
            {
              id: device.id,
              kind: 'device' as const,
              title: device.name,
              description: 'Guardian Device',
              latitude: device.latitude,
              longitude: device.longitude,
              color: '#fb7185',
            },
          ]
        : [],
    );

    const sosPoints = activeAlerts.flatMap((alert) => {
      const coordinate = getAlertCoordinate(alert);
      if (!coordinate) return [];
      const id = getAlertId(alert);
      return [
        {
          id: `sos-${id || `${coordinate.latitude}-${coordinate.longitude}`}`,
          kind: 'sos' as const,
          title: alert.deviceLabel ? `SOS: ${alert.deviceLabel}` : 'SOS Alert',
          description: `Device: ${alert.deviceId ?? '-'} | SOS: ${id || '-'}`,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          color: '#dc2626',
        },
      ];
    });

    return [...userPoint, ...devicePoints, ...sosPoints];
  }, [activeAlerts, devices, showUserLocation, user?.name, userLocation]);

  const targetPoint = useMemo<MapPoint>(() => {
    const realtimeCoordinate = lastRealtimeAlert ? getAlertCoordinate(lastRealtimeAlert) : null;
    if (lastRealtimeAlert && realtimeCoordinate) {
      return {
        id: `sos-${getAlertId(lastRealtimeAlert)}`,
        kind: 'sos',
        title: lastRealtimeAlert.deviceLabel ? `SOS: ${lastRealtimeAlert.deviceLabel}` : 'SOS Alert',
        description: `Device: ${lastRealtimeAlert.deviceId ?? '-'}`,
        latitude: realtimeCoordinate.latitude,
        longitude: realtimeCoordinate.longitude,
        color: '#dc2626',
      };
    }

    const firstSos = mapPoints.find((point) => point.kind === 'sos');
    if (firstSos) return firstSos;

    const userPoint = mapPoints.find((point) => point.kind === 'user');
    if (userPoint) return userPoint;

    return {
      id: 'default-hanoi',
      kind: 'user',
      title: 'Default Location',
      description: 'Hanoi',
      latitude: 21.0285,
      longitude: 105.8542,
      color: '#2563eb',
    };
  }, [lastRealtimeAlert, mapPoints]);

  const html = useMemo(() => buildMapHtml(mapPoints, targetPoint), [mapPoints, targetPoint]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00bfff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        style={styles.map}
      />

      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>Map Status</Text>
        <Text style={styles.infoText}>You: {userLocation ? 1 : 0}</Text>
        <Text style={styles.infoText}>Devices: {devices.filter((d) => d.latitude).length}</Text>
        <Text style={styles.infoText}>Active SOS: {activeAlerts.length}</Text>
        <Text style={styles.infoText}>
          Lat/Lng: {targetPoint.latitude.toFixed(6)}, {targetPoint.longitude.toFixed(6)}
        </Text>
        <Text style={styles.attribution}>OSM overlay map</Text>
      </View>

      {error ? (
        <View style={styles.locationWarning}>
          <Text style={styles.locationWarningText}>{error}</Text>
        </View>
      ) : null}

      {(lastRealtimeAlert || selectedAlert) && (
        <View style={styles.sosPanel}>
          <Text style={styles.sosTitle}>Active SOS</Text>
          <Text style={styles.sosText}>
            Device: {(lastRealtimeAlert ?? selectedAlert)?.deviceLabel ??
              (lastRealtimeAlert ?? selectedAlert)?.deviceId ??
              '-'}
          </Text>
          <Text style={styles.sosText}>
            Location: {(lastRealtimeAlert ?? selectedAlert)?.latitude ?? '-'},{' '}
            {(lastRealtimeAlert ?? selectedAlert)?.longitude ?? '-'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    color: '#00bfff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginVertical: 2,
  },
  attribution: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 6,
  },
  sosPanel: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 20,
    backgroundColor: 'rgba(127, 29, 29, 0.95)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  sosTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  sosText: {
    color: '#fecaca',
    fontSize: 12,
    marginVertical: 1,
  },
  locationWarning: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  locationWarningText: {
    color: '#fef3c7',
    fontSize: 12,
    textAlign: 'center',
  },
});
