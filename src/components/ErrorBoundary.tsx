import React from 'react';
import { Alert, View, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../ui/Button';
import { LogoMark } from '../ui/Logo';
import { Text } from '../ui/Text';
import { color, space } from '../ui/tokens';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  retries: number;
}

/**
 * Persisted state that a crash loop most often comes from — a half-written session
 * or a store whose shape changed. Cleared only when the user asks, after retrying
 * has visibly failed. Profile and progress (`@gruntz_user`) are NOT in this list:
 * they hold the work, and are the last thing we would throw away.
 */
const RECOVERABLE_KEYS = [
  '@gruntz_session',
  '@gruntz_chrome',
  '@gruntz_onboarding_draft',
  '@gruntz_readiness',
];

/** Retries past this point are clearly not going to work. */
const RETRY_LIMIT = 2;

/**
 * App-root error boundary. Catches render/effect errors anywhere below and
 * shows a non-white-screen fallback with a "Try again" reset. In dev the
 * error message is shown; in production we keep it generic.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, retries: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error } as State;
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  reset = () => this.setState((prev) => ({ error: null, retries: prev.retries + 1 }));

  /**
   * The way out of a crash loop. Re-rendering the same corrupt state just crashes
   * again, so once retrying has failed twice we offer to drop the transient state
   * that most often causes it. The workout history and profile are left alone.
   */
  clearSavedState = () => {
    Alert.alert(
      'Reset saved app state?',
      'This clears your in-progress workout and app settings. Your profile, history and progress are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void AsyncStorage.multiRemove(RECOVERABLE_KEYS)
              .catch(() => undefined)
              .finally(() => this.setState({ error: null, retries: 0 }));
          },
        },
      ],
    );
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root}>
        <LogoMark size={56} style={{ marginBottom: space.xl, opacity: 0.9 }} />
        <Text variant="title" align="center" style={styles.title}>Something went wrong</Text>
        <Text variant="callout" tone="secondary" align="center" style={styles.body}>
          {this.state.retries >= RETRY_LIMIT
            ? 'Gruntz keeps hitting the same error, so trying again will not clear it. Resetting the saved app state usually does. Your profile, history and progress are kept.'
            : 'Gruntz hit an unexpected error. Your data is safe. Tap the button below to try again, or restart the app.'}
        </Text>
        {__DEV__ ? (
          <Text style={styles.devError}>{this.state.error.message}</Text>
        ) : null}
        {this.state.retries >= RETRY_LIMIT ? (
          <>
            <Button title="Reset saved app state" onPress={this.clearSavedState} style={styles.button} />
            <Button title="Try again anyway" variant="outline" onPress={this.reset} style={styles.button} />
          </>
        ) : (
          <Button title="Try again" onPress={this.reset} style={styles.button} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl },
  title: { fontSize: 24, marginBottom: space.sm },
  body: { marginBottom: space.xl },
  devError: {
    fontSize: 12,
    color: color.danger,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginBottom: space.xl,
    textAlign: 'center',
  },
  button: { alignSelf: 'stretch' },
});
