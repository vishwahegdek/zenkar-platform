import React, { useState, useEffect, useMemo } from 'react';
import {
  StatusBar,
  ScrollView,
  View,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Estimator Components
import Header from './src/components/Header';
import TemplateSelector from './src/components/TemplateSelector';
import WoodTypeSelector from './src/components/WoodTypeSelector';
import DoorFrameForm from './src/components/DoorFrameForm';
import CustomBlocksForm from './src/components/CustomBlocksForm';
import LabourCarvingSection from './src/components/LabourCarvingSection';
import StickySummaryBar from './src/components/StickySummaryBar';
import SummaryDetailModal from './src/components/SummaryDetailModal';
import SavedEstimatesModal from './src/components/SavedEstimatesModal';
import WoodTypesModal from './src/components/WoodTypesModal';

// CEO Task Manager & Navigation
import CeoTaskManager from './src/ceo-tasks/CeoTaskManager';
import BottomNavBar from './src/components/BottomNavBar';
import { TaskStorage } from './src/ceo-tasks/taskStorage';

// Utilities
import { calculateEstimate, ESTIMATION_ENGINE_VERSION } from './src/utils/estimationEngine';
import { Storage, DEFAULT_WOOD_TYPES } from './src/utils/storage';
import { shareEstimate } from './src/utils/shareUtils';

const STANDARD_BLOCKS = {
  custom: [{ id: 'b1', pcs: '1', l: '', lu: 'ft', w: '', wu: 'in', t: '', tu: 'in' }],
  standard_door: [{ id: 'b1', pcs: '1', l: '7', lu: 'ft', w: '3', wu: 'ft', t: '1.5', tu: 'in' }],
  window_frame: [
    { id: 'b1', pcs: '1', l: '4', lu: 'ft', w: '4', wu: 'in', t: '2.5', tu: 'in' },
    { id: 'b2', pcs: '1', l: '4', lu: 'ft', w: '4', wu: 'in', t: '2.5', tu: 'in' },
    { id: 'b3', pcs: '1', l: '5', lu: 'ft', w: '4', wu: 'in', t: '2.5', tu: 'in' },
    { id: 'b4', pcs: '1', l: '5', lu: 'ft', w: '4', wu: 'in', t: '2.5', tu: 'in' },
  ],
};

const INITIAL_FORM_DATA = {
  activeTemplate: 'custom',
  // Door Frame
  dfThicknessOption: '5x3',
  dfCustomW: '',
  dfCustomWUnit: 'in',
  dfCustomT: '',
  dfCustomTUnit: 'in',
  dfHeight: '7',
  dfHeightUnit: 'ft',
  dfWidth: '3.5',
  dfWidthUnit: 'ft',
  excludeBottomPiece: false,
  // Border Frame
  hasBorder: false,
  borderThicknessOption: '4x1.5',
  borderCustomW: '',
  borderCustomWUnit: 'in',
  borderCustomT: '',
  borderCustomTUnit: 'in',
  hasArch: false,
  archHeight: '1',
  archHeightUnit: 'ft',
  // Multi Blocks
  blocks: STANDARD_BLOCKS.custom,
  // Carving & Labour
  hasCarving: false,
  carvingRateOption: '5',
  carvingRate: '',
  mainCarvingFace: 'w',
  fittingLabour: '1200',
  labourItems: [],
  version: ESTIMATION_ENGINE_VERSION,
};

function MainApp() {
  const insets = useSafeAreaInsets();
  // Safe status bar top inset on Android & iOS
  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28)
    : insets.top;
  const bottomPadding = insets.bottom;

  // App Section Tab: 'estimator' | 'ceo_tasks'
  const [activeAppTab, setActiveAppTab] = useState('ceo_tasks');
  const [p1Count, setP1Count] = useState(0);

  // Estimator State
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [woodTypes, setWoodTypes] = useState(DEFAULT_WOOD_TYPES);
  const [selectedWood, setSelectedWood] = useState(DEFAULT_WOOD_TYPES[0]);
  const [savedEstimates, setSavedEstimates] = useState([]);
  const [currentEstimateName, setCurrentEstimateName] = useState('');
  const [editingEstimateId, setEditingEstimateId] = useState(null);

  // Estimator Modals
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [libraryModalVisible, setLibraryModalVisible] = useState(false);
  const [woodModalVisible, setWoodModalVisible] = useState(false);

  // Initialize storage
  useEffect(() => {
    (async () => {
      // Wood Estimator storage
      const storedWoodTypes = await Storage.getWoodTypes();
      setWoodTypes(storedWoodTypes);

      const savedSelectedId = await Storage.getSelectedWoodId();
      if (savedSelectedId) {
        const found = storedWoodTypes.find((w) => w.id === savedSelectedId);
        if (found) setSelectedWood(found);
        else setSelectedWood(storedWoodTypes[0]);
      } else if (storedWoodTypes.length > 0) {
        setSelectedWood(storedWoodTypes[0]);
      }

      const storedEstimates = await Storage.getSavedEstimates();
      setSavedEstimates(storedEstimates);

      // CEO Tasks P1 count badge
      const ceoTasks = await TaskStorage.getTasks();
      const p1s = ceoTasks.filter((t) => !t.completed && t.priority === 1).length;
      setP1Count(p1s);
    })();
  }, []);

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectWood = async (wood) => {
    setSelectedWood(wood);
    await Storage.saveSelectedWoodId(wood.id);
  };

  // Switch Templates
  const handleSelectTemplate = (templateId) => {
    if (templateId === formData.activeTemplate) return;

    let newBlocks = formData.blocks;
    if (templateId === 'custom') newBlocks = STANDARD_BLOCKS.custom;
    else if (templateId === 'standard_door') newBlocks = STANDARD_BLOCKS.standard_door;
    else if (templateId === 'window_frame') newBlocks = STANDARD_BLOCKS.window_frame;

    updateFormData({
      activeTemplate: templateId,
      blocks: newBlocks,
    });
  };

  // Auto-sync labour when border is toggled in door frame
  useEffect(() => {
    if (formData.activeTemplate === 'door_frame') {
      if (formData.hasBorder) {
        updateFormData({
          fittingLabour: '2000',
          hasCarving: true,
        });
      } else {
        updateFormData({
          fittingLabour: '1200',
        });
      }
    }
  }, [formData.hasBorder, formData.activeTemplate]);

  // Real-time Calculation
  const estimateData = useMemo(() => {
    return calculateEstimate(
      {
        ...formData,
        selectedWoodId: selectedWood?.id,
      },
      woodTypes
    );
  }, [formData, selectedWood, woodTypes]);

  // Reset Form
  const handleReset = () => {
    Alert.alert('Reset Form', 'Start a new calculation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: () => {
          setFormData(INITIAL_FORM_DATA);
          setCurrentEstimateName('');
          setEditingEstimateId(null);
        },
      },
    ]);
  };

  // Save Estimate
  const handleSaveEstimate = async (name) => {
    try {
      const payload = {
        id: editingEstimateId || `est-${Date.now()}`,
        name: name,
        totalCost: estimateData.finalCost,
        data: {
          ...formData,
          selectedWoodId: selectedWood?.id,
        },
      };

      const saved = await Storage.saveEstimate(payload);
      setEditingEstimateId(saved.id);
      setCurrentEstimateName(saved.name);

      const updatedList = await Storage.getSavedEstimates();
      setSavedEstimates(updatedList);
      Alert.alert('Saved', `"${saved.name}" saved successfully to offline library!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save estimate');
    }
  };

  // Load Estimate
  const handleLoadEstimate = (item) => {
    if (!item?.data) return;
    setEditingEstimateId(item.id);
    setCurrentEstimateName(item.name);
    setFormData({
      ...INITIAL_FORM_DATA,
      ...item.data,
    });

    if (item.data.selectedWoodId) {
      const found = woodTypes.find((w) => w.id === item.data.selectedWoodId);
      if (found) setSelectedWood(found);
    }
  };

  // Delete Estimate
  const handleDeleteEstimate = async (id) => {
    try {
      const updated = await Storage.deleteEstimate(id);
      setSavedEstimates(updated);
      if (editingEstimateId === id) {
        setEditingEstimateId(null);
        setCurrentEstimateName('');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to delete estimate');
    }
  };

  // Update Wood Types
  const handleSaveWoodTypes = async (newTypes) => {
    setWoodTypes(newTypes);
    await Storage.saveWoodTypes(newTypes);
    if (selectedWood) {
      const refreshed = newTypes.find((w) => w.id === selectedWood.id);
      setSelectedWood(refreshed || newTypes[0]);
    }
  };

  // Native Share
  const handleShare = () => {
    shareEstimate(
      estimateData,
      formData,
      selectedWood,
      currentEstimateName || 'Estimate'
    );
  };

  return (
    <View style={[styles.rootContainer, { paddingTop: topPadding }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" translucent={true} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {activeAppTab === 'estimator' ? (
          /* =================== TAB 1: WOOD ESTIMATOR =================== */
          <View style={{ flex: 1 }}>
            {/* App Bar / Header */}
            <Header
              onOpenSaved={() => setLibraryModalVisible(true)}
              onOpenWoodManager={() => setWoodModalVisible(true)}
              onReset={handleReset}
              onShare={handleShare}
              savedCount={savedEstimates.length}
            />

            {/* Template Segment Selector */}
            <TemplateSelector
              activeTemplate={formData.activeTemplate}
              onSelectTemplate={handleSelectTemplate}
            />

            {/* Wood Species Horizontal Selector */}
            <WoodTypeSelector
              woodTypes={woodTypes}
              selectedWood={selectedWood}
              onSelectWood={handleSelectWood}
              onOpenWoodManager={() => setWoodModalVisible(true)}
            />

            {/* Main Scrollable Form Body */}
            <ScrollView
              style={styles.mainScroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {formData.activeTemplate === 'door_frame' ? (
                <DoorFrameForm
                  formData={formData}
                  updateFormData={updateFormData}
                  computedBlocks={estimateData.computedBlocks}
                  inventoryError={estimateData.inventoryError}
                  innerDimensions={estimateData.innerDimensions}
                />
              ) : (
                <CustomBlocksForm
                  blocks={formData.blocks}
                  onChangeBlocks={(newBlocks) => updateFormData({ blocks: newBlocks })}
                />
              )}

              {/* Labour & Carving Section */}
              <LabourCarvingSection
                formData={formData}
                updateFormData={updateFormData}
                carvingData={{
                  totalCarvingArea: estimateData.totalCarvingArea,
                  totalCarvingCost: estimateData.totalCarvingCost,
                }}
                finishingLabour={estimateData.finishingLabour}
                totalLabour={estimateData.totalLabour}
              />
            </ScrollView>

            {/* Sticky Mobile Summary Bar */}
            <StickySummaryBar
              estimateData={estimateData}
              selectedWood={selectedWood}
              onOpenDetails={() => setDetailModalVisible(true)}
              onOpenSave={() => setSaveModalVisible(true)}
            />

            {/* Estimator Modals */}
            <SummaryDetailModal
              visible={detailModalVisible}
              onClose={() => setDetailModalVisible(false)}
              estimateData={estimateData}
              formData={formData}
              selectedWood={selectedWood}
              onShare={handleShare}
              onOpenSave={() => setSaveModalVisible(true)}
            />

            <SavedEstimatesModal
              visible={saveModalVisible}
              onClose={() => setSaveModalVisible(false)}
              isSaveMode={true}
              currentEstimateName={currentEstimateName}
              totalCost={estimateData.finalCost}
              onSaveCurrent={handleSaveEstimate}
            />

            <SavedEstimatesModal
              visible={libraryModalVisible}
              onClose={() => setLibraryModalVisible(false)}
              isSaveMode={false}
              estimates={savedEstimates}
              onLoadEstimate={handleLoadEstimate}
              onDeleteEstimate={handleDeleteEstimate}
            />

            <WoodTypesModal
              visible={woodModalVisible}
              onClose={() => setWoodModalVisible(false)}
              woodTypes={woodTypes}
              onSaveWoodTypes={handleSaveWoodTypes}
            />
          </View>
        ) : (
          /* =================== TAB 2: CEO TASK MATRIX =================== */
          <CeoTaskManager />
        )}

        {/* Global Bottom Navigation Bar */}
        <View style={{ paddingBottom: bottomPadding, backgroundColor: '#0b1329' }}>
          <BottomNavBar
            activeTab={activeAppTab}
            onSelectTab={setActiveAppTab}
            p1Count={p1Count}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0f172a', // Matches header background for status bar
  },
  mainScroll: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
