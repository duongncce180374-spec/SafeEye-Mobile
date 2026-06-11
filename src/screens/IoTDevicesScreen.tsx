import { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Alert,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useIoT } from '../context/IoTContext';
import { ApiError } from '../api/client';

export function IoTDevicesScreen({ onBack }: { onBack: () => void }) {
  const { devices, loading, error, sosTriggering, loadDevices, registerDevice, triggerSosAlert } =
    useIoT();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [label, setLabel] = useState('');
  const [firebaseDeviceKey, setFirebaseDeviceKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSosDialog, setShowSosDialog] = useState(false);

  useEffect(() => {
    void loadDevices();
  }, []);

  async function handleRegisterDevice() {
    if (!label.trim() || !firebaseDeviceKey.trim()) {
      Alert.alert('Error', 'Label and Firebase Device Key are required');
      return;
    }

    setSubmitting(true);
    try {
      await registerDevice({
        label: label.trim(),
        firebaseDeviceKey: firebaseDeviceKey.trim(),
      });
      setLabel('');
      setFirebaseDeviceKey('');
      setShowRegisterModal(false);
      Alert.alert('Success', 'IoT device registered successfully');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to register device';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTriggerSos() {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location permission is required to send SOS');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      Alert.alert(
        'Trigger SOS Alert',
        `Send SOS alert from location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}?`,
        [
          { text: 'Cancel', onPress: () => {} },
          {
            text: 'Send SOS',
            onPress: async () => {
              try {
                await triggerSosAlert({
                  latitude,
                  longitude,
                });
                setShowSosDialog(false);
                Alert.alert('Success', 'SOS alert triggered successfully');
              } catch (err) {
                const message =
                  err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : 'Failed to trigger SOS';
                Alert.alert('Error', message);
              }
            },
            style: 'destructive',
          },
        ],
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>IoT Devices</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.deviceCard}>
            <Text style={styles.deviceName}>{item.label}</Text>
            <View style={styles.deviceDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Device ID</Text>
                <Text style={styles.detailValue}>{item.id}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Device Key</Text>
                <Text style={styles.detailValueSmall}>{item.deviceKey.substring(0, 16)}...</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Firebase Key</Text>
                <Text style={styles.detailValue}>{item.firebaseDeviceKey}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Guardians</Text>
                <Text style={styles.detailValue}>{item.guardianCount}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading devices...</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No IoT devices yet. Register one to get started!</Text>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <PrimaryButton
          title={sosTriggering ? 'Sending SOS...' : '🚨 SEND SOS ALERT'}
          onPress={handleTriggerSos}
          disabled={sosTriggering || !devices || devices.length === 0}
        />
        <PrimaryButton
          title="Register Device"
          onPress={() => {
            setLabel('');
            setFirebaseDeviceKey('');
            setShowRegisterModal(true);
          }}
        />
      </View>

      {/* Register Device Modal */}
      <Modal visible={showRegisterModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register IoT Device</Text>
            <TextField
              label="Label"
              value={label}
              onChangeText={setLabel}
              placeholder="e.g., Living Room"
              editable={!submitting}
            />
            <TextField
              label="Firebase Device Key"
              value={firebaseDeviceKey}
              onChangeText={setFirebaseDeviceKey}
              placeholder="e.g., device1"
              editable={!submitting}
            />
            <Text style={styles.helpText}>
              The Firebase Device Key is used to identify your device in Firebase Realtime Database
            </Text>
            <View style={styles.modalActions}>
              <PrimaryButton
                title={submitting ? 'Registering...' : 'Register Device'}
                onPress={handleRegisterDevice}
                disabled={submitting}
              />
              <PrimaryButton
                title="Cancel"
                onPress={() => setShowRegisterModal(false)}
                disabled={submitting}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* SOS Confirmation Dialog */}
      <Modal visible={showSosDialog} transparent animationType="fade">
        <SafeAreaView style={styles.sosOverlay}>
          <View style={styles.sosDialog}>
            <Text style={styles.sosTitle}>🚨 SOS ALERT</Text>
            <Text style={styles.sosDescription}>
              This will send an emergency alert with your current location to all guardians.
            </Text>
            <View style={styles.sosActions}>
              <PrimaryButton
                title="Send SOS"
                onPress={handleTriggerSos}
                disabled={sosTriggering}
              />
              <PrimaryButton
                title="Cancel"
                onPress={() => setShowSosDialog(false)}
                disabled={sosTriggering}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    gap: 12,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  deviceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  deviceDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
    textAlign: 'right',
  },
  detailValueSmall: {
    fontSize: 12,
    color: '#cbd5e1',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: -8,
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  sosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosDialog: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  sosTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ef4444',
    textAlign: 'center',
  },
  sosDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
  },
  sosActions: {
    gap: 12,
    marginTop: 8,
  },
});
