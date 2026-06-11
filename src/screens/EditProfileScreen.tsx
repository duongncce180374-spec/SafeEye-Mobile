import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';

type EditMode = 'profile' | 'fcm';

export function EditProfileScreen({ onBack }: { onBack: () => void }) {
  const { user, updateUserProfile, updateUserFcmToken, logout } = useAuth();
  const [editMode, setEditMode] = useState<EditMode>('profile');
  const [newName, setNewName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fcmToken, setFcmToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submitProfileUpdate() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      if (!newName.trim()) {
        setError('Name cannot be empty');
        return;
      }

      const payload: Record<string, string> = { name: newName.trim() };
      if (newPassword.trim()) {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        payload.password = newPassword;
      }

      await updateUserProfile(payload.name, payload.password);
      setSuccess('Profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(onBack, 1500);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      setError(message || 'Failed to update profile.');
    } finally {
      setBusy(false);
    }
  }

  async function submitFcmToken() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      if (!fcmToken.trim()) {
        setError('FCM Token cannot be empty');
        return;
      }

      await updateUserFcmToken(fcmToken.trim());
      setSuccess('FCM token registered successfully!');
      setFcmToken('');
      setTimeout(onBack, 1500);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      setError(message || 'Failed to update FCM token.');
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => {
          void logout();
        },
        style: 'destructive',
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Edit Profile</Text>

            <View style={styles.segment}>
              <Text
                onPress={() => {
                  setEditMode('profile');
                  setError(null);
                  setSuccess(null);
                }}
                style={[styles.segmentItem, editMode === 'profile' && styles.segmentActive]}
              >
                Profile
              </Text>
              <Text
                onPress={() => {
                  setEditMode('fcm');
                  setError(null);
                  setSuccess(null);
                }}
                style={[styles.segmentItem, editMode === 'fcm' && styles.segmentActive]}
              >
                FCM Token
              </Text>
            </View>

            {editMode === 'profile' ? (
              <View style={styles.form}>
                <Text style={styles.label}>Current Email: {user?.email}</Text>
                <TextField
                  label="Name"
                  value={newName}
                  onChangeText={setNewName}
                  autoCapitalize="words"
                  placeholder={user?.name}
                />
                <TextField
                  label="New Password (optional)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Leave empty to keep current password"
                />
                <TextField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Confirm new password"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}
                <PrimaryButton
                  title={busy ? 'Updating...' : 'Save Changes'}
                  onPress={submitProfileUpdate}
                  disabled={busy}
                />
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.description}>
                  Register your Firebase Cloud Messaging token for push notifications.
                </Text>
                <TextField
                  label="FCM Token"
                  value={fcmToken}
                  onChangeText={setFcmToken}
                  placeholder="Paste your FCM token here"
                  multiline
                  numberOfLines={4}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}
                <PrimaryButton
                  title={busy ? 'Registering...' : 'Register FCM Token'}
                  onPress={submitFcmToken}
                  disabled={busy}
                />
              </View>
            )}

            <PrimaryButton title="Back to Home" onPress={onBack} disabled={busy} />
            <View style={styles.logoutSection}>
              <Text style={styles.logoutText}>Signed in as {user?.email}</Text>
              <PrimaryButton title="Logout" onPress={handleLogout} disabled={busy} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 16,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 20,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 12,
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentActive: {
    color: '#2563eb',
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    marginBottom: -1,
  },
  form: {
    gap: 12,
    marginBottom: 20,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutSection: {
    gap: 10,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  logoutText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
});
