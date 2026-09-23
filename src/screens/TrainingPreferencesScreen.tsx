import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../store/useUserStore';
import type { UserProfile } from '../types';
import { Button } from '../ui/Button';
import { Chip, EmptyState, NavHeader } from '../ui/Layout';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, space } from '../ui/tokens';

const GOALS = ['Build Muscle', 'Get Stronger', 'Lose Fat', 'Improve Endurance', 'Start Moving', 'Build Discipline', 'Military Prep'];
const LEVELS: UserProfile['fitness_level'][] = ['beginner', 'intermediate', 'advanced'];
const DAYS = [2, 3, 4, 5, 6];
const MINUTES = [20, 30, 45, 60];
const GEAR: { id: string; label: string }[] = [
  { id: 'gym', label: 'Gym' },
  { id: 'home', label: 'Dumbbells or bands' },
  { id: 'pool', label: 'Pool' },
  { id: 'ruck', label: 'Ruck' },
];
const INTENSITY: UserProfile['preferred_intensity'][] = ['low', 'moderate', 'high'];
// Age drives real programming — adaptiveCoach and baseCampWorkouts soften volume and
// progression for 45-59 and 60+. It was asked once in onboarding, was skippable with
// "Prefer not to say" (silently defaulting to 30-44), and could never be changed
// afterwards, so a 65-year-old who declined got standard adult progression forever.
const BODY_WEIGHT_LBS = [120, 140, 160, 180, 200, 220, 250];
const BODY_WEIGHT_KG = [55, 65, 75, 85, 95, 105, 115];
const AGES: { id: NonNullable<UserProfile['age_range']>; label: string }[] = [
  { id: 'under_30', label: 'Under 30' },
  { id: '30_44', label: '30 – 44' },
  { id: '45_59', label: '45 – 59' },
  { id: '60_plus', label: '60 or older' },
];
const LIMITS: { id: string; label: string }[] = [
  { id: 'low_impact', label: 'Low impact' },
  { id: 'joint_concerns', label: 'Joint concerns' },
  { id: 'returning_after_break', label: 'Returning after a break' },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Onboarding answers were frozen forever; this is the one place to change them later. */
export default function TrainingPreferencesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);

  const [goals, setGoals] = useState<string[]>(profile?.goals ?? []);
  const [level, setLevel] = useState(profile?.fitness_level ?? 'beginner');
  const [days, setDays] = useState(profile?.workout_days_per_week ?? 4);
  const [minutes, setMinutes] = useState(profile?.preferred_session_minutes ?? 30);
  const [gear, setGear] = useState<string[]>(profile?.available_equipment ?? []);
  const [intensity, setIntensity] = useState(profile?.preferred_intensity ?? 'moderate');
  const [limits, setLimits] = useState<string[]>(profile?.movement_limitations ?? []);
  const [age, setAge] = useState<NonNullable<UserProfile['age_range']> | undefined>(profile?.age_range);
  const metric = profile?.settings.units === 'metric';
  const [bodyWeight, setBodyWeight] = useState<number | undefined>(profile?.body_weight_lbs);

  if (!profile) {
    return (
      <View style={styles.screen}>
        <NavHeader title="Training preferences" />
        <EmptyState icon="person" title="No profile yet" body="Finish setting up your profile and your training preferences will live here." />
      </View>
    );
  }

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = () => {
    haptic.success();
    setProfile({
      ...profile,
      goals,
      fitness_level: level,
      workout_days_per_week: days,
      preferred_session_minutes: minutes,
      available_equipment: gear,
      has_gym_access: gear.includes('gym'),
      has_pool_access: gear.includes('pool'),
      has_ruck_access: gear.includes('ruck'),
      preferred_intensity: intensity,
      movement_limitations: limits,
      age_range: age,
      body_weight_lbs: bodyWeight,
    });
    // Deliberately doesn't switch the plan you're following — it only changes what's suggested.
    toast('Preferences saved', {
      icon: 'check',
      action: { label: 'See matches', onPress: () => navigation.navigate('PlanBrowse') },
    });
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <NavHeader title="Training preferences" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <Text variant="callout" tone="secondary" style={styles.intro}>
          These shape which plans we recommend. Changing them never changes the plan you’re following.
        </Text>

        <Section title="Goals">
          {GOALS.map((g) => (
            <Chip key={g} label={g} active={goals.includes(g)} onPress={() => toggle(goals, setGoals, g)} />
          ))}
        </Section>

        <Section title="Experience">
          {LEVELS.map((l) => (
            <Chip key={l} label={cap(l)} active={level === l} onPress={() => setLevel(l)} />
          ))}
        </Section>

        <Section title="Days a week">
          {DAYS.map((d) => (
            <Chip key={d} label={`${d} days`} active={days === d} onPress={() => setDays(d)} />
          ))}
        </Section>

        <Section title="Session length">
          {MINUTES.map((m) => (
            <Chip key={m} label={`${m} min`} active={minutes === m} onPress={() => setMinutes(m)} />
          ))}
        </Section>

        <Section title="Equipment">
          {GEAR.map((g) => (
            <Chip key={g.id} label={g.label} active={gear.includes(g.id)} onPress={() => toggle(gear, setGear, g.id)} />
          ))}
        </Section>

        <Section title="Intensity">
          {INTENSITY.map((i) => (
            <Chip key={i} label={cap(i)} active={intensity === i} onPress={() => setIntensity(i)} />
          ))}
        </Section>

        <Section title={metric ? 'Body weight (kg)' : 'Body weight (lb)'}>
          {(metric ? BODY_WEIGHT_KG : BODY_WEIGHT_LBS).map((w) => {
            // Stored in pounds either way, so the metric options convert on save.
            const lbs = metric ? Math.round(w / 0.45359237) : w;
            return (
              <Chip
                key={w}
                label={String(w)}
                active={bodyWeight != null && Math.abs(bodyWeight - lbs) < 3}
                onPress={() => setBodyWeight(lbs)}
              />
            );
          })}
        </Section>

        <Section title="Age">
          {AGES.map((a) => (
            <Chip key={a.id} label={a.label} active={age === a.id} onPress={() => setAge(a.id)} />
          ))}
        </Section>

        <Section title="Plan around">
          {LIMITS.map((l) => (
            <Chip key={l.id} label={l.label} active={limits.includes(l.id)} onPress={() => toggle(limits, setLimits, l.id)} />
          ))}
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <Button title="Save preferences" onPress={save} />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="tertiary" style={{ marginBottom: space.sm }}>
        {title}
      </Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  intro: { paddingHorizontal: space.gutter, paddingBottom: space.md },
  section: { paddingHorizontal: space.gutter, marginTop: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.gutter, paddingTop: space.md, backgroundColor: color.bg },
});
