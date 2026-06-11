import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
}

interface SideMenuProps {
  items: MenuItem[];
  activeItem: string;
  onSelectItem: (id: string) => void;
  userEmail?: string;
}

export function SideMenu({ items, activeItem, onSelectItem }: SideMenuProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = activeItem === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, active && styles.menuItemActive]}
            onPress={() => onSelectItem(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={active ? '#00bfff' : '#94a3b8'}
            />
            <Text style={[styles.menuItemText, active && styles.menuItemTextActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 10,
  },
  menuItem: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  menuItemActive: {
    backgroundColor: '#0f172a',
  },
  menuItemText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuItemTextActive: {
    color: '#00bfff',
    fontWeight: '800',
  },
});
