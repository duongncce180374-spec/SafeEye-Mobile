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
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useGuardianDevices } from '../context/GuardianDevicesContext';
import { ApiError } from '../api/client';
import type { GuardianDevice } from '../types/guardianDevices';

export function GuardianDevicesScreen({ onBack }: { onBack: () => void }) {
  const { devices, loading, error, loadDevices, addDevice, editDevice, removeDevice } =
    useGuardianDevices();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<GuardianDevice | null>(null);
  const [deviceKey, setDeviceKey] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadDevices();
  }, []);

  async function handleAddDevice() {
    if (!deviceKey.trim() || !label.trim()) {
      Alert.alert('Error', 'Device Key and Label are required');
      return;
    }

    setSubmitting(true);
    try {
      await addDevice({
        deviceKey: deviceKey.trim(),
        label: label.trim(),
      });
      setDeviceKey('');
      setLabel('');
      setShowAddModal(false);
      Alert.alert('Success', 'Device added successfully');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to add device';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditDevice() {
    if (!editingDevice || !label.trim()) {
      Alert.alert('Error', 'Label is required');
      return;
    }

    setSubmitting(true);
    try {
      await editDevice(editingDevice.id, {
        label: label.trim(),
      });
      setLabel('');
      setEditingDevice(null);
      setShowEditModal(false);
      Alert.alert('Success', 'Device updated successfully');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update device';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(device: GuardianDevice) {
    setEditingDevice(device);
    setLabel(device.label);
    setShowEditModal(true);
  }

  function handleDeleteDevice(device: GuardianDevice) {
    Alert.alert(
      'Delete Device',
      `Are you sure you want to delete "${device.label}"?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await removeDevice(device.id);
              Alert.alert('Success', 'Device deleted successfully');
            } catch (err) {
              const message =
                err instanceof ApiError
                  ? err.message
                  : err instanceof Error
                    ? err.message
                    : 'Failed to delete device';
              Alert.alert('Error', message);
            }
          },
          style: 'destructive',
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Guardian Devices</Text>
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
        keyExtractor={(item, index) => item.id || `device-${index}`}
        renderItem={({ item }) => (
          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.label}</Text>
              {item.deviceKey ? (
                <Text style={styles.deviceKey}>Device Key: {item.deviceKey.substring(0, 20)}...</Text>
              ) : null}
              <Text style={styles.deviceId}>ID: {item.id}</Text>
            </View>
            <View style={styles.deviceActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteDevice(item)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading devices...</Text>
          ) : (
            <Text style={styles.emptyText}>No devices yet. Add one to get started!</Text>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <PrimaryButton
          title="Add Device"
          onPress={() => {
            setDeviceKey('');
            setLabel('');
            setShowAddModal(true);
          }}
        />
      </View>

      {/* Add Device Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Guardian Device</Text>
            <Text style={styles.helpText}>
              Copy the Device Key from the IoT Device you want to monitor
            </Text>
            <TextField
              label="Device Key"
              value={deviceKey}
              onChangeText={setDeviceKey}
              placeholder="e.g., fdfa643e9461bf55..."
              editable={!submitting}
              multiline
              numberOfLines={2}
            />
            <TextField
              label="Label"
              value={label}
              onChangeText={setLabel}
              placeholder="e.g., Living Room"
              editable={!submitting}
            />
            <View style={styles.modalActions}>
              <PrimaryButton
                title={submitting ? 'Adding...' : 'Add Device'}
                onPress={handleAddDevice}
                disabled={submitting}
              />
              <PrimaryButton
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                disabled={submitting}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Device Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Device Label</Text>
            <TextField
              label="Label"
              value={label}
              onChangeText={setLabel}
              placeholder="Device label"
              editable={!submitting}
            />
            <View style={styles.modalActions}>
              <PrimaryButton
                title={submitting ? 'Updating...' : 'Update Device'}
                onPress={handleEditDevice}
                disabled={submitting}
              />
              <PrimaryButton
                title="Cancel"
                onPress={() => setShowEditModal(false)}
                disabled={submitting}
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
  deviceInfo: {
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  deviceKey: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  deviceId: {
    fontSize: 12,
    color: '#64748b',
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
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
    marginBottom: 12,
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
});
