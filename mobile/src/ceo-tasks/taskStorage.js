import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_STORAGE_KEY = '@zenkar_ceo_tasks';
const CATEGORIES_STORAGE_KEY = '@zenkar_ceo_categories';

export const DEFAULT_CATEGORIES = [
  'Inbox',
  'Sawmill & Factory',
  'Clients & Sales',
  'Finance',
  'Strategy',
];

export const PRIORITY_CONFIG = {
  1: {
    code: '1',
    label: 'Critical',
    color: '#ef4444',
    bgColor: '#ef444420',
    borderColor: '#ef4444',
    textColor: '#ffffff',
  },
  2: {
    code: '2',
    label: 'High',
    color: '#f97316',
    bgColor: '#f9731620',
    borderColor: '#f97316',
    textColor: '#ffffff',
  },
  3: {
    code: '3',
    label: 'Medium',
    color: '#eab308',
    bgColor: '#eab30820',
    borderColor: '#eab308',
    textColor: '#ffffff',
  },
  4: {
    code: '4',
    label: 'Routine',
    color: '#10b981',
    bgColor: '#10b98120',
    borderColor: '#10b981',
    textColor: '#ffffff',
  },
};

export const INITIAL_TASKS = [
  {
    id: 'demo-1',
    title: 'Review Teak log procurement prices from Dandeli',
    priority: 1,
    category: 'Sawmill & Factory',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Follow up on Ramesh Villa quotation approval',
    priority: 2,
    category: 'Clients & Sales',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Reconcile weekly labour payouts with factory supervisor',
    priority: 3,
    category: 'Finance',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const TaskStorage = {
  async getTasks() {
    try {
      const data = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    } catch (e) {
      console.warn('Failed to get CEO tasks:', e);
      return INITIAL_TASKS;
    }
  },

  async saveTasks(tasks) {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save CEO tasks:', e);
    }
  },

  async getCategories() {
    try {
      const data = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    } catch (e) {
      console.warn('Failed to get categories:', e);
      return DEFAULT_CATEGORIES;
    }
  },

  async saveCategories(cats) {
    try {
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
    } catch (e) {
      console.warn('Failed to save categories:', e);
    }
  },
};
