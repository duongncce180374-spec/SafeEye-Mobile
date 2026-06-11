import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export function HomeScreen() {
  const { user, accessToken, refreshProfile } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    if (!accessToken) return;
    setLoadingProfile(true);
    try {
      await refreshProfile();
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user?.name}! 👋</Text>
          <Text style={styles.subtitle}>SafeEye Guardian System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value} numberOfLines={1}>
              {user?.id}
            </Text>
          </View>
          <PrimaryButton title="Refresh Profile" onPress={loadProfile} disabled={loadingProfile} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Tips</Text>
          <Text style={styles.tipText}>
            📍 Use the <Text style={styles.highlight}>Map View</Text> to see Guardian and IoT device
            locations
          </Text>
          <Text style={styles.tipText}>
            📱 Navigate using the menu on the <Text style={styles.highlight}>left side</Text>
          </Text>
          <Text style={styles.tipText}>
            ⚙️ Manage your devices and edit profile from the menu
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00bfff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    marginVertical: 4,
  },
  highlight: {
    color: '#00bfff',
    fontWeight: '700',
  },
});
