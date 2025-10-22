// UploadProgressBar.js
// Story 1.4: Offline Image Processing Queue
// Implements: Task 5 (Upload progress UI component)

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * UploadProgressBar
 *
 * Progress bar component for showing upload progress.
 * Displays animated progress bar with percentage.
 *
 * Props:
 * - progress: Progress value (0-1)
 * - label: Optional label text
 * - showPercentage: Whether to show percentage text
 * - color: Progress bar color
 * - height: Progress bar height
 */
const UploadProgressBar = ({
  progress = 0,
  label = null,
  showPercentage = true,
  color = '#3b82f6',
  height = 6,
}) => {
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  // Animated progress width
  const progressWidth = clampedProgress * 100;

  return (
    <View style={styles.container}>
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && <Text style={styles.percentage}>{percentage}%</Text>}
        </View>
      )}

      {/* Progress Bar Background */}
      <View style={[styles.progressBackground, { height }]}>
        {/* Progress Bar Fill */}
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressWidth}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  percentage: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  progressBackground: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    transition: 'width 0.3s ease',
  },
});

export default UploadProgressBar;
