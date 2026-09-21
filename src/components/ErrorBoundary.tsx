import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button } from '../ui/Button';
import { LogoMark } from '../ui/Logo';
import { Text } from '../ui/Text';
import { color, space } from '../ui/tokens';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-root error boundary. Catches render/effect errors anywhere below and
 * shows a non-white-screen fallback with a "Try again" reset. In dev the
 * error message is shown; in production we keep it generic.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root}>
        <LogoMark size={56} style={{ marginBottom: space.xl, opacity: 0.9 }} />
        <Text variant="title" align="center" style={styles.title}>Something went wrong</Text>
        <Text variant="callout" tone="secondary" align="center" style={styles.body}>
          Gruntz hit an unexpected error. Your data is safe. Tap the button below to try again, or restart the app.
        </Text>
        {__DEV__ ? (
          <Text style={styles.devError}>{this.state.error.message}</Text>
        ) : null}
        <Button title="Try again" onPress={this.reset} style={styles.button} />
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
