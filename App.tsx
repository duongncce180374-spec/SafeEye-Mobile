import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GuardianDevicesProvider } from './src/context/GuardianDevicesContext';
import { IoTProvider } from './src/context/IoTContext';
import { SosProvider } from './src/context/SosContext';
import { useGuardianDevices } from './src/context/GuardianDevicesContext';
import { useIoT } from './src/context/IoTContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { GuardianDevicesScreen } from './src/screens/GuardianDevicesScreen';
import { IoTDevicesScreen } from './src/screens/IoTDevicesScreen';
import { SosAlertsScreen } from './src/screens/SosAlertsScreen';
import { MainLayout } from './src/components/MainLayout';

type Screen = 'home' | 'devices' | 'iot' | 'sos' | 'profile';

function Root() {
  const { ready, isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const { devices: guardianDevices, loadDevices: loadGuardianDevices } = useGuardianDevices();
  const { devices: iotDevices, loadDevices: loadIoTDevices } = useIoT();

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadGuardianDevices().catch(() => {});
    void loadIoTDevices().catch(() => {});
  }, [isAuthenticated, loadGuardianDevices, loadIoTDevices]);

  const mapDevices = useMemo(
    () =>
      (guardianDevices ?? []).map((device) => ({
        id: device.id,
        name: device.label,
      })),
    [guardianDevices],
  );

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading SafeEye...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (currentScreen) {
      case 'home':
        {
          const { MapScreen } = require('./src/screens/MapScreen');
          return <MapScreen devices={mapDevices} showUserLocation={true} />;
        }
      case 'devices':
        return <GuardianDevicesScreen onBack={() => setCurrentScreen('home')} />;
      case 'iot':
        return <IoTDevicesScreen onBack={() => setCurrentScreen('home')} />;
      case 'sos':
        return <SosAlertsScreen onBack={() => setCurrentScreen('home')} />;
      case 'profile':
        return <EditProfileScreen onBack={() => setCurrentScreen('home')} />;
      default:
        {
          const { MapScreen } = require('./src/screens/MapScreen');
          return <MapScreen devices={mapDevices} showUserLocation={true} />;
        }
    }
  };

  return (
    <MainLayout currentScreen={currentScreen} onScreenChange={setCurrentScreen}>
      {renderContent()}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GuardianDevicesProvider>
        <IoTProvider>
          <SosProvider>
            <StatusBar style="light" />
            <Root />
          </SosProvider>
        </IoTProvider>
      </GuardianDevicesProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    gap: 12,
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: 16,
  },
});
