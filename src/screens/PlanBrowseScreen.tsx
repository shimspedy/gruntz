import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlanCard, PlanRow } from '../components/PlanCards';
import { allPlans, planCategories, PLAN_COUNT, type WorkoutPlan } from '../data/workoutPlans';
import { recommendPlans } from '../features/planRecommend';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useUserStore } from '../store/useUserStore';
import { Icon } from '../ui/Icon';
import { Chip, EmptyState, NavHeader, SectionTitle } from '../ui/Layout';
import { Button } from '../ui/Button';
import { Tap } from '../ui/Pressable';
import { Segmented } from '../ui/Segmented';
import { Text } from '../ui/Text';
import { color, radius, space } from '../ui/tokens';

/** Short chip labels for the scraped category names ("Workouts For Men" -> "Men"). */
const CATEGORY_LABEL: Record<string, string> = {
  'muscle-building': 'Muscle building',
  'fat-loss': 'Fat loss',
  home: 'At home',
  women: 'Women',
  men: 'Men',
  strength: 'Strength',
  abs: 'Abs',
  'full-body': 'Full body',
  sports: 'Sports',
  bodyweight: 'Bodyweight',
  beginner: 'Beginner',
  celebrity: 'Celebrity',
  cardio: 'Cardio',
  chest: 'Chest',
  back: 'Back',
  biceps: 'Biceps',
  shoulders: 'Shoulders',
  legs: 'Legs',
  triceps: 'Triceps',
  other: 'Glutes',
};

type Kind = WorkoutPlan['kind'];
const DAY_FILTERS = [0, 2, 3, 4, 5, 6] as const;

export default function PlanBrowseScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const profile = useUserStore((s) => s.profile);
  const activeId = usePlanLibraryStore((s) => s.activePlanId);
  const [kind, setKind] = useState<Kind>('program');
  const [category, setCategory] = useState<string | null>(null);
  const [days, setDays] = useState<number>(0);
  const [query, setQuery] = useState('');
  const list = useRef<FlatList<WorkoutPlan>>(null);
  const filtered = !!category || days > 0 || !!query.trim();

  const matched = useMemo(() => (profile ? recommendPlans(profile, 8) : []), [profile]);

  const plans = useMemo(() => {
    const inCategory = category ? new Set(planCategories().find((c) => c.id === category)?.plan_ids ?? []) : null;
    const q = query.trim().toLowerCase();
    return allPlans().filter(
      (p) =>
        p.kind === kind &&
        (!inCategory || inCategory.has(p.id)) &&
        (kind !== 'program' || !days || (days === 6 ? (p.summary.days_per_week ?? 0) >= 6 : p.summary.days_per_week === days)) &&
        (!q || p.title.toLowerCase().includes(q) || (p.summary.main_goal ?? '').toLowerCase().includes(q) || p.match.goals.some((g) => g.toLowerCase().includes(q))),
    );
  }, [kind, category, days, query]);

  // Filtering while scrolled deep into another list otherwise leaves you mid-nowhere.
  const resetTop = () => list.current?.scrollToOffset({ offset: 0, animated: false });
  const clearFilters = () => {
    setCategory(null);
    setDays(0);
    setQuery('');
    resetTop();
  };

  // Stable identity, so the memoised rows are not invalidated on every render.
  const open = useCallback((plan: WorkoutPlan) => navigation.navigate('LibraryPlanDetail', { planId: plan.id }), [navigation]);
  const cardWidth = Math.round(width * 0.62);

  const header = (
    <View>
      {matched.length ? (
        <>
          <SectionTitle title="Matched to you" style={styles.section} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} decelerationRate="fast" snapToInterval={cardWidth + space.sm}>
            {matched.map((r, i) => (
              <PlanCard
                key={r.plan.id}
                plan={r.plan}
                width={cardWidth}
                tag={r.plan.id === activeId ? 'Following' : i === 0 ? 'Best match' : null}
                onPress={() => open(r.plan)}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      <Tap feedback="highlight" baseColor={color.bg} pressedColor={color.bgRaised} onPress={() => navigation.navigate('ProgramSelect')} style={styles.gruntz} accessibilityLabel="Gruntz programs">
        <View style={styles.gruntzIcon}>
          <Icon name="shield" size={28} color={color.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ fontSize: 18 }}>
            Gruntz tactical programs
          </Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 3 }}>
            Base Camp, Raider and Recon
          </Text>
        </View>
        <Icon name="arrowRight" size={18} color={color.textSecondary} />
      </Tap>

      <SectionTitle title="All plans" action={filtered ? 'Clear' : undefined} onAction={clearFilters} style={[styles.section, { marginTop: space.xl }]} />
      <View style={styles.search}>
        <Icon name="scope" size={16} color={color.textTertiary} />
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            resetTop();
          }}
          placeholder={`Search ${PLAN_COUNT} plans`}
          placeholderTextColor={color.textTertiary}
          style={styles.searchInput}
          selectionColor={color.accent}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          accessibilityLabel="Search plans"
        />
      </View>
      <Segmented
        options={[
          { value: 'program', label: 'Programs' },
          { value: 'single_workout', label: 'Single workouts' },
        ]}
        value={kind}
        onChange={(v) => {
          setKind(v);
          setCategory(null);
          setDays(0);
          resetTop();
        }}
        style={{ marginHorizontal: space.gutter, marginBottom: space.md }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" active={!category} onPress={() => setCategory(null)} />
        {planCategories().map((c) => (
          <Chip key={c.id} label={CATEGORY_LABEL[c.id] ?? c.name} active={category === c.id} onPress={() => { setCategory(category === c.id ? null : c.id); resetTop(); }} />
        ))}
      </ScrollView>
      {kind === 'program' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {DAY_FILTERS.map((d) => (
            <Chip key={d} label={d === 0 ? 'Any days' : d === 6 ? '6+ days' : `${d} days`} active={days === d} onPress={() => { setDays(d); resetTop(); }} />
          ))}
        </ScrollView>
      ) : null}
      <Text variant="footnote" tone="tertiary" style={{ paddingHorizontal: space.gutter, marginBottom: space.xs }}>
        {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <NavHeader title="Plans" />
      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <PlanRow plan={item} last={index === plans.length - 1} badge={item.id === activeId ? 'Following' : null} onOpen={open} />
        )}
        ListEmptyComponent={
          <EmptyState icon="list" title="No plans match" body="Nothing here fits those filters.">
            <Button title="Clear filters" variant="secondary" onPress={clearFilters} />
          </EmptyState>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
        ref={list}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" 
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  section: { paddingHorizontal: space.gutter, marginTop: space.sm, marginBottom: space.md },
  carousel: { paddingHorizontal: space.gutter, gap: space.sm },
  chips: { paddingHorizontal: space.gutter, gap: 10, paddingBottom: space.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginHorizontal: space.gutter,
    marginBottom: space.md,
    paddingHorizontal: space.md,
    height: 44,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
  },
  searchInput: { flex: 1, color: color.text, fontSize: 16 },
  gruntz: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xl, paddingHorizontal: space.gutter, paddingVertical: space.sm },
  gruntzIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
