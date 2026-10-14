import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRIORITY_CONFIG } from './taskStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRIORITY_LEVELS = [1, 2, 3, 4];

const PRIORITY_INFO = {
  1: { label: 'P1 CRITICAL', desc: 'Top priority • Immediate focus' },
  2: { label: 'P2 HIGH', desc: 'Strategic • Complete today' },
  3: { label: 'P3 MEDIUM', desc: 'Operational • Normal queue' },
  4: { label: 'P4 ROUTINE', desc: 'Backlog • Defer or delegate' },
};

export default function VerticalPrioritySlider({
  visible,
  currentPriority = 1,
  position = { top: 200, left: 20 },
}) {
  const safePriority = Number(currentPriority) >= 1 && Number(currentPriority) <= 4 ? Number(currentPriority) : 1;
  const initialY = (safePriority - 1) * 44;

  const animScale = useRef(new Animated.Value(0.85)).current;
  const calloutAnimY = useRef(new Animated.Value(initialY)).current;

  const pConfig = PRIORITY_CONFIG[safePriority] || PRIORITY_CONFIG[1];
  const pInfo = PRIORITY_INFO[safePriority] || PRIORITY_INFO[1];

  // Pop-in spring animation when visible
  useEffect(() => {
    if (visible) {
      animScale.setValue(0.85);
      Animated.spring(animScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Smoothly glide callout bubble to the active slot
  useEffect(() => {
    const targetY = (safePriority - 1) * 44;
    Animated.spring(calloutAnimY, {
      toValue: targetY,
      friction: 8,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [safePriority]);

  if (!visible) return null;

  const trackTop = !isNaN(position?.top) ? position.top : 180;
  const trackLeft = !isNaN(position?.left) ? position.left : 20;

  return (
    <View pointerEvents="box-none" style={styles.rootOverlay}>
      {/* Dimmed backdrop to give focus */}
      <View pointerEvents="none" style={styles.backdrop} />

      {/* Floating Vertical Slider Container */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sliderWrapper,
          {
            top: trackTop,
            left: trackLeft,
            transform: [{ scale: animScale }],
          },
        ]}
      >
        {/* The Vertical Track Capsule */}
        <View
          style={[
            styles.verticalTrack,
            {
              borderColor: pConfig.color,
              shadowColor: pConfig.color,
            },
          ]}
        >
          {PRIORITY_LEVELS.map((p) => {
            const isSelected = safePriority === p;
            const conf = PRIORITY_CONFIG[p];

            return (
              <View
                key={p}
                style={[
                  styles.slotContainer,
                  isSelected && {
                    backgroundColor: `${conf.color}35`,
                    borderColor: conf.color,
                  },
                ]}
              >
                {/* Active indicator dot */}
                {isSelected && (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: conf.color },
                    ]}
                  />
                )}

                <Text
                  style={[
                    styles.slotText,
                    isSelected
                      ? [styles.slotTextActive, { color: conf.color }]
                      : styles.slotTextInactive,
                  ]}
                >
                  P{p}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Dynamic Floating Callout Bubble beside the track */}
        <Animated.View
          style={[
            styles.calloutBubble,
            {
              left: 62,
              top: 6,
              transform: [{ translateY: calloutAnimY }],
              borderColor: pConfig.color,
              shadowColor: pConfig.color,
            },
          ]}
        >
          {/* Small notch pointing to the slider track */}
          <View
            style={[
              styles.calloutNotch,
              { borderRightColor: pConfig.color },
            ]}
          />

          <View style={styles.calloutContent}>
            <View style={styles.calloutTitleRow}>
              <View
                style={[
                  styles.calloutColorDot,
                  { backgroundColor: pConfig.color },
                ]}
              />
              <Text style={[styles.calloutTitle, { color: pConfig.color }]}>
                {pInfo.label}
              </Text>
            </View>

            <Text style={styles.calloutSub} numberOfLines={1}>
              {pInfo.desc}
            </Text>

            <View style={styles.releaseHintRow}>
              <Ionicons name="swap-vertical" size={12} color="#38bdf8" />
              <Text style={styles.releaseHintText}>Slide to change • Release to set</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 99999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#03071280',
  },
  sliderWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 999999,
    elevation: 99999,
  },
  verticalTrack: {
    width: 52,
    height: 188,
    borderRadius: 26,
    backgroundColor: '#0b1329',
    borderWidth: 2.5,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 25,
  },
  slotContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  slotTextActive: {
    fontWeight: '900',
    fontSize: 15,
  },
  slotTextInactive: {
    color: '#64748b',
  },
  calloutBubble: {
    position: 'absolute',
    width: 200,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 25,
  },
  calloutNotch: {
    position: 'absolute',
    left: -7,
    top: 14,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  calloutContent: {
    gap: 2,
  },
  calloutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calloutColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  calloutSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  releaseHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  releaseHintText: {
    fontSize: 9,
    color: '#38bdf8',
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
