import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QuickInput from './QuickInput';
import TaskItem from './TaskItem';
import VerticalPrioritySlider from './VerticalPrioritySlider';
import { TaskStorage, PRIORITY_CONFIG, DEFAULT_CATEGORIES } from './taskStorage';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CeoTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [viewMode, setViewMode] = useState('priority'); // 'priority' | 'category'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [showCompleted, setShowCompleted] = useState(false);

  // Drag & Drop State (Inter-Priority only)
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dropTargetState, setDropTargetState] = useState({ priority: null, index: null });

  const dropTargetRef = useRef({ priority: null, index: null });
  const sectionLayouts = useRef({});
  const itemLayouts = useRef({});
  const dragStartYRef = useRef(0);

  // Vertical Priority Slider State (Press & Hold)
  const [verticalSliderState, setVerticalSliderState] = useState({
    visible: false,
    taskId: null,
    currentPriority: 1,
    position: { top: 200, left: 20 },
  });
  const verticalSliderRef = useRef({
    visible: false,
    taskId: null,
    currentPriority: 1,
    trackTop: 200,
    containerOffsetY: 0,
  });

  const containerRef = useRef(null);
  const containerOffsetRef = useRef({ x: 0, y: 0 });

  const handleContainerLayout = () => {
    if (containerRef.current && containerRef.current.measureInWindow) {
      containerRef.current.measureInWindow((x, y) => {
        if (!isNaN(x) && !isNaN(y)) {
          containerOffsetRef.current = { x, y };
        }
      });
    }
  };

  // Category Edit / Add Modal
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Change task category modal
  const [activeTaskForCategoryChange, setActiveTaskForCategoryChange] = useState(null);

  // Load from Storage
  useEffect(() => {
    (async () => {
      const storedTasks = await TaskStorage.getTasks();
      const storedCats = await TaskStorage.getCategories();
      setTasks(storedTasks);
      setCategories(storedCats);
    })();
  }, []);

  // Save changes
  const saveAndSetTasks = async (newTasks) => {
    setTasks(newTasks);
    await TaskStorage.saveTasks(newTasks);
  };

  // Add Task
  const handleAddTask = async (taskData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      priority: taskData.priority || 1,
      category: taskData.category || 'Inbox',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    await saveAndSetTasks(updated);
  };

  // Toggle Complete
  const handleToggleComplete = async (taskId) => {
    if (draggingTaskId === taskId) {
      setDraggingTaskId(null);
      setScrollEnabled(true);
    }
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: !t.completed,
          completedAt: !t.completed ? new Date().toISOString() : null,
        };
      }
      return t;
    });
    await saveAndSetTasks(updated);
  };

  // Change Priority
  const handleSelectPriority = async (taskId, newPriority) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, priority: newPriority };
      }
      return t;
    });
    await saveAndSetTasks(updated);
  };

  // Click-and-Hold Vertical Priority Slider Handlers
  const handlePriorityHoldStart = (task, grantPos) => {
    setScrollEnabled(false);
    const initialPriority = Number(task.priority) || 1;

    // Guaranteed numbers with fallbacks
    const pageX = Number(grantPos?.pageX) || 40;
    const pageY = Number(grantPos?.pageY) || 300;

    // Convert screen coordinates to container local coordinates
    const localY = pageY - (containerOffsetRef.current.y || 0);
    const localX = pageX - (containerOffsetRef.current.x || 0);

    // Calculate vertical track top so current priority slot aligns with user finger
    const slotIndex = initialPriority - 1;
    const slotCenterOffset = 6 + slotIndex * 44 + 22;
    let top = localY - slotCenterOffset;

    // Clamp within viewport
    const minTop = 10;
    const maxTop = Math.max(minTop, SCREEN_HEIGHT - 260);
    if (isNaN(top)) {
      top = 150;
    } else {
      top = Math.max(minTop, Math.min(maxTop, top));
    }

    let left = Math.max(10, localX - 26);
    if (isNaN(left)) {
      left = 20;
    } else if (left + 240 > SCREEN_WIDTH) {
      left = Math.max(10, SCREEN_WIDTH - 240);
    }

    verticalSliderRef.current = {
      visible: true,
      taskId: task.id,
      currentPriority: initialPriority,
      trackTop: top,
      containerOffsetY: containerOffsetRef.current.y || 0,
    };

    setVerticalSliderState({
      visible: true,
      taskId: task.id,
      currentPriority: initialPriority,
      position: { top, left },
    });

    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(10);
      }
    } catch (e) {}
  };

  const handlePriorityHoldMove = (fingerY) => {
    if (!verticalSliderRef.current.visible) return;
    const { trackTop, currentPriority, containerOffsetY } = verticalSliderRef.current;

    const safeFingerY = Number(fingerY) || 300;
    const localFingerY = safeFingerY - (containerOffsetY || 0);

    const relativeY = localFingerY - trackTop - 6;
    let slot = Math.floor(relativeY / 44) + 1;
    if (isNaN(slot) || slot < 1) slot = 1;
    if (slot > 4) slot = 4;

    if (slot !== currentPriority) {
      verticalSliderRef.current.currentPriority = slot;
      setVerticalSliderState((prev) => ({
        ...prev,
        currentPriority: slot,
      }));

      try {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          Vibration.vibrate(8);
        }
      } catch (e) {}
    }
  };

  const handlePriorityHoldRelease = async () => {
    setScrollEnabled(true);
    if (!verticalSliderRef.current.visible) return;

    const { taskId, currentPriority } = verticalSliderRef.current;
    verticalSliderRef.current.visible = false;
    setVerticalSliderState((prev) => ({
      ...prev,
      visible: false,
    }));

    if (taskId && currentPriority) {
      await handleSelectPriority(taskId, currentPriority);
    }
  };

  const handlePriorityHoldCancel = () => {
    setScrollEnabled(true);
    verticalSliderRef.current.visible = false;
    setVerticalSliderState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const handlePriorityQuickTap = async (task) => {
    const nextP = (task.priority % 4) + 1;
    await handleSelectPriority(task.id, nextP);
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(10);
      }
    } catch (e) {}
  };

  // Delete
  const handleDeleteTask = async (taskId) => {
    if (draggingTaskId === taskId) {
      setDraggingTaskId(null);
      setScrollEnabled(true);
    }
    const updated = tasks.filter((t) => t.id !== taskId);
    await saveAndSetTasks(updated);
  };

  // Add New Category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const name = newCategoryName.trim();
    if (categories.includes(name)) {
      Alert.alert('Exists', 'Category already exists');
      return;
    }
    const updated = [...categories, name];
    setCategories(updated);
    await TaskStorage.saveCategories(updated);
    setNewCategoryName('');
    setCategoryModalVisible(false);
  };

  // Change category of a task
  const handleSelectNewCategoryForTask = async (newCat) => {
    if (!activeTaskForCategoryChange) return;
    const updated = tasks.map((t) => {
      if (t.id === activeTaskForCategoryChange.id) {
        return { ...t, category: newCat };
      }
      return t;
    });
    await saveAndSetTasks(updated);
    setActiveTaskForCategoryChange(null);
  };

  // Stats
  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const p1Count = useMemo(() => activeTasks.filter((t) => t.priority === 1).length, [activeTasks]);
  const p2Count = useMemo(() => activeTasks.filter((t) => t.priority === 2).length, [activeTasks]);

  // Tasks to display based on viewMode and filters
  const visibleTasks = useMemo(() => {
    let list = showCompleted ? tasks : activeTasks;
    if (viewMode === 'category' && selectedCategoryFilter !== 'All') {
      list = list.filter((t) => t.category === selectedCategoryFilter);
    }
    return list;
  }, [tasks, activeTasks, showCompleted, viewMode, selectedCategoryFilter]);

  const draggingTask = useMemo(
    () => tasks.find((t) => t.id === draggingTaskId) || null,
    [tasks, draggingTaskId]
  );

  // ==========================================
  // Layout Recording
  // ==========================================
  const handleSectionLayout = (pNum, layout) => {
    sectionLayouts.current[pNum] = layout;
  };

  const handleItemLayout = (taskId, pNum, layout) => {
    const secY = sectionLayouts.current[pNum]?.y || 0;
    itemLayouts.current[taskId] = {
      y: secY + layout.y,
      height: layout.height,
      priority: pNum,
    };
  };

  const handleCategoryItemLayout = (taskId, layout) => {
    itemLayouts.current[taskId] = {
      y: layout.y,
      height: layout.height,
      priority: null,
    };
  };

  // ==========================================
  // Priority View Drag Handlers (Inter-Priority Only)
  // ==========================================
  const handlePriorityDragStart = (taskId) => {
    setScrollEnabled(false);
    setDraggingTaskId(taskId);
    const itm = itemLayouts.current[taskId];
    const currTask = tasks.find((t) => t.id === taskId);
    const currentP = currTask ? currTask.priority : 1;
    const startY = itm ? itm.y + itm.height / 2 : (currentP * 120);
    dragStartYRef.current = startY;

    // Drop target is strictly within current priority
    dropTargetRef.current = { priority: currentP, index: 0 };
    setDropTargetState({ priority: currentP, index: 0 });
  };

  const handlePriorityDragMove = (taskId, dy) => {
    const currentY = dragStartYRef.current + dy;
    const currTask = tasks.find((t) => t.id === taskId);
    if (!currTask) return;
    const currentP = currTask.priority;

    // Slot tasks in the current priority group (excluding the dragged item)
    const slotTasks = visibleTasks.filter(
      (t) => t.priority === currentP && t.id !== taskId
    );

    let targetIdx = slotTasks.length;
    for (let i = 0; i < slotTasks.length; i++) {
      const itm = itemLayouts.current[slotTasks[i].id];
      if (itm) {
        const centerY = itm.y + itm.height / 2;
        if (currentY < centerY) {
          targetIdx = i;
          break;
        }
      }
    }

    if (
      dropTargetRef.current.priority !== currentP ||
      dropTargetRef.current.index !== targetIdx
    ) {
      dropTargetRef.current = { priority: currentP, index: targetIdx };
      setDropTargetState({ priority: currentP, index: targetIdx });
    }
  };

  const handlePriorityDragEnd = async (taskId, dy) => {
    setScrollEnabled(true);
    const targetIdx = dropTargetRef.current.index;

    setDraggingTaskId(null);
    setDropTargetState({ priority: null, index: null });

    if (targetIdx === null) return;

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;
    const currentP = currentTask.priority;

    // Reorder strictly within current priority
    const updated = [...tasks];
    const currMasterIdx = updated.findIndex((t) => t.id === taskId);
    if (currMasterIdx === -1) return;

    const [draggedItem] = updated.splice(currMasterIdx, 1);

    const targetGroup = updated.filter(
      (t) => (!showCompleted ? !t.completed : true) && t.priority === currentP
    );

    if (targetGroup.length === 0 || targetIdx >= targetGroup.length) {
      if (targetGroup.length > 0) {
        const lastItem = targetGroup[targetGroup.length - 1];
        const lastMasterIdx = updated.findIndex((t) => t.id === lastItem.id);
        updated.splice(lastMasterIdx + 1, 0, draggedItem);
      } else {
        updated.push(draggedItem);
      }
    } else {
      const targetNeighbor = targetGroup[targetIdx];
      const targetMasterIdx = updated.findIndex((t) => t.id === targetNeighbor.id);
      updated.splice(targetMasterIdx, 0, draggedItem);
    }

    await saveAndSetTasks(updated);
  };

  // ==========================================
  // Category View Drag Handlers (Global Linear)
  // ==========================================
  const handleCategoryDragStart = (taskId) => {
    setScrollEnabled(false);
    setDraggingTaskId(taskId);
    const itm = itemLayouts.current[taskId];
    const startY = itm ? itm.y + itm.height / 2 : 100;
    dragStartYRef.current = startY;

    dropTargetRef.current = { priority: null, index: 0 };
    setDropTargetState({ priority: null, index: 0 });
  };

  const handleCategoryDragMove = (taskId, dy) => {
    const currentY = dragStartYRef.current + dy;
    const otherTasks = visibleTasks.filter((t) => t.id !== taskId);

    let targetIdx = otherTasks.length;
    for (let i = 0; i < otherTasks.length; i++) {
      const itm = itemLayouts.current[otherTasks[i].id];
      if (itm) {
        const centerY = itm.y + itm.height / 2;
        if (currentY < centerY) {
          targetIdx = i;
          break;
        }
      }
    }

    if (dropTargetRef.current.index !== targetIdx) {
      dropTargetRef.current = { priority: null, index: targetIdx };
      setDropTargetState({ priority: null, index: targetIdx });
    }
  };

  const handleCategoryDragEnd = async (taskId, dy) => {
    setScrollEnabled(true);
    const targetIdx = dropTargetRef.current.index;

    setDraggingTaskId(null);
    setDropTargetState({ priority: null, index: null });

    if (targetIdx === null) return;

    const otherTasks = visibleTasks.filter((t) => t.id !== taskId);
    const updated = [...tasks];
    const currMasterIdx = updated.findIndex((t) => t.id === taskId);
    if (currMasterIdx === -1) return;

    const [draggedItem] = updated.splice(currMasterIdx, 1);

    if (otherTasks.length === 0 || targetIdx >= otherTasks.length) {
      if (otherTasks.length > 0) {
        const lastItem = otherTasks[otherTasks.length - 1];
        const lastIdx = updated.findIndex((t) => t.id === lastItem.id);
        updated.splice(lastIdx + 1, 0, draggedItem);
      } else {
        updated.push(draggedItem);
      }
    } else {
      const targetNeighbor = otherTasks[targetIdx];
      const targetMasterIdx = updated.findIndex((t) => t.id === targetNeighbor.id);
      updated.splice(targetMasterIdx, 0, draggedItem);
    }

    await saveAndSetTasks(updated);
  };

  const handleDragCancel = () => {
    setScrollEnabled(true);
    setDraggingTaskId(null);
    setDropTargetState({ priority: null, index: null });
  };

  // ==========================================
  // Visual Drop Indicator Renderer
  // ==========================================
  const renderPriorityDropIndicator = (targetP) => {
    const pConfig = PRIORITY_CONFIG[targetP] || PRIORITY_CONFIG[4];

    return (
      <View style={styles.dropIndicatorContainer}>
        <View style={[styles.dropIndicatorLine, { backgroundColor: pConfig.color }]} />
        <View
          style={[
            styles.dropIndicatorBadge,
            {
              borderColor: pConfig.color,
              backgroundColor: `${pConfig.color}25`,
            },
          ]}
        >
          <Ionicons
            name="reorder-two"
            size={12}
            color={pConfig.color}
          />
          <Text style={[styles.dropIndicatorText, { color: pConfig.color }]}>
            REORDER HERE
          </Text>
        </View>
        <View style={[styles.dropIndicatorLine, { backgroundColor: pConfig.color }]} />
      </View>
    );
  };

  const renderCategoryDropIndicator = () => (
    <View style={styles.dropIndicatorContainer}>
      <View style={styles.dropIndicatorLine} />
      <View style={styles.dropIndicatorBadge}>
        <Ionicons name="arrow-down-circle" size={12} color="#38bdf8" />
        <Text style={styles.dropIndicatorText}>DROP HERE</Text>
      </View>
      <View style={styles.dropIndicatorLine} />
    </View>
  );

  return (
    <View
      ref={containerRef}
      onLayout={handleContainerLayout}
      style={styles.container}
    >
      {/* 1. Header Bar: CEO Metrics & Minimal Actions */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>CEO Command Matrix</Text>
          <View style={styles.metricsRow}>
            <View style={[styles.metricPill, { backgroundColor: '#ef444425' }]}>
              <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.metricText, { color: '#f87171' }]}>
                {p1Count} P1 Critical
              </Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: '#f9731620' }]}>
              <View style={[styles.dot, { backgroundColor: '#f97316' }]} />
              <Text style={[styles.metricText, { color: '#fb923c' }]}>
                {p2Count} P2 High
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetags-outline" size={17} color="#38bdf8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Quick Input Bar (Lightning Fast Task Creation) */}
      <QuickInput
        categories={categories}
        onAddTask={handleAddTask}
        onAddCategory={() => setCategoryModalVisible(true)}
      />

      {/* 3. View Switcher Bar (Minimal: By Priority vs By Category) */}
      <View style={styles.viewSwitcherBar}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              viewMode === 'priority' && styles.segmentBtnActive,
            ]}
            onPress={() => setViewMode('priority')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="funnel-outline"
              size={13}
              color={viewMode === 'priority' ? '#ffffff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.segmentText,
                viewMode === 'priority' && styles.segmentTextActive,
              ]}
            >
              Priority
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              viewMode === 'category' && styles.segmentBtnActive,
            ]}
            onPress={() => setViewMode('category')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="folder-outline"
              size={13}
              color={viewMode === 'category' ? '#ffffff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.segmentText,
                viewMode === 'category' && styles.segmentTextActive,
              ]}
            >
              Category
            </Text>
          </TouchableOpacity>
        </View>

        {/* Toggle Completed */}
        <TouchableOpacity
          style={[
            styles.completedFilterBtn,
            showCompleted && styles.completedFilterBtnActive,
          ]}
          onPress={() => setShowCompleted(!showCompleted)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showCompleted ? 'eye-outline' : 'eye-off-outline'}
            size={13}
            color={showCompleted ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.completedFilterText,
              showCompleted && styles.completedFilterTextActive,
            ]}
          >
            {showCompleted ? 'Done' : 'Active'} ({showCompleted ? completedTasks.length : activeTasks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Category Filter Bar (Only in category view) */}
      {viewMode === 'category' && (
        <View style={styles.categoryFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterScroll}
          >
            {['All', ...categories].map((cat) => {
              const isSelected = selectedCategoryFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catFilterChip,
                    isSelected && styles.catFilterChipActive,
                  ]}
                  onPress={() => setSelectedCategoryFilter(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.catFilterText,
                      isSelected && styles.catFilterTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 5. Main Task List */}
      <ScrollView
        style={styles.tasksScroll}
        contentContainerStyle={styles.tasksScrollContent}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'priority' ? (
          /* Priority Grouped View (Inter-Priority Drag & Drop Reorder) */
          [1, 2, 3, 4].map((pNum) => {
            const pConfig = PRIORITY_CONFIG[pNum];
            const groupTasks = visibleTasks.filter((t) => t.priority === pNum);
            const isDraggingFromThis = draggingTask && draggingTask.priority === pNum;
            const isTargetSection = draggingTaskId && dropTargetState.priority === pNum;

            if (groupTasks.length === 0) return null;

            const slotTasks = groupTasks.filter((t) => t.id !== draggingTaskId);

            return (
              <View
                key={pNum}
                onLayout={(e) => handleSectionLayout(pNum, e.nativeEvent.layout)}
                style={[
                  styles.prioritySection,
                  isDraggingFromThis && styles.prioritySectionActive,
                  isTargetSection && styles.prioritySectionTarget,
                ]}
              >
                <View style={styles.prioritySectionHeader}>
                  <View
                    style={[
                      styles.prioritySectionBadge,
                      { backgroundColor: pConfig.color },
                    ]}
                  >
                    <Text style={styles.prioritySectionBadgeText}>{pConfig.code}</Text>
                  </View>
                  <Text style={[styles.prioritySectionTitle, { color: pConfig.color }]}>
                    {pConfig.label.toUpperCase()} ({groupTasks.length})
                  </Text>
                </View>

                {/* Render tasks in this section */}
                {groupTasks.map((task) => {
                  const isDraggingThis = draggingTaskId === task.id;
                  const slotIdx = slotTasks.findIndex((t) => t.id === task.id);
                  const showDropAbove =
                    isTargetSection &&
                    dropTargetState.index === slotIdx;
                  const showDropBelow =
                    isTargetSection &&
                    slotIdx === slotTasks.length - 1 &&
                    dropTargetState.index >= slotTasks.length;

                  return (
                    <View
                      key={task.id}
                      onLayout={(e) => handleItemLayout(task.id, pNum, e.nativeEvent.layout)}
                      style={[
                        styles.itemWrapper,
                        isDraggingThis && styles.itemWrapperDragging,
                      ]}
                    >
                      {showDropAbove && renderPriorityDropIndicator(pNum)}
                      <TaskItem
                        task={task}
                        isDragging={isDraggingThis}
                        onDragStart={handlePriorityDragStart}
                        onDragMove={handlePriorityDragMove}
                        onDragEnd={handlePriorityDragEnd}
                        onDragCancel={handleDragCancel}
                        onToggleComplete={handleToggleComplete}
                        onPriorityHoldStart={handlePriorityHoldStart}
                        onPriorityHoldMove={handlePriorityHoldMove}
                        onPriorityHoldRelease={handlePriorityHoldRelease}
                        onPriorityHoldCancel={handlePriorityHoldCancel}
                        onPriorityQuickTap={handlePriorityQuickTap}
                        onDelete={handleDeleteTask}
                        onChangeCategory={(t) => setActiveTaskForCategoryChange(t)}
                      />
                      {showDropBelow && renderPriorityDropIndicator(pNum)}
                    </View>
                  );
                })}
              </View>
            );
          })
        ) : (
          /* Category / Linear View with Drag and Drop Reordering */
          (() => {
            const slotTasks = visibleTasks.filter((t) => t.id !== draggingTaskId);
            return visibleTasks.map((task) => {
              const isDraggingThis = draggingTaskId === task.id;
              const slotIdx = slotTasks.findIndex((t) => t.id === task.id);
              const showDropAbove =
                draggingTaskId &&
                dropTargetState.index === slotIdx;
              const showDropBelow =
                draggingTaskId &&
                slotIdx === slotTasks.length - 1 &&
                dropTargetState.index >= slotTasks.length;

              return (
                <View
                  key={task.id}
                  onLayout={(e) => handleCategoryItemLayout(task.id, e.nativeEvent.layout)}
                  style={[
                    styles.itemWrapper,
                    isDraggingThis && styles.itemWrapperDragging,
                  ]}
                >
                  {showDropAbove && renderCategoryDropIndicator()}
                  <TaskItem
                    task={task}
                    isDragging={isDraggingThis}
                    onDragStart={handleCategoryDragStart}
                    onDragMove={handleCategoryDragMove}
                    onDragEnd={handleCategoryDragEnd}
                    onDragCancel={handleDragCancel}
                    onToggleComplete={handleToggleComplete}
                    onPriorityHoldStart={handlePriorityHoldStart}
                    onPriorityHoldMove={handlePriorityHoldMove}
                    onPriorityHoldRelease={handlePriorityHoldRelease}
                    onPriorityHoldCancel={handlePriorityHoldCancel}
                    onPriorityQuickTap={handlePriorityQuickTap}
                    onDelete={handleDeleteTask}
                    onChangeCategory={(t) => setActiveTaskForCategoryChange(t)}
                  />
                  {showDropBelow && renderCategoryDropIndicator()}
                </View>
              );
            });
          })()
        )}

        {visibleTasks.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-all" size={42} color="#334155" />
            <Text style={styles.emptyTitle}>All clear, CEO</Text>
            <Text style={styles.emptySub}>
              Type a task above to capture action items instantly.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 6. Modal: Add Category */}
      <Modal
        visible={categoryModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Categories</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                placeholder="New Category (e.g. Legal, HR)"
                placeholderTextColor="#64748b"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <TouchableOpacity
                style={styles.modalAddBtn}
                onPress={handleCreateCategory}
                activeOpacity={0.7}
              >
                <Text style={styles.modalAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.existingCatsLabel}>EXISTING CATEGORIES:</Text>
            <View style={styles.existingCatsList}>
              {categories.map((c) => (
                <View key={c} style={styles.existingCatPill}>
                  <Text style={styles.existingCatText}>#{c}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. Modal: Quick Category Changer for Task */}
      <Modal
        visible={!!activeTaskForCategoryChange}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveTaskForCategoryChange(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setActiveTaskForCategoryChange(null)}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryGrid}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.categoryGridItem,
                    activeTaskForCategoryChange?.category === c &&
                      styles.categoryGridItemActive,
                  ]}
                  onPress={() => handleSelectNewCategoryForTask(c)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryGridItemText,
                      activeTaskForCategoryChange?.category === c &&
                        styles.categoryGridItemTextActive,
                    ]}
                  >
                    #{c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* 8. Vertical Priority Slider (Hold & Slide overlay) */}
      <VerticalPrioritySlider
        visible={verticalSliderState.visible}
        currentPriority={verticalSliderState.currentPriority}
        position={verticalSliderState.position}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#0f172a',
  },
  headerLeft: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricText: {
    fontSize: 10,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#0284c7',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  completedFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  completedFilterBtnActive: {
    borderColor: '#10b98140',
    backgroundColor: '#064e3b30',
  },
  completedFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  completedFilterTextActive: {
    color: '#34d399',
    fontWeight: '700',
  },
  categoryFilterContainer: {
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  categoryFilterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  catFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  catFilterChipActive: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  catFilterText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  catFilterTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  tasksScroll: {
    flex: 1,
  },
  tasksScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  prioritySection: {
    marginBottom: 16,
    zIndex: 1,
  },
  prioritySectionActive: {
    zIndex: 9999,
    elevation: 20,
  },
  prioritySectionTarget: {
    backgroundColor: '#0f172a50',
    borderRadius: 12,
    padding: 4,
  },
  prioritySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  prioritySectionBadge: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioritySectionBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  prioritySectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptySectionDropZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#334155',
    backgroundColor: '#0f172a40',
    marginBottom: 8,
  },
  emptySectionDropText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  itemWrapper: {
    zIndex: 1,
  },
  itemWrapperDragging: {
    zIndex: 9999,
    elevation: 20,
  },
  dropIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 8,
  },
  dropIndicatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#38bdf8',
    borderRadius: 1,
  },
  dropIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0369a140',
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dropIndicatorText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  modalInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modalInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalAddBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  existingCatsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  existingCatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  existingCatPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  existingCatText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryGrid: {
    gap: 8,
  },
  categoryGridItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryGridItemActive: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  categoryGridItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  categoryGridItemTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
