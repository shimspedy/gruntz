import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { getAllMovementCards, getAllSwimCards } from '../data/movementCards';
import { useSubscriptionStore, hasTrainingAccess } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import type { MovementCard } from '../types';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { HeroArt } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { Hairline, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Segmented } from '../ui/Segmented';
import { Text } from '../ui/Text';
import { color, motion, radius, space } from '../ui/tokens';
import { getTopRecommendations } from '../utils/recommendations';
import { cardHero } from './TrainScreen';

export default function CardLibraryScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'CardLibrary'>>();
  const insets = useSafeAreaInsets();
  const progress = useUserStore((s) => s.progress);
  const profile = useUserStore((s) => s.profile);
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const unlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const [tab, setTab] = useState<'movement' | 'swim'>(params?.category === 'swim' ? 'swim' : 'movement');
  const recs = useMemo(() => new Map(getTopRecommendations(progress, 12, profile).map((r) => [r.card_id, r])), [progress, profile]);
  const cards: MovementCard[] = tab === 'swim' ? getAllSwimCards() : getAllMovementCards();

  return (
    <View style={styles.screen}>
      <NavHeader title="Training cards" />
      <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'movement', label: 'Movement' }, { value: 'swim', label: 'Swim' }]} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }} showsVerticalScrollIndicator={false} scrollEnabled={unlocked}>
        <Animated.View key={tab} entering={FadeIn.duration(220)}>
          {cards.map((c, i) => {
            const rec = recs.get(c.id);
            return (
              <Animated.View key={c.id} entering={FadeInDown.delay(i * motion.stagger).duration(300)}>
                <Tap feedback="highlight" baseColor={color.bg} pressedColor={color.bgRaised} onPress={() => navigation.navigate('CardDetail', { cardId: c.id })} style={styles.row} accessibilityLabel={c.name}>
                  <HeroArt exercise={cardHero(c)} style={styles.thumb} />
                  <View style={{ flex: 1, marginLeft: space.md }}>
                    <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0.8 }}>
                      CARD {c.card_number}
                    </Text>
                    <Text variant="headline" style={{ fontSize: 18, marginTop: 2 }} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text variant="subhead" tone="secondary" style={{ marginTop: 3 }}>
                      {c.estimated_duration} min · {c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)}
                    </Text>
                    {rec && rec.priority === 'high' ? (
                      <Text variant="subhead" tone="accent" style={{ marginTop: 3 }} numberOfLines={1}>
                        Recommended · {rec.reason}
                      </Text>
                    ) : null}
                  </View>
                  <Icon name="arrowRight" size={18} color={color.textSecondary} />
                </Tap>
                {i < cards.length - 1 ? <Hairline style={{ marginLeft: space.gutter + 96 + space.md }} /> : null}
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {!unlocked ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { top: insets.top + 110 }]} />
          <View style={styles.lock}>
            <Icon name="lock" size={28} color={color.text} />
            <Text variant="title" align="center" style={{ fontSize: 24, marginTop: space.md }}>
              Training cards
            </Text>
            <Hairline style={{ alignSelf: 'stretch', marginVertical: space.md }} />
            <Text variant="callout" tone="secondary" align="center">
              Movement and swim cards are part of Gruntz Pro.
            </Text>
            <Button title="Unlock Gruntz Pro" onPress={() => navigation.navigate('Paywall')} style={{ alignSelf: 'stretch', marginTop: space.lg }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 14 },
  thumb: { width: 96, height: 96, borderRadius: radius.md, borderCurve: 'continuous' },
  lock: { position: 'absolute', top: '32%', left: space.xxl, right: space.xxl, alignItems: 'center' },
});
