import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, getApiBaseUrl } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  async function submit() {
    setBusy(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      setError(message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>SafeEye</Text>
            <Text style={styles.subtitle}>Guardian access</Text>
            <Text style={styles.apiUrl}>API: {getApiBaseUrl()}</Text>

            <View style={styles.segment}>
              <Text
                onPress={() => setMode('login')}
                style={[styles.segmentItem, mode === 'login' && styles.segmentActive]}
              >
                Login
              </Text>
              <Text
                onPress={() => setMode('register')}
                style={[styles.segmentItem, mode === 'register' && styles.segmentActive]}
              >
                Register
              </Text>
            </View>

            <View style={styles.form}>
              {mode === 'register' ? (
                <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
              ) : null}
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                title={busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
                onPress={submit}
                disabled={busy}
              />
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
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    gap: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  apiUrl: {
    color: '#64748b',
    fontSize: 12,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#e2e8f0',
    padding: 4,
    borderRadius: 12,
  },
  segmentItem: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    fontWeight: '700',
    color: '#475569',
    overflow: 'hidden',
  },
  segmentActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  form: {
    gap: 14,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
  },
});
