import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SideMenu, MenuItem } from './SideMenu';
import { useAuth } from '../context/AuthContext';

type ScreenType = 'home' | 'devices' | 'iot' | 'sos' | 'profile';

interface MainLayoutProps {
  currentScreen: ScreenType;
  onScreenChange: (screen: ScreenType) => void;
  children: ReactNode;
}

export function MainLayout({ currentScreen, onScreenChange, children }: MainLayoutProps) {
  const { user } = useAuth();

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Map', icon: 'map-outline' },
    { id: 'devices', label: 'Guardian', icon: 'phone-portrait-outline' },
    { id: 'iot', label: 'IoT', icon: 'hardware-chip-outline' },
    { id: 'sos', label: 'SOS', icon: 'alert-circle-outline' },
    { id: 'profile', label: 'Profile', icon: 'person-outline' },
  ];

  const handleMenuSelect = (id: string) => {
    onScreenChange(id as ScreenType);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      <SideMenu
        items={menuItems}
        activeItem={currentScreen}
        onSelectItem={handleMenuSelect}
        userEmail={user?.email}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
