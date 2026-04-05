import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography: Record<string, TextStyle> = {
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subheading: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  button: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: 1 },
};
