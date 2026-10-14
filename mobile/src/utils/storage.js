import AsyncStorage from '@react-native-async-storage/async-storage';

const WOOD_TYPES_KEY = '@zenkar_wood_types';
const SAVED_ESTIMATES_KEY = '@zenkar_saved_estimates';
const SELECTED_WOOD_KEY = '@zenkar_selected_wood';
const API_URL_KEY = '@zenkar_api_url';

export const DEFAULT_WOOD_TYPES = [
  { id: 'wood-teak', name: 'Teak (Sagavani)', price: 3800 },
  { id: 'wood-halasu', name: 'Halasu (Jackfruit)', price: 2400 },
  { id: 'wood-kindal', name: 'Kindal', price: 1500 },
  { id: 'wood-honne', name: 'Honne', price: 3200 },
  { id: 'wood-mahogany', name: 'Mahogany', price: 1900 },
  { id: 'wood-sal', name: 'Sal (Hunasalu)', price: 1700 },
  { id: 'wood-neem', name: 'Neem', price: 1300 },
];

export const Storage = {
  // --- Wood Types ---
  async getWoodTypes() {
    try {
      const data = await AsyncStorage.getItem(WOOD_TYPES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Seed default wood types
      await AsyncStorage.setItem(WOOD_TYPES_KEY, JSON.stringify(DEFAULT_WOOD_TYPES));
      return DEFAULT_WOOD_TYPES;
    } catch (e) {
      console.warn('Failed to load wood types:', e);
      return DEFAULT_WOOD_TYPES;
    }
  },

  async saveWoodTypes(types) {
    try {
      await AsyncStorage.setItem(WOOD_TYPES_KEY, JSON.stringify(types));
    } catch (e) {
      console.warn('Failed to save wood types:', e);
    }
  },

  async getSelectedWoodId() {
    try {
      return await AsyncStorage.getItem(SELECTED_WOOD_KEY);
    } catch (e) {
      return null;
    }
  },

  async saveSelectedWoodId(id) {
    try {
      if (id) await AsyncStorage.setItem(SELECTED_WOOD_KEY, id);
    } catch (e) {
      console.warn('Failed to save selected wood:', e);
    }
  },

  // --- Saved Estimates ---
  async getSavedEstimates() {
    try {
      const data = await AsyncStorage.getItem(SAVED_ESTIMATES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load estimates:', e);
      return [];
    }
  },

  async saveEstimate(estimate) {
    try {
      const list = await this.getSavedEstimates();
      const newEstimate = {
        id: estimate.id || `est-${Date.now()}`,
        name: estimate.name || 'Untitled Estimate',
        totalCost: estimate.totalCost || 0,
        createdAt: estimate.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: estimate.data
      };

      const existingIndex = list.findIndex(e => e.id === newEstimate.id);
      if (existingIndex >= 0) {
        list[existingIndex] = newEstimate;
      } else {
        list.unshift(newEstimate);
      }

      await AsyncStorage.setItem(SAVED_ESTIMATES_KEY, JSON.stringify(list));
      return newEstimate;
    } catch (e) {
      console.warn('Failed to save estimate:', e);
      throw e;
    }
  },

  async deleteEstimate(id) {
    try {
      const list = await this.getSavedEstimates();
      const updated = list.filter(e => e.id !== id);
      await AsyncStorage.setItem(SAVED_ESTIMATES_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to delete estimate:', e);
      throw e;
    }
  },

  // --- Optional API Sync Config ---
  async getApiBaseUrl() {
    try {
      return (await AsyncStorage.getItem(API_URL_KEY)) || 'https://orderdemo.zenkar.in/api';
    } catch {
      return 'https://orderdemo.zenkar.in/api';
    }
  },

  async setApiBaseUrl(url) {
    try {
      await AsyncStorage.setItem(API_URL_KEY, url);
    } catch (e) {
      console.warn('Failed to set API base URL:', e);
    }
  }
};
