import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { Card } from '../components/Card';
import { XPBar } from '../components/XPBar';
import { useUserStore } from '../store/useUserStore';
import { useProgramStore } from '../store/useProgramStore';
import { getXPToNextLevel } from '../utils/xp';
import { getRankInfo } from '../data/ranks';
import { getProgramById } from '../data/programs';
import type { ProfileStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { progress, profile } = useUserStore();
  const xpInfo = getXPToNextLevel(progress.current_xp);
  const rankInfo = getRankInfo(progress.current_rank);

  const { selectedProgram } = useProgramStore();
  const activeProgram = selectedProgram ? getProgramById(selectedProgram) : null;

  const menuItems = [
    { label: activeProgram ? `Program: ${activeProgram.name}` : 'Choose Program', icon: 'shield-outline' as const, screen: 'ProgramSelect' as const },
    { label: 'Avatar & Gear', icon: 'person-outline' as const, screen: 'Avatar' as const },
    { label: 'Recovery Hub', icon: 'fitness-outline' as const, screen: 'Recovery' as const },
    { label: 'Settings', icon: 'settings-outline' as const, screen: 'Settings' as const },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{rankInfo?.icon || '🔰'}</Text>
          </View>
          <Text style={styles.displayName}>{profile?.display_name || 'Warrior'}</Text>
          <Text style={styles.rankText}>{progress.current_rank} • Level {progress.current_level}</Text>
        </View>

        {/* XP Bar */}
        <Card style={styles.section}>
          <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
          <Text style={styles.totalXP}>{progress.current_xp.toLocaleString()} Total XP</Text>
        </Card>

        {/* Stats */}
        <Card title="Overall Stats" style={styles.section}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Missions Completed</Text>
            <Text style={styles.statValue}>{progress.workouts_completed}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{progress.streak_days} days</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Reps</Text>
            <Text style={styles.statValue}>{progress.total_reps.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Distance</Text>
            <Text style={styles.statValue}>{progress.total_distance_miles} mi</Text>
          </View>
        </Card>

        {/* Menu Items */}
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rankText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: spacing.md,
  },
  totalXP: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
