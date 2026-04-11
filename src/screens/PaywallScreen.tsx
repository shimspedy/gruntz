import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
  getAccessState,
  getTrialDaysRemaining,
  useSubscriptionStore,
} from '../store/useSubscriptionStore';

const benefits = [
  'Full Raider and Recon programs',
  'Unlimited daily mission access',
  'Workout cards, swim cards, and run support',
  'Progress, XP, streaks, and achievements',
  'Apple Health sync',
  'Exclusive daily challenges',
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

  useEffect(() => {
    if (!isConfigured || accessState === 'subscriber') {
      return;
    }
    loadOffering();
  }, [accessState, isConfigured, loadOffering]);

  const handlePrimary = async () => {
    try {
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
    } catch {
      // Store already sets lastError — nothing extra needed here
    }
  };

  const handleRestore = async () => {
    try {
      const result = await restoreAccess();
      if (result === 'restored') {
        navigation.goBack();
      }
    } catch {
      // Store already sets lastError
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeGlow} />
            <GameIcon name="rank" size={56} color={colors.accent} />
          </View>
          <Text style={styles.eyebrow}>BECOME ELITE</Text>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            {GRUNTZ_PRO_LABEL}
          </Text>
          <Text style={styles.subtitle}>
            Unlock the complete tactical training system.
          </Text>
        </View>

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
                <Text style={[styles.statusBadgeText, { color: colors.accent }]}>TRIAL</Text>
              </View>
              <Text style={styles.statusTitle}>{trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} left</Text>
              <Text style={styles.statusBody}>
                Every recruit gets {GRUNTZ_TRIAL_DAYS} days free. When that ends, upgrade to Pro to keep training.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.statusBadge}>
                <GameIcon name="lock" size={16} color={colors.accentRed} variant="minimal" animated={false} />
                <Text style={[styles.statusBadgeText, { color: colors.accentRed }]}>LOCKED</Text>
              </View>
              <Text style={styles.statusTitle}>Trial Expired</Text>
              <Text style={styles.statusBody}>
                Your free trial is over. Subscribe to unlock full programs, daily missions, and streaks.
              </Text>
            </>
          )}
        </GlassCard>

        {/* Price Card */}
        <GlassCard style={styles.priceCard} variant="accent">
          <Text style={styles.priceLabel}>{productTitle}</Text>
          <Text style={styles.priceValue}>{priceLabel}</Text>
          <Text style={styles.priceSub}>
            Start free for {GRUNTZ_TRIAL_DAYS} days, then {priceLabel}. Cancel anytime.
          </Text>
        </GlassCard>

        {/* Benefits Card */}
        <GlassCard style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What's Included</Text>
          {benefits.map((benefit, index) => (
            <View key={`${benefit}-${index}`} style={styles.benefitRow}>
              <View style={styles.benefitCheckbox}>
                <GameIcon name="check" size={16} color={colors.accent} variant="minimal" animated={false} />
              </View>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </GlassCard>

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

        {/* CTAs */}
        <MissionButton
          title={
            accessState === 'subscriber'
              ? 'MANAGE MEMBERSHIP'
              : isConfigured
                ? 'UNLOCK GRUNTZ PRO'
                : 'BILLING UNAVAILABLE'
          }
          onPress={handlePrimary}
          disabled={isLoading || (!isConfigured && accessState !== 'subscriber')}
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
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    heroBadge: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      position: 'relative',
    },
    heroBadgeGlow: {
      position: 'absolute',
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: colors.accent,
      opacity: 0.15,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 3,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 34,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: 'center',
      lineHeight: 22,
    },
    statusCard: {
      marginBottom: spacing.md,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      backgroundColor: `${colors.accent}15`,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      marginBottom: spacing.md,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 1,
    },
    statusTitle: {
      fontSize: 22,
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
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    priceValue: {
      fontSize: 40,
      fontWeight: '900',
      color: colors.accent,
      marginVertical: spacing.sm,
    },
    priceSub: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    benefitsCard: {
      marginBottom: spacing.md,
    },
    benefitsTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 1,
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
      width: 24,
      height: 24,
      borderRadius: borderRadius.sm,
      backgroundColor: `${colors.accent}12`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    benefitText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    warningCard: {
      marginBottom: spacing.md,
      borderColor: colors.accentOrange,
      borderWidth: 1,
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    warningTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accentOrange,
      letterSpacing: 0.5,
    },
    warningText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
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
  });
