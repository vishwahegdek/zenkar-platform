import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRIORITY_CONFIG } from './taskStorage';

export default function TaskItem({
  task,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  onToggleComplete,
  onPriorityHoldStart,
  onPriorityHoldMove,
  onPriorityHoldRelease,
  onPriorityHoldCancel,
  onPriorityQuickTap,
  onDelete,
  onChangeCategory,
}) {
  const pConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[4];
  const panY = useRef(new Animated.Value(0)).current;

  // Guarantee panY resets whenever not dragging or when task changes
  useEffect(() => {
    if (!isDragging) {
      panY.setValue(0);
    }
  }, [isDragging]);

  // Separate PanResponder for Priority Button click-and-hold vertical slider
  const holdTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const grantPosRef = useRef({ pageX: 0, pageY: 0 });
  const priorityScale = useRef(new Animated.Value(1)).current;

  const priorityPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const pageX =
          evt?.nativeEvent?.pageX ??
          gestureState?.x0 ??
          evt?.nativeEvent?.touches?.[0]?.pageX ??
          40;
        const pageY =
          evt?.nativeEvent?.pageY ??
          gestureState?.y0 ??
          evt?.nativeEvent?.touches?.[0]?.pageY ??
          300;

        grantPosRef.current = { pageX, pageY };
        isHoldingRef.current = false;

        Animated.spring(priorityScale, {
          toValue: 0.9,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }).start();

        holdTimerRef.current = setTimeout(() => {
          isHoldingRef.current = true;
          if (onPriorityHoldStart) {
            onPriorityHoldStart(task, grantPosRef.current);
          }
        }, 150);
      },
      onPanResponderMove: (evt, gestureState) => {
        // If movement occurs before timer expires, trigger slider immediately
        if (!isHoldingRef.current && Math.abs(gestureState.dy) > 4) {
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
          }
          isHoldingRef.current = true;
          if (onPriorityHoldStart) {
            onPriorityHoldStart(task, grantPosRef.current);
          }
        }

        if (isHoldingRef.current) {
          const currentFingerY = (grantPosRef.current.pageY || 300) + gestureState.dy;
          if (onPriorityHoldMove) {
            onPriorityHoldMove(currentFingerY);
          }
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(priorityScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }).start();

        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }

        if (isHoldingRef.current) {
          isHoldingRef.current = false;
          if (onPriorityHoldRelease) {
            onPriorityHoldRelease();
          }
        } else {
          if (onPriorityQuickTap) {
            onPriorityQuickTap(task);
          }
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(priorityScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }).start();

        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }

        if (isHoldingRef.current) {
          isHoldingRef.current = false;
          if (onPriorityHoldCancel) {
            onPriorityHoldCancel();
          }
        }
      },
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 2;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        panY.setValue(0);
        if (onDragStart) {
          onDragStart(task.id);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        panY.setValue(gestureState.dy);
        if (onDragMove) {
          onDragMove(task.id, gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (onDragEnd) {
          onDragEnd(task.id, gestureState.dy);
        }
        Animated.spring(panY, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        if (onDragCancel) {
          onDragCancel();
        }
        Animated.spring(panY, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.card,
        task.completed && styles.cardCompleted,
        isDragging && styles.cardDragging,
        isDragging && {
          transform: [{ translateY: panY }, { scale: 1.03 }],
          zIndex: 9999,
          elevation: 20,
        },
      ]}
    >
      {/* 1. Priority Button: Hold & Slide vertical slider */}
      <Animated.View
        style={[
          styles.priorityBadge,
          {
            backgroundColor: pConfig.bgColor,
            borderColor: pConfig.color,
            transform: [{ scale: priorityScale }],
          },
        ]}
        {...priorityPanResponder.panHandlers}
        accessibilityLabel={`Priority ${task.priority} (${pConfig.label}). Hold to open vertical slider and slide to switch.`}
        accessibilityRole="button"
      >
        <Text style={[styles.priorityNumber, { color: pConfig.color }]}>
          {pConfig.code}
        </Text>
      </Animated.View>

      {/* 2. Completion Checkbox */}
      <TouchableOpacity
        style={styles.checkboxArea}
        onPress={() => onToggleComplete(task.id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={task.completed ? '#10b981' : '#64748b'}
        />
      </TouchableOpacity>

      {/* 3. Task Title and Category */}
      <View style={styles.contentCol}>
        <Text
          style={[
            styles.titleText,
            task.completed && styles.titleTextCompleted,
          ]}
          numberOfLines={3}
        >
          {task.title}
        </Text>

        <TouchableOpacity
          onPress={() => onChangeCategory && onChangeCategory(task)}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryTag}>
            #{task.category || 'Inbox'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Action Controls: Drag Handle (strictly within section) + Delete */}
      <View style={styles.actionCol}>
        <View
          style={[styles.dragHandle, isDragging && styles.dragHandleActive]}
          {...panResponder.panHandlers}
          accessibilityLabel="Drag row up or down to reorder within priority"
          accessibilityRole="button"
        >
          <Ionicons
            name="reorder-three"
            size={22}
            color={isDragging ? '#38bdf8' : '#94a3b8'}
          />
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(task.id)}
          activeOpacity={0.7}
          accessibilityLabel="Delete task"
        >
          <Ionicons name="trash-outline" size={15} color="#ef444480" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  cardDragging: {
    borderColor: '#38bdf8',
    borderWidth: 2,
    backgroundColor: '#172554',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  cardCompleted: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    opacity: 0.6,
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumber: {
    fontSize: 14,
    fontWeight: '900',
  },
  checkboxArea: {
    padding: 2,
  },
  contentCol: {
    flex: 1,
    gap: 3,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    lineHeight: 19,
  },
  titleTextCompleted: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  categoryTag: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dragHandle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
  },
  dragHandleActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0369a130',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 2,
  },
});
