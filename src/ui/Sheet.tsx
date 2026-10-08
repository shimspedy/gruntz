import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { navigationRef } from '../navigation/ref';
import type { RootStackParamList } from '../types/navigation';
import { Text } from './Text';
import { color, space } from './tokens';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Hide the hairline under the title (for sheets whose first row is a hero). */
  plainHeader?: boolean;
  /** Fired once the sheet has gone. */
  onDismissed?: () => void;
  /** Kept for callers; the system sheet moves itself clear of the keyboard. */
  avoidKeyboard?: boolean;
  /**
   * For a body that can be taller than the screen: the sheet opens tall and the body
   * scrolls inside it, instead of sizing itself to content it cannot fit.
   */
  scrollable?: boolean;
  /** Kept for callers; a system sheet already hands drags inside a scroll view to the scroll view. */
  dragHandleOnly?: boolean;
}

type Entry = Pick<SheetProps, 'title' | 'children' | 'plainHeader' | 'onClose' | 'onDismissed'>;

/**
 * What each open sheet is showing. The sheet itself is a navigator route (so it can be
 * a real system sheet), but its content still belongs to whoever rendered `<Sheet>`:
 * that component publishes its children here on every render and the route draws them.
 */
const useSheets = create<{ entries: Record<string, Entry> }>(() => ({ entries: {} }));

const publish = (id: string, entry: Entry) => useSheets.setState((s) => ({ entries: { ...s.entries, [id]: entry } }));
const retract = (id: string) =>
  useSheets.setState((s) => {
    if (!(id in s.entries)) return s;
    const { [id]: _gone, ...entries } = s.entries;
    return { entries };
  });

let nextId = 0;

/**
 * Bottom sheet, presented as the platform's own form sheet: system grabber, detents, drag
 * to dismiss, and keyboard handling come from the OS rather than being rebuilt here.
 * Short interruptions only — anything with steps is a modal route instead.
 *
 * Renders nothing in place. While `visible`, a `Sheet` route is on the stack showing
 * these children; closing it from either side (the caller, or a drag) keeps both in step.
 */
export function Sheet({ visible, onClose, title, children, plainHeader, onDismissed, scrollable }: SheetProps) {
  const id = useRef(`sheet-${++nextId}`).current;

  // Every render while open, so the route always draws the caller's latest closure.
  useEffect(() => {
    if (visible) publish(id, { title, children, plainHeader, onClose, onDismissed });
  });

  useEffect(() => {
    if (!visible || !navigationRef.isReady()) return undefined;
    navigationRef.navigate('Sheet', { id, scroll: !!scrollable });
    return () => {
      // Retract first: the route calls `onClose` when it goes away with content still
      // published, which is how a drag-dismiss reaches the caller. A close that started
      // with the caller must not echo back.
      retract(id);
      const top = navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined;
      if (top?.name === 'Sheet' && (top.params as { id?: string } | undefined)?.id === id) navigationRef.goBack();
    };
  }, [visible, id, scrollable]);

  return null;
}

/** The route behind every `<Sheet>`. Registered once in the root stack as a form sheet. */
export function SheetScreen({ route }: NativeStackScreenProps<RootStackParamList, 'Sheet'>) {
  const { id, scroll } = route.params;
  const insets = useSafeAreaInsets();
  const entry = useSheets((s) => s.entries[id]);
  const latest = useRef(entry);
  if (entry) latest.current = entry;

  useEffect(
    () => () => {
      // Still published means the sheet was dismissed by the user, not by its owner.
      const open = useSheets.getState().entries[id];
      retract(id);
      open?.onClose();
      (open ?? latest.current)?.onDismissed?.();
    },
    [id],
  );

  const shown = entry ?? latest.current;
  if (!shown) return <View style={styles.sheet} />;

  const body = (
    <>
      {shown.title ? (
        <View style={[styles.titleRow, !shown.plainHeader && styles.titleDivider]}>
          <Text variant="headline" align="center" style={styles.title}>
            {shown.title}
          </Text>
        </View>
      ) : null}
      {shown.children}
    </>
  );
  const bottom = Math.max(insets.bottom, space.md) + space.xs;

  if (scroll) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.sheet, { paddingBottom: bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>
    );
  }
  return <View style={[styles.sheet, { paddingBottom: bottom }]}>{body}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.bgRaised },
  // Top padding clears the system grabber.
  sheet: { backgroundColor: color.bgRaised, paddingTop: 26 },
  titleRow: { paddingBottom: space.md, paddingTop: space.xs },
  titleDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line, marginBottom: space.xs },
  title: { fontSize: 19 },
});
