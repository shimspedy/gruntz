import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { MissionButton } from '../components/MissionButton';
import {
  GRUNTZ_PRO_LABEL,
  GRUNTZ_TRIAL_DAYS,
  getDisplayedMonthlyPrice,
} from '../config/monetization';
import {
  GRUNTZ_PRIVACY_POLICY_URL,
  GRUNTZ_TERMS_OF_USE_URL,
} from '../config/legal';
import {
  getAccessState,
  getTrialDaysRemaining,
  useSubscriptionStore,
} from '../store/useSubscriptionStore';
import { openExternalUrl } from '../utils/externalLinks';
import { hapticLevelUp } from '../utils/haptics';

type BenefitTier = 'hero' | 'standard';

const benefits: { label: string; tier: BenefitTier }[] = [
  { label: 'Train every day with mission-based workouts', tier: 'hero' },
  { label: 'Build a streak you can actually keep', tier: 'hero' },
  { label: 'Progress through Base Camp, Raider, and Recon', tier: 'hero' },
  { label: 'Run and ruck tracking with pace + elevation', tier: 'standard' },
  { label: 'Workout cards, swim cards, and recovery flows', tier: 'standard' },
  { label: 'Earn XP, ranks, and exclusive daily challenges', tier: 'standard' },
];

export default function PaywallScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();

  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const currentOffering = useSubscriptionStore((s) => s.currentOffering);
  const isConfigured = useSubscriptionStore((s) => s.isConfigured);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const lastError = useSubscriptionStore((s) => s.lastError);
  const loadOffering = useSubscriptionStore((s) => s.loadOffering);
  const purchaseMonthly = useSubscriptionStore((s) => s.purchaseMonthly);
  const purchaseAnnual = useSubscriptionStore((s) => s.purchaseAnnual);
  const restoreAccess = useSubscriptionStore((s) => s.restoreAccess);
  const openCustomerCenter = useSubscriptionStore((s) => s.openCustomerCenter);
  const openSubscriptionManagement = useSubscriptionStore((s) => s.openSubscriptionManagement);

  const accessState = getAccessState({ trialStartedAt, entitlementActive });
  const trialDaysRemaining = getTrialDaysRemaining(trialStartedAt);
  const priceLabel = getDisplayedMonthlyPrice(currentOffering);
  const productTitle = currentOffering?.title || `${GRUNTZ_PRO_LABEL} Monthly`;
  const annual = currentOffering?.annual ?? null;
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    annual ? 'annual' : 'monthly',
  );
  const selectedPlanTitle =
    selectedPlan === 'annual' && annual ? `${GRUNTZ_PRO_LABEL} Annual` : productTitle;
  const selectedPlanPrice =
    selectedPlan === 'annual' && annual ? annual.priceString : priceLabel;
  const selectedPlanPeriod = selectedPlan === 'annual' && annual ? 'yearly' : 'monthly';
  // If RevenueCat returns the annual package after first render, default-select it once.
  useEffect(() => {
    if (annual && selectedPlan === 'monthly') {
      setSelectedPlan('annual');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annual?.productIdentifier]);
  const storeLabel =
    Platform.OS === 'ios'
      ? 'App Store'
      : Platform.OS === 'android'
        ? 'Google Play'
        : 'app store';

  useEffect(() => {
    if (!isConfigured || accessState === 'subscriber') {
      return;
    }
    loadOffering();
  }, [accessState, isConfigured, loadOffering]);

  const dismissPaywall = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    (navigation as unknown as { navigate: (name: string) => void }).navigate('Home');
  };

  const handlePrimary = async () => {
    try {
      if (accessState === 'subscriber') {
        const result = await openCustomerCenter();
        if (result === 'unavailable' || result === 'error') {
          await openSubscriptionManagement();
        }
        return;
      }

      const result = await (selectedPlan === 'annual' && annual ? purchaseAnnual() : purchaseMonthly());
      if (result === 'purchased') {
        void hapticLevelUp();
        Alert.alert(
          `Welcome to ${GRUNTZ_PRO_LABEL}`,
          'Every program, mission, and challenge is now unlocked. Time to train.',
          [{ text: "LET'S GO", onPress: () => dismissPaywall() }],
        );
      }
    } catch {
      // Store already sets lastError — nothing extra needed here
    }
  };

  const handleRestore = async () => {
    try {
      const result = await restoreAccess();
      if (result === 'restored') {
        dismissPaywall();
      }
    } catch {
      // Store already sets lastError
    }
  };

  const handleOpenLegalLink = async (url: string, label: string) => {
    const opened = await openExternalUrl(url);
    if (!opened) {
      Alert.alert('Link unavailable', `Unable to open the ${label.toLowerCase()} right now.`);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeGlow} />
            <GameIcon name="rank" size={40} color={colors.accent} />
          </View>
          <Text style={styles.eyebrow}>BECOME ELITE</Text>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            {GRUNTZ_PRO_LABEL}
          </Text>
          <Text style={styles.subtitle}>
            Show up daily. Build the discipline. Train like it's the standard.
          </Text>
        </View>

        {/* Outcomes Card — what subscribers actually do with Pro */}
        <GlassCard style={styles.outcomesCard}>
          <Text style={styles.outcomesEyebrow}>WHAT YOU'LL DO</Text>
          <View style={styles.outcomeRow}>
            <GameIcon name="streak" size={16} color={colors.streakFire} variant="minimal" animated={false} />
            <Text style={styles.outcomeText}>Hold a 30-day streak without breaking it</Text>
          </View>
          <View style={styles.outcomeRow}>
            <GameIcon name="rank" size={16} color={colors.accent} variant="minimal" animated={false} />
            <Text style={styles.outcomeText}>Move from Recruit to Operator on a real plan</Text>
          </View>
          <View style={styles.outcomeRow}>
            <GameIcon name="run" size={16} color={colors.accentGreen} variant="minimal" animated={false} />
            <Text style={styles.outcomeText}>Train for ruck, run, and PT with one app</Text>
          </View>
        </GlassCard>

        {/* Status Card */}
        <GlassCard style={styles.statusCard} variant={accessState === 'subscriber' ? 'default' : 'accent'}>
          {accessState === 'subscriber' ? (
            <>
              <View style={styles.statusBadge}>
                <GameIcon name="check" size={16} color={colors.accentGreen} variant="minimal" animated={false} />
                <Text style={styles.statusBadgeText}>ACTIVE</Text>
              </View>
              <Text style={styles.statusTitle}>Member Unlocked</Text>
              <Text style={styles.statusBody}>
                Your subscription is active. You have full access to every program and mission.
              </Text>
            </>
          ) : accessState === 'trial' ? (
            <>
              <View style={styles.statusBadge}>
                <GameIcon name="xp" size={16} color={colors.accent} variant="minimal" animated={false} />
                <Text style={[styles.statusBadgeText, { color: colors.accent }]}>ACCESS</Text>
              </View>
              <Text style={[styles.statusTitle, trialDaysRemaining <= 2 && { color: colors.accentRed }]}>
                {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} left
              </Text>
              <View style={styles.trialProgressTrack}>
                <View
                  style={[
                    styles.trialProgressFill,
                    {
                      width: `${Math.max(0, Math.min(1, 1 - trialDaysRemaining / GRUNTZ_TRIAL_DAYS)) * 100}%`,
                      backgroundColor:
                        trialDaysRemaining <= 2
                          ? colors.accentRed
                          : trialDaysRemaining <= 5
                            ? colors.accentOrange
                            : colors.accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.statusBody}>
                Your first {GRUNTZ_TRIAL_DAYS} days include full app access. Subscribe anytime to keep training after that window ends.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.statusBadge}>
                <GameIcon name="lock" size={16} color={colors.accentRed} variant="minimal" animated={false} />
                <Text style={[styles.statusBadgeText, { color: colors.accentRed }]}>LOCKED</Text>
              </View>
              <Text style={styles.statusTitle}>Access Ended</Text>
              <Text style={styles.statusBody}>
                Your included access window has ended. Subscribe to unlock full programs, daily missions, and streaks.
              </Text>
            </>
          )}
        </GlassCard>

        {/* Price / Plan Selector */}
        {annual ? (
          <View style={styles.planRow}>
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPlan === 'annual' }}
              accessibilityLabel="Annual plan"
              onPress={() => setSelectedPlan('annual')}
            >
              {annual.percentSavings ? (
                <View style={styles.planSaveBadge}>
                  <Text style={styles.planSaveText}>SAVE {annual.percentSavings}%</Text>
                </View>
              ) : null}
              <Text style={styles.planLabel}>ANNUAL</Text>
              <Text style={styles.planPrice}>{annual.priceString}</Text>
              <Text style={styles.planSub}>
                {annual.pricePerMonthString || 'Billed yearly'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPlan === 'monthly' }}
              accessibilityLabel="Monthly plan"
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={styles.planLabel}>MONTHLY</Text>
              <Text style={styles.planPrice}>{priceLabel}</Text>
              <Text style={styles.planSub}>Billed monthly</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GlassCard style={styles.priceCard} variant="accent">
            <Text style={styles.priceLabel}>{productTitle}</Text>
            <Text style={styles.priceValue}>{priceLabel}</Text>
            <Text style={styles.priceSub}>
              Monthly subscription. New accounts get {GRUNTZ_TRIAL_DAYS} days of app access before a subscription is required.
            </Text>
          </GlassCard>
        )}

        {/* Benefits Card */}
        <GlassCard style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What's Included</Text>
          {benefits.map((benefit, index) => {
            const isHero = benefit.tier === 'hero';
            return (
              <View key={`${benefit.label}-${index}`} style={styles.benefitRow}>
                <View style={[styles.benefitCheckbox, isHero && styles.benefitCheckboxHero]}>
                  <GameIcon
                    name="check"
                    size={12}
                    color={colors.accent}
                    variant="minimal"
                    animated={false}
                  />
                </View>
                <Text style={[styles.benefitText, isHero && styles.benefitTextHero]}>
                  {benefit.label}
                </Text>
              </View>
            );
          })}
        </GlassCard>

        {/* Billing unavailable — inline warning with retry */}
        {!isConfigured && accessState !== 'subscriber' && !lastError ? (
          <GlassCard style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <GameIcon name="warning" size={20} color={colors.accentOrange} variant="minimal" animated={false} />
              <Text style={styles.warningTitle}>Setting up billing…</Text>
            </View>
            <Text style={styles.warningText}>
              Secure billing is still initializing. Tap retry if this persists for more than a few seconds.
            </Text>
            <TouchableOpacity
              onPress={() => {
                void loadOffering();
              }}
              activeOpacity={0.85}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel="Retry loading pricing"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.retryButtonText}>RETRY</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : null}

        {/* Status info — only show when there's no error */}
        {isConfigured && !lastError && accessState === 'subscriber' ? (
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <GameIcon name="info" size={18} color={colors.accent} variant="minimal" animated={false} />
              <Text style={styles.infoTitle}>Customer Portal Active</Text>
            </View>
            <Text style={styles.infoText}>
              Manage your membership through the button below.
            </Text>
          </GlassCard>
        ) : null}

        {/* User-friendly error — only show for non-subscribers */}
        {lastError && accessState !== 'subscriber' ? (
          <GlassCard style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <GameIcon name="warning" size={20} color={colors.accentOrange} variant="minimal" animated={false} />
              <Text style={styles.warningTitle}>Subscription temporarily unavailable</Text>
            </View>
            <Text style={styles.warningText}>
              We are having trouble connecting to the App Store. Please check your connection and try again in a moment.
            </Text>
          </GlassCard>
        ) : null}

        <GlassCard style={styles.legalCard}>
          <Text style={styles.legalTitle}>Subscription Details</Text>
          <Text style={styles.legalBody}>
            {selectedPlanTitle} is an auto-renewable {selectedPlanPeriod} subscription billed at {selectedPlanPrice}. Payment
            is charged to your {storeLabel} account at confirmation of purchase and renews
            automatically unless it is canceled at least 24 hours before the end of the current
            period.
          </Text>
          <Text style={styles.legalBody}>
            Manage or cancel anytime in your {storeLabel} account settings under Subscriptions.
          </Text>
          <Text style={styles.legalBody}>
            Privacy Policy and Terms of Use are available below.
          </Text>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Open Privacy Policy"
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                void handleOpenLegalLink(GRUNTZ_PRIVACY_POLICY_URL, 'Privacy Policy');
              }}
              style={styles.legalLinkButton}
            >
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.textMuted} />
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Open Terms of Use"
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                void handleOpenLegalLink(GRUNTZ_TERMS_OF_USE_URL, 'Terms of Use');
              }}
              style={styles.legalLinkButton}
            >
              <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
              <Text style={styles.legalLinkText}>Terms of Use</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* CTAs */}
        <MissionButton
          title={
            accessState === 'subscriber'
              ? 'MANAGE MEMBERSHIP'
              : isConfigured
                ? currentOffering
                  ? 'UNLOCK GRUNTZ PRO'
                  : 'LOADING PRICING…'
                : 'CONNECTING…'
          }
          onPress={handlePrimary}
          loading={isLoading}
          disabled={accessState !== 'subscriber' && (!isConfigured || !currentOffering)}
          style={styles.primaryButton}
        />

        {accessState !== 'subscriber' ? (
          <MissionButton
            title="RESTORE PURCHASES"
            onPress={handleRestore}
            variant="secondary"
            loading={isLoading}
            disabled={!isConfigured}
            style={styles.secondaryButton}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    hero: {
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    heroBadge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      position: 'relative',
    },
    heroBadgeGlow: {
      position: 'absolute',
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.accent,
      opacity: 0.08,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: 'center',
      lineHeight: 20,
    },
    outcomesCard: {
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    outcomesEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    outcomeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    outcomeText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 18,
    },
    statusCard: {
      marginBottom: spacing.md,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      backgroundColor: `${colors.accent}0D`,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
      marginBottom: spacing.sm,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: 1,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    statusBody: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    planRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    planCard: {
      flex: 1,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      position: 'relative',
    },
    planCardActive: {
      borderColor: colors.accent,
      backgroundColor: `${colors.accent}0D`,
    },
    planSaveBadge: {
      position: 'absolute',
      top: -8,
      backgroundColor: colors.accentGreen,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    planSaveText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.background,
      letterSpacing: 1,
    },
    planLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: spacing.xs,
    },
    planPrice: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    planSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      textAlign: 'center',
    },
    priceCard: {
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    priceLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    priceValue: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.accent,
      marginVertical: spacing.xs,
    },
    priceSub: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textMuted,
      textAlign: 'center',
    },
    benefitsCard: {
      marginBottom: spacing.md,
    },
    benefitsTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    benefitCheckbox: {
      width: 20,
      height: 20,
      borderRadius: borderRadius.sm,
      backgroundColor: `${colors.accent}0D`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    benefitCheckboxHero: {
      width: 20,
      height: 20,
      borderRadius: borderRadius.sm,
      backgroundColor: `${colors.accent}1A`,
    },
    benefitText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    benefitTextHero: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    retryButton: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.accentOrange,
    },
    retryButtonText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accentOrange,
      letterSpacing: 1,
    },
    trialProgressTrack: {
      height: 6,
      backgroundColor: colors.cardBorder,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    trialProgressFill: {
      height: '100%',
      borderRadius: borderRadius.full,
    },
    warningCard: {
      marginBottom: spacing.md,
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    warningTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accentOrange,
    },
    warningText: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
    },
    infoCard: {
      marginBottom: spacing.md,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    infoText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    primaryButton: {
      marginTop: spacing.lg,
    },
    secondaryButton: {
      marginTop: spacing.sm,
    },
    legalCard: {
      marginTop: spacing.md,
    },
    legalTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    legalBody: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    legalLinksRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    legalLinkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
    },
    legalLinkText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
