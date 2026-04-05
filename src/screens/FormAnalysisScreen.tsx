import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';
import { analyzeForm, FormAnalysis } from '../services/aiEngine';
import { exercises } from '../data/exercises';
import { hapticLight, hapticSuccess } from '../utils/haptics';

// Key exercises with rich form guidance
const FEATURED_EXERCISES = [
  'Push-Ups', 'Pull-Ups', 'Squats', 'Forward Plank',
  'Lunges', 'Burpees', 'Sit-Ups', 'Deadlift',
];

const ALL_EXERCISES = [...new Set(exercises.map((e) => e.name))].sort();

const PRIORITY_COLORS: Record<string, string> = {
  high: '#FF4444',
  medium: '#FFB020',
  low: '#44BB44',
};

export default function FormAnalysisScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FormAnalysis | null>(null);
  const [showAllExercises, setShowAllExercises] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const handleSelect = useCallback(async (exerciseName: string) => {
    hapticLight();
    setSelectedExercise(exerciseName);
    setAnalysis(null);

    try {
      const result = await analyzeForm(exerciseName);
      hapticSuccess();
      setAnalysis(result);
    } catch {
      setAnalysis(null);
    }
  }, []);

  const handleReset = () => {
    hapticLight();
    setSelectedExercise(null);
    setAnalysis(null);
  };

  const exerciseData = selectedExercise
    ? exercises.find((e) => e.name.toLowerCase() === selectedExercise.toLowerCase())
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {!analysis ? (
          <>
            <Text style={styles.heading}>SELECT AN EXERCISE</Text>
            <Text style={styles.subtitle}>Get detailed form guidance and common mistakes to avoid</Text>

            {/* Featured */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>POPULAR</Text>
              <View style={styles.grid}>
                {FEATURED_EXERCISES.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.exerciseCard, selectedExercise === name && styles.exerciseCardActive]}
                    onPress={() => handleSelect(name)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exerciseCardText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* All exercises */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.expandRow}
                onPress={() => setShowAllExercises(!showAllExercises)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>ALL EXERCISES ({ALL_EXERCISES.length})</Text>
                <Ionicons
                  name={showAllExercises ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {showAllExercises && ALL_EXERCISES.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.exerciseRow}
                  onPress={() => handleSelect(name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exerciseRowText}>{name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Analysis results */}
            <TouchableOpacity style={styles.backRow} onPress={handleReset} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={colors.accent} />
              <Text style={styles.backText}>Back to exercises</Text>
            </TouchableOpacity>

            <Text style={styles.analysisTitle}>{analysis.exerciseName}</Text>

            {/* Exercise description from data */}
            {exerciseData?.description && (
              <View style={styles.descCard}>
                <Text style={styles.descText}>{exerciseData.description}</Text>
              </View>
            )}

            {/* Form tips from exercise data */}
            {exerciseData?.form_tips && exerciseData.form_tips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>QUICK TIPS FROM YOUR PROGRAM</Text>
                {exerciseData.form_tips.map((tip, i) => (
                  <View key={i} style={styles.quickTip}>
                    <Text style={styles.quickTipBullet}>•</Text>
                    <Text style={styles.quickTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* AI-generated detailed analysis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DETAILED FORM GUIDE</Text>
              {analysis.tips.map((tip, i) => (
                <View key={i} style={styles.tipCard}>
                  <View style={styles.tipHeader}>
                    <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[tip.priority] || colors.textMuted }]} />
                    <Text style={styles.tipPriority}>{tip.priority.toUpperCase()} — {tip.area}</Text>
                  </View>
                  <Text style={styles.tipIssue}>{tip.issue}</Text>
                  <Text style={styles.tipText}>{tip.fix}</Text>
                </View>
              ))}
            </View>

            {/* Encouragement */}
            {analysis.encouragement && (
              <View style={styles.encourageCard}>
                <Text style={styles.encourageText}>💪 {analysis.encouragement}</Text>
              </View>
            )}

            {/* Camera — capture form photo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PHOTO ANALYSIS</Text>
              {photoUri ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => setPhotoUri(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={16} color={colors.accent} />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                  {isAnalyzingPhoto && (
                    <View style={styles.analyzingOverlay}>
                      <ActivityIndicator size="large" color={colors.accent} />
                      <Text style={styles.analyzingText}>Analyzing form...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.cameraButtons}>
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== 'granted') return;
                      const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ['images'],
                        quality: 0.7,
                        allowsEditing: true,
                        aspect: [3, 4],
                      });
                      if (!result.canceled && result.assets[0]) {
                        hapticLight();
                        setPhotoUri(result.assets[0].uri);
                        // Future: send base64 to GPT-4o for vision analysis
                        // const base64 = result.assets[0].base64;
                        // setIsAnalyzingPhoto(true);
                        // const photoAnalysis = await analyzeForm(selectedExercise!, base64);
                        // setIsAnalyzingPhoto(false);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera" size={22} color={colors.accent} />
                    <Text style={styles.cameraButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') return;
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        quality: 0.7,
                        allowsEditing: true,
                        aspect: [3, 4],
                      });
                      if (!result.canceled && result.assets[0]) {
                        hapticLight();
                        setPhotoUri(result.assets[0].uri);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="images" size={22} color={colors.accent} />
                    <Text style={styles.cameraButtonText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.cameraHint}>
                📸 Take a photo of your form for reference. AI vision analysis activates when you connect GPT-4o.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 120 },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  exerciseCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  exerciseCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '15',
  },
  exerciseCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseRowText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Analysis
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  descCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  quickTip: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: 4,
  },
  quickTipBullet: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
  },
  quickTipText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  tipCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tipPriority: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  tipIssue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  encourageCard: {
    backgroundColor: colors.accent + '15',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  encourageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  cameraButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cameraButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  retakeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background + 'CC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + 'BB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  analyzingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cameraHint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
