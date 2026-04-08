import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { GameIcon } from '../components/GameIcon';
import { MissionButton } from '../components/MissionButton';
import {
  GRUNTZ_MONTHLY_PRICE_FALLBACK,
  GRUNTZ_PRO_LABEL,
  GRUNTZ_TRIAL_DAYS,
  getDisplayedMonthlyPrice,
  hasRevenueCatPricingMismatch,
} from '../config/monetization';
import {
  getAccessState,
  getTrialDaysRemaining,
  useSubscriptionStore,
} from '../store/useSubscriptionStore';

const benefits = [
  'Full Raider and Recon programs',
  'Unlimited daily mission access',
  'Workout cards, swim cards, and run support',
  'Progress, XP, streaks, and achievements',
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
  const restoreAccess = useSubscriptionStore((s) => s.restoreAccess);
  const openCustomerCenter = useSubscriptionStore((s) => s.openCustomerCenter);
  const openSubscriptionManagement = useSubscriptionStore((s) => s.openSubscriptionManagement);

  const accessState = getAccessState({ trialStartedAt, entitlementActive });
  const trialDaysRemaining = getTrialDaysRemaining(trialStartedAt);
  const priceLabel = getDisplayedMonthlyPrice(currentOffering);
  const productTitle = currentOffering?.title || `${GRUNTZ_PRO_LABEL} Monthly`;
  const pricingMismatch = hasRevenueCatPricingMismatch(currentOffering);
  const livePriceLabel = currentOffering?.priceString ?? null;

  useEffect(() => {
    if (!isConfigured || accessState === 'subscriber') {
      return;
    }
    loadOffering();
  }, [accessState, isConfigured, loadOffering]);

  const handlePrimary = async () => {
    if (accessState === 'subscriber') {
      const result = await openCustomerCenter();
      if (result === 'unavailable' || result === 'error') {
        await openSubscriptionManagement();
      }
      return;
    }

    const result = await purchaseMonthly();
    if (result === 'purchased') {
      navigation.goBack();
    }
  };

  const handleRestore = async () => {
    const result = await restoreAccess();
    if (result === 'restored') {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <GameIcon name="rank" size={54} color={colors.accentGold} />
          </View>
          <Text style={styles.eyebrow}>MEMBERSHIP</Text>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            {GRUNTZ_PRO_LABEL}
          </Text>
          <Text style={styles.subtitle}>
            Keep the full tactical training loop unlocked.
          </Text>
        </View>

        <Card style={styles.statusCard}>
          {accessState === 'subscriber' ? (
            <>
              <Text style={styles.statusLabel}>STATUS</Text>
              <Text style={styles.statusTitle}>Active Member</Text>
              <Text style={styles.statusBody}>
                Your subscription is active. You have full access to every program and mission.
              </Text>
            </>
          ) : accessState === 'trial' ? (
            <>
              <Text style={styles.statusLabel}>FREE ACCESS</Text>
              <Text style={styles.statusTitle}>{trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} left</Text>
              <Text style={styles.statusBody}>
                Every new user gets {GRUNTZ_TRIAL_DAYS} days of full access. When that ends, subscribe to keep training.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.statusLabel}>ACCESS LOCKED</Text>
              <Text style={styles.statusTitle}>Trial ended</Text>
              <Text style={styles.statusBody}>
                Subscribe to keep running missions, opening full programs, and building your streak.
              </Text>
            </>
          )}
        </Card>

        <Card style={styles.priceCard}>
          <Text style={styles.priceLabel}>{productTitle}</Text>
          <Text style={styles.priceValue}>{priceLabel}</Text>
          <Text style={styles.priceSub}>
            App access starts free for {GRUNTZ_TRIAL_DAYS} days, then continues with one simple monthly membership.
          </Text>
        </Card>

        <Card title="Included" style={styles.benefitsCard}>
          {benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <GameIcon name="check" size={20} color={colors.accentGreen} variant="minimal" animated={false} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </Card>

        {!isConfigured && accessState !== 'subscriber' ? (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>Billing not configured yet</Text>
            <Text style={styles.warningText}>
              RevenueCat keys are still missing for this build, so the subscription button will stay disabled until billing is wired up.
            </Text>
          </Card>
        ) : null}

        {pricingMismatch && accessState !== 'subscriber' ? (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>Pricing mismatch detected</Text>
            <Text style={styles.warningText}>
              RevenueCat is currently returning {livePriceLabel ?? 'an unexpected live price'} for this product. Gruntz should launch at {GRUNTZ_MONTHLY_PRICE_FALLBACK}. Fix the App Store Connect product `monthly` and RevenueCat offering `default` before enabling purchases.
            </Text>
          </Card>
        ) : null}

        {isConfigured ? (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {accessState === 'subscriber' ? 'Customer Center enabled' : 'Hosted RevenueCat paywall enabled'}
            </Text>
            <Text style={styles.infoText}>
              {accessState === 'subscriber'
                ? 'Manage billing, restore purchases, and handle subscription actions through RevenueCat Customer Center.'
                : 'The unlock button opens RevenueCat’s hosted paywall, so pricing, copy, and future experiments can be updated from the dashboard.'}
            </Text>
          </Card>
        ) : null}

        {lastError ? (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>Purchase issue</Text>
            <Text style={styles.warningText}>{lastError}</Text>
          </Card>
        ) : null}

        <MissionButton
          title={
            accessState === 'subscriber'
              ? 'OPEN CUSTOMER CENTER'
              : isConfigured
                ? 'UNLOCK GRUNTZ PRO'
                : 'BILLING UNAVAILABLE'
          }
          onPress={handlePrimary}
          disabled={isLoading || pricingMismatch || (!isConfigured && accessState !== 'subscriber')}
          style={styles.primaryButton}
        />

        {accessState !== 'subscriber' ? (
          <MissionButton
            title="RESTORE PURCHASES"
            onPress={handleRestore}
            variant="secondary"
            disabled={isLoading || !isConfigured}
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
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    heroBadge: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.accentGold,
      backgroundColor: colors.card,
      marginBottom: spacing.md,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accentGold,
      letterSpacing: 3,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 30,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    statusCard: {
      marginBottom: spacing.md,
    },
    statusLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 2,
      marginBottom: spacing.xs,
    },
    statusTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    statusBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    priceCard: {
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    priceLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    priceValue: {
      fontSize: 34,
      fontWeight: '900',
      color: colors.accent,
      marginVertical: spacing.sm,
    },
    priceSub: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textMuted,
      textAlign: 'center',
    },
    benefitsCard: {
      marginBottom: spacing.md,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    benefitText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    warningCard: {
      marginBottom: spacing.md,
      borderColor: colors.accentGold,
    },
    infoCard: {
      marginBottom: spacing.md,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    infoText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    warningTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accentGold,
      marginBottom: spacing.xs,
      letterSpacing: 1,
    },
    warningText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    primaryButton: {
      marginTop: spacing.sm,
    },
    secondaryButton: {
      marginTop: spacing.sm,
    },
  });
