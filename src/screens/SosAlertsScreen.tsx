import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { useSos } from '../context/SosContext';
import type { SosAlert, SosStatus } from '../types/sos';

type FilterValue = 'all' | SosStatus;

function getAlertId(alert: SosAlert) {
  return alert.id ?? alert.sosId ?? alert.sosEventId ?? '';
}

function isResolvedStatus(status: unknown) {
  return status === 1 || status === 'Resolved' || status === 'resolved';
}

function getStatusLabel(status: unknown) {
  return isResolvedStatus(status) ? 'Resolved' : 'Active';
}

function getStatusStyle(status: unknown) {
  return isResolvedStatus(status) ? styles.statusResolved : styles.statusOpen;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatDate(value: unknown) {
  if (typeof value !== 'string') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getDisplayRows(alert: SosAlert) {
  return [
    ['ID', getAlertId(alert)],
    ['Status', getStatusLabel(alert.status)],
    ['Latitude', formatValue(alert.latitude)],
    ['Longitude', formatValue(alert.longitude)],
    ['Device ID', formatValue(alert.deviceId ?? alert.iotDeviceId)],
    ['Device Label', formatValue(alert.deviceLabel)],
    ['User ID', formatValue(alert.userId)],
    ['Created', formatDate(alert.createdAt)],
    ['Resolved', formatDate(alert.resolvedAt)],
  ];
}

export function SosAlertsScreen({ onBack }: { onBack: () => void }) {
  const {
    alerts,
    activeAlerts,
    resolvedAlerts,
    selectedAlert,
    lastRealtimeAlert,
    loading,
    resolvingId,
    connectionStatus,
    error,
    loadAlerts,
    loadAlert,
    resolveAlert,
    clearSelectedAlert,
    clearLastRealtimeAlert,
  } = useSos();
  const [filter, setFilter] = useState<FilterValue>('Active');
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    void loadCurrentFilter();
  }, [filter]);

  function loadCurrentFilter() {
    return loadAlerts(filter === 'all' ? undefined : filter);
  }

  async function openDetails(alert: SosAlert) {
    const id = getAlertId(alert);
    if (!id) {
      Alert.alert('Error', 'This SOS alert does not have an ID.');
      return;
    }

    try {
      await loadAlert(id);
      setDetailOpen(true);
    } catch (err) {
      showError(err, 'Failed to load SOS alert');
    }
  }

  function handleResolve(alert: SosAlert) {
    const id = getAlertId(alert);
    if (!id) {
      Alert.alert('Error', 'This SOS alert does not have an ID.');
      return;
    }

    Alert.alert('Resolve SOS', 'Mark this SOS alert as resolved?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Resolve',
        onPress: async () => {
          try {
            await resolveAlert(id);
            await loadCurrentFilter();
            Alert.alert('Success', 'SOS alert resolved.');
          } catch (err) {
            showError(err, 'Failed to resolve SOS alert');
          }
        },
      },
    ]);
  }

  function showError(err: unknown, fallback: string) {
    const message =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
    Alert.alert('Error', message);
  }

  const detailAlert = selectedAlert;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SOS Alerts</Text>
          <Text style={styles.connectionText}>Realtime: {connectionStatus}</Text>
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
      </View>

      {lastRealtimeAlert ? (
        <TouchableOpacity
          style={styles.realtimeBanner}
          onPress={() => {
            clearLastRealtimeAlert();
            setDetailOpen(true);
          }}
        >
          <Text style={styles.realtimeTitle}>New SOS alert received</Text>
          <Text style={styles.realtimeText}>
            {formatValue(lastRealtimeAlert.deviceLabel ?? lastRealtimeAlert.deviceId)} at{' '}
            {formatValue(lastRealtimeAlert.latitude)}, {formatValue(lastRealtimeAlert.longitude)}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Active: {activeAlerts.length}</Text>
        <Text style={styles.summaryText}>Resolved: {resolvedAlerts.length}</Text>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'Active' && styles.filterActive]}
          onPress={() => setFilter('Active')}
        >
          <Text style={[styles.filterText, filter === 'Active' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'Resolved' && styles.filterActive]}
          onPress={() => setFilter('Resolved')}
        >
          <Text style={[styles.filterText, filter === 'Resolved' && styles.filterTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={alerts}
        keyExtractor={(item, index) => getAlertId(item) || `sos-${index}`}
        renderItem={({ item }) => {
          const id = getAlertId(item);
          const isResolved = isResolvedStatus(item.status);
          const isResolving = resolvingId === id;

          return (
            <View style={styles.alertCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.alertTitle}>SOS Alert</Text>
                <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>

              <Text style={styles.alertId} numberOfLines={1}>
                ID: {id || '-'}
              </Text>
              <Text style={styles.alertMeta}>
                Location: {formatValue(item.latitude)}, {formatValue(item.longitude)}
              </Text>
              <Text style={styles.alertMeta}>Created: {formatDate(item.createdAt)}</Text>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => openDetails(item)}>
                  <Text style={styles.secondaryButtonText}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resolveButton, (isResolved || isResolving) && styles.disabledButton]}
                  onPress={() => handleResolve(item)}
                  disabled={isResolved || isResolving}
                >
                  <Text style={styles.actionButtonText}>
                    {isResolving ? 'Resolving...' : isResolved ? 'Resolved' : 'Resolve'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.emptyText}>Loading SOS alerts...</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No SOS alerts found.</Text>
          )
        }
        refreshing={loading}
        onRefresh={loadCurrentFilter}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <PrimaryButton
          title={loading ? 'Refreshing...' : 'Refresh'}
          onPress={loadCurrentFilter}
          disabled={loading}
        />
      </View>

      <Modal visible={detailOpen} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SOS Details</Text>
            {detailAlert ? (
              <View style={styles.detailRows}>
                {getDisplayRows(detailAlert).map(([label, value]) => (
                  <View style={styles.detailRow} key={label}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailValue}>{value}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.modalActions}>
              {detailAlert && !isResolvedStatus(detailAlert.status) ? (
                <PrimaryButton
                  title={resolvingId ? 'Resolving...' : 'Resolve'}
                  onPress={() => handleResolve(detailAlert)}
                  disabled={Boolean(resolvingId)}
                />
              ) : null}
              <PrimaryButton
                title="Close"
                onPress={() => {
                  setDetailOpen(false);
                  clearSelectedAlert();
                }}
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
  connectionText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  realtimeBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  realtimeTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  realtimeText: {
    color: '#fecaca',
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#ffffff',
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
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  alertCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
  },
  statusOpen: {
    backgroundColor: '#dc2626',
  },
  statusResolved: {
    backgroundColor: '#16a34a',
  },
  alertId: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  alertMeta: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  resolveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#dc2626',
  },
  disabledButton: {
    backgroundColor: '#64748b',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  detailRows: {
    gap: 10,
  },
  detailRow: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#f8fafc',
    fontSize: 14,
  },
  modalActions: {
    gap: 12,
  },
});
