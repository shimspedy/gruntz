import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GRUNTZ_PRIVACY_POLICY_URL, GRUNTZ_TERMS_OF_USE_URL } from '../config/legal';
import { GRUNTZ_PRO_LABEL, GRUNTZ_TRIAL_DAYS, getDisplayedMonthlyPrice } from '../config/monetization';
import { getAccessState, getTrialDaysRemaining, useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, motion, radius, space } from '../ui/tokens';
import { openExternalUrl } from '../utils/externalLinks';

/** "$3.74/month" or "$3.74" → "$3.74 / month" */
const perMonth = (p: string) => `${p.replace(/\s*\/\s*(mo|month)\.?$/i, '')} / month`;

const BENEFITS = [
  'Daily workouts built around your goal',
  'Base Camp, Raider and Recon programs',
  'Run and ruck tracking with audio splits',
  'Ranks, streaks and daily challenges',
];

export default function PaywallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const inOnboarding = route.name === 'OnboardingPaywall';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const offering = useSubscriptionStore((s) => s.currentOffering);
  const isConfigured = useSubscriptionStore((s) => s.isConfigured);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const lastError = useSubscriptionStore((s) => s.lastError);
  const loadOffering = useSubscriptionStore((s) => s.loadOffering);
  const purchaseMonthly = useSubscriptionStore((s) => s.purchaseMonthly);
  const purchaseAnnual = useSubscriptionStore((s) => s.purchaseAnnual);
  const restoreAccess = useSubscriptionStore((s) => s.restoreAccess);
  const openCustomerCenter = useSubscriptionStore((s) => s.openCustomerCenter);
  const openSubscriptionManagement = useSubscriptionStore((s) => s.openSubscriptionManagement);

  const access = getAccessState({ trialStartedAt, entitlementActive });
  const trialLeft = getTrialDaysRemaining(trialStartedAt);
  const monthly = getDisplayedMonthlyPrice(offering);
  const annual = offering?.annual ?? null;
  const [plan, setPlan] = useState<'annual' | 'monthly'>(annual ? 'annual' : 'monthly');
  const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

  useEffect(() => {
    if (annual) setPlan('annual');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annual?.productIdentifier]);

  useEffect(() => {
    if (isConfigured && access !== 'subscriber') void loadOffering();
  }, [isConfigured, access, loadOffering]);

  const dismiss = () => {
    if (inOnboarding) {
      // One-way door: finishing onboarding swaps the whole navigator, so back can't return here.
      useUserStore.getState().setOnboarded(true);
      setTimeout(() => toast('Your plan is ready', { icon: 'check' }), 500);
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
  };

  const buy = async () => {
    const r = await (plan === 'annual' && annual ? purchaseAnnual() : purchaseMonthly());
    if (r === 'purchased') {
      haptic.success();
      toast(`Welcome to ${GRUNTZ_PRO_LABEL}`, { icon: 'starFill' });
      dismiss();
      return;
    }
    // A cancel is the user's own decision and needs no explanation. Everything else
    // used to be silent: the only signal was a banner further down the ScrollView,
    // below the benefits box and both plan cards, while the CTA sits in a fixed
    // footer — so on a phone the spinner just stopped and nothing visibly happened,
    // and a recoverable payment problem read as a broken app.
    if (r === 'cancelled') return;
    haptic.error();
    if (r === 'unavailable') {
      Alert.alert(
        'Subscriptions unavailable',
        `Purchases aren't available on this device right now. If you've already subscribed, use Restore purchases — you won't be charged twice.`,
      );
      return;
    }
    Alert.alert(
      "Purchase didn't finish",
      // Read fresh: the render-time `lastError` predates this purchase attempt.
      `${useSubscriptionStore.getState().lastError ?? `We couldn't complete the purchase with the ${store}.`} You haven't been charged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try again', onPress: () => void buy() },
      ],
    );
  };

  const primary = async () => {
    if (access === 'subscriber') {
      const r = await openCustomerCenter();
      if (r === 'unavailable' || r === 'error') await openSubscriptionManagement();
      return;
    }
    // Subscribing during the free trial starts billing today and forfeits the rest
    // of it. That is worth saying out loud rather than discovering on the receipt.
    if (access === 'trial' && trialLeft > 1) {
      Alert.alert(
        `You still have ${trialLeft} free days`,
        `Subscribing now starts billing today and gives up the remaining ${trialLeft} days. You keep full access either way until then.`,
        [
          { text: `Keep my ${trialLeft} days`, style: 'cancel' },
          { text: 'Subscribe now', onPress: () => void buy() },
        ],
      );
      return;
    }
    await buy();
  };

  const restore = async () => {
    const r = await restoreAccess();
    if (r === 'restored') {
      toast('Purchases restored');
      dismiss();
    } else if (r === 'none') {
      Alert.alert('Nothing to restore', 'No active subscription was found for this account. If you subscribed with a different Apple ID, sign in with that one and try again.');
    } else if (r === 'unavailable') {
      // Not a network problem, and retrying cannot help — offering "Try again" here
      // invited an infinite loop against a guaranteed failure.
      Alert.alert(
        'Purchases unavailable',
        `In-app purchases aren't available on this device right now, so there's nothing to restore. Try again after updating the app.`,
      );
    } else {
      Alert.alert('Restore didn’t finish', `We couldn’t reach the ${store}. Check your connection and try again — you won’t be charged twice.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try again', onPress: () => void restore() },
      ]);
    }
  };

  const open = async (url: string) => {
    if (!(await openExternalUrl(url))) Alert.alert('Link unavailable', 'Try again in a moment.');
  };

  const selectedPrice = plan === 'annual' && annual ? annual.priceString : monthly;
  const ctaTitle =
    access === 'subscriber' ? 'Manage membership' : !isConfigured ? 'Connecting…' : !offering ? 'Loading pricing…' : 'Continue';

  return (
    <View style={styles.screen}>
      <Svg style={StyleSheet.absoluteFill} width={width} height="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="0%" rx="95%" ry="55%">
            <Stop offset="0" stopColor="#1F3A66" stopOpacity={0.95} />
            <Stop offset="0.55" stopColor="#0D1729" stopOpacity={0.6} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <Tap feedback="opacity" hitSlop={12} onPress={dismiss} accessibilityLabel="Close" style={styles.close}>
          <Icon name="close" size={24} color={color.text} weight="medium" />
        </Tap>
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 200 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(420).easing(motion.easeOut)}>
          <Text style={styles.title} align="center">
            {inOnboarding ? 'Unlock your custom plan' : access === 'subscriber' ? 'You’re on Gruntz Pro' : 'Unlock Gruntz Pro'}
          </Text>
          <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.sm }}>
            {access === 'trial'
              ? `${trialLeft} of ${GRUNTZ_TRIAL_DAYS} free days left · subscribing now starts billing today`
              : access === 'locked'
                ? 'Your included access has ended'
                : access === 'subscriber'
                  ? 'Every program and workout is unlocked'
                  : `${GRUNTZ_TRIAL_DAYS} days of full access included`}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(420)} style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefit}>
              <View style={styles.check}>
                <Icon name="check" size={13} color="#FFFFFF" weight="bold" />
              </View>
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {b}
              </Text>
            </View>
          ))}
        </Animated.View>

        {access !== 'subscriber' ? (
          <Animated.View entering={FadeIn.delay(160).duration(360)} style={{ marginTop: space.xl, gap: space.md }}>
            {annual ? (
              <PlanCard
                selected={plan === 'annual'}
                onPress={() => setPlan('annual')}
                badge={annual.percentSavings ? `Save ${annual.percentSavings}%` : 'Best value'}
                title="Yearly"
                subtitle={annual.priceString + ' / year'}
                right={annual.pricePerMonthString ? perMonth(annual.pricePerMonthString) : ''}
              />
            ) : null}
            <PlanCard selected={plan === 'monthly' || !annual} onPress={() => setPlan('monthly')} title="Monthly" right={perMonth(monthly)} />
          </Animated.View>
        ) : null}

        {lastError && access !== 'subscriber' ? (
          <View style={styles.warning}>
            <Icon name="alert" size={18} color={color.flame} />
            <Text variant="footnote" tone="secondary" style={{ flex: 1 }}>
              We couldn’t reach the {store}. Check your connection and try again.
            </Text>
            <Tap feedback="opacity" onPress={() => void loadOffering()} accessibilityLabel="Retry">
              <Text variant="subhead" tone="accent">
                Retry
              </Text>
            </Tap>
          </View>
        ) : null}

        {/* Never quote a price the store has not confirmed: with no live offering
            this rendered a placeholder inside a binding auto-renew disclosure. */}
        <Text variant="caption" tone="secondary" align="center" style={styles.legal}>
          {access === 'subscriber'
            ? `Manage or cancel anytime in your ${store} account settings.`
            : !offering
            ? 'Pricing is loading from the App Store.'
            : `${GRUNTZ_PRO_LABEL} is an auto-renewing ${plan === 'annual' && annual ? 'yearly' : 'monthly'} subscription at ${selectedPrice}. Payment is charged to your ${store} account at confirmation and renews unless cancelled at least 24 hours before the period ends. Manage or cancel anytime in account settings.`}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
        <Button
          title={ctaTitle}
          onPress={() => void primary()}
          loading={isLoading}
          disabled={access !== 'subscriber' && (!isConfigured || !offering)}
        />
        <View style={styles.reassure}>
          <Icon name="shieldCheck" size={16} color={color.accent} />
          <Text variant="subhead" tone="secondary">
            No commitment, cancel anytime
          </Text>
        </View>
        <View style={styles.links}>
          {/* These were bare text well under the 44pt minimum. */}
          <Tap feedback="opacity" hitSlop={12} onPress={() => void restore()} style={styles.link} accessibilityLabel="Restore purchases">
            <Text variant="footnote" tone="secondary">
              Restore
            </Text>
          </Tap>
          <Text variant="footnote" tone="quaternary">
            ·
          </Text>
          <Tap feedback="opacity" hitSlop={12} onPress={() => void open(GRUNTZ_TERMS_OF_USE_URL)} style={styles.link} accessibilityLabel="Terms of use">
            <Text variant="footnote" tone="secondary">
              Terms
            </Text>
          </Tap>
          <Text variant="footnote" tone="quaternary">
            ·
          </Text>
          <Tap feedback="opacity" hitSlop={12} onPress={() => void open(GRUNTZ_PRIVACY_POLICY_URL)} style={styles.link} accessibilityLabel="Privacy policy">
            <Text variant="footnote" tone="secondary">
              Privacy
            </Text>
          </Tap>
        </View>
      </View>
    </View>
  );
}

function PlanCard({
  selected,
  onPress,
  title,
  subtitle,
  right,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle?: string;
  right: string;
  badge?: string;
}) {
  const t = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    t.set(withTiming(selected ? 1 : 0, { duration: motion.base, easing: motion.easeOut }));
  }, [selected, t]);
  const box = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.get(), [0, 1], ['rgba(0,0,0,0)', '#DCEBFF']),
    borderColor: interpolateColor(t.get(), [0, 1], ['#3A3A3C', color.accent]),
  }));
  const ink = selected ? '#06101F' : color.textSecondary;
  return (
    <Tap
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      scaleTo={0.98}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title} ${right}`}
    >
      <Animated.View style={[styles.plan, box]}>
        {badge ? (
          <View style={[styles.planBadge, { backgroundColor: selected ? color.accent : '#2A2A2C' }]}>
            <Text variant="subhead" style={{ color: '#FFFFFF', fontFamily: font.semibold }}>
              {badge}
            </Text>
          </View>
        ) : null}
        <View style={styles.planBody}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planTitle, { color: selected ? '#06101F' : color.textSecondary }]}>{title}</Text>
            {subtitle ? (
              <Text variant="subhead" style={{ color: ink, marginTop: 2 }} tabular>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Text variant="headline" style={{ color: ink }} tabular>
            {right}
          </Text>
        </View>
      </Animated.View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.md },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: space.gutter, paddingTop: space.sm },
  title: { fontFamily: font.semibold, fontSize: 28, lineHeight: 34, color: color.text, letterSpacing: -0.6 },
  benefits: {
    marginTop: space.lg,
    padding: space.lg,
    gap: 14,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(28,28,30,0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  plan: { borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: 2, overflow: 'hidden' },
  planBadge: { height: 30, alignItems: 'center', justifyContent: 'center' },
  planBody: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: 18 },
  planTitle: { fontFamily: font.bold, fontSize: 24 },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.lg, padding: space.md, borderRadius: radius.md, backgroundColor: color.surface },
  // The auto-renew disclosure is the one block a buyer must be able to read.
  legal: { marginTop: space.lg, lineHeight: 19, fontSize: 13 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.md, backgroundColor: 'rgba(0,0,0,0.92)' },
  reassure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 },
});
