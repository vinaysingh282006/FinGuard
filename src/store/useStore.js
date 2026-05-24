import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Core feeds
  transactions: [],
  alerts: [],
  whaleAlerts: [],

  // Live prices
  prices: {
    BTC: 98200.0,
    ETH: 3120.0,
    SOL: 220.5,
    USDT: 1.0,
  },

  // Active workspace selections
  selectedAddress: null,
  selectedTransaction: null,
  activeTab: 'dashboard', // 'dashboard', 'livefeed', 'network', 'alerts', 'geointel', 'aianalyst'

  // Platform statistics
  stats: {
    totalMonitored: 0,
    fraudAlertsCount: 0,
    whaleMovementsCount: 0,
    amlFlagsCount: 0,
    threatIndex: 42,
  },

  // UI state
  demoActive: false,
  isAIInvestigationOpen: false,
  isAIPanelOpen: false,
  speechEnabled: false,
  customAIPrompt: null,

  // AI Session Memory System
  aiMemory: {
    visitedAddresses: [],
    investigatedTxs: [],
    recentAlertsExplained: [],
    previousQuestions: [],
  },

  // Setters and state mutators
  setActiveTab: (tab) => set({ activeTab: tab }),

  setPrices: (newPrices) =>
    set((state) => ({
      prices: { ...state.prices, ...newPrices },
    })),

  setSelectedAddress: (address) =>
    set((state) => {
      const memory = state.aiMemory || { visitedAddresses: [], investigatedTxs: [], recentAlertsExplained: [], previousQuestions: [] };
      const visited = address && !memory.visitedAddresses.includes(address)
        ? [address, ...memory.visitedAddresses].slice(0, 10)
        : memory.visitedAddresses;
      return {
        selectedAddress: address,
        aiMemory: { ...memory, visitedAddresses: visited },
      };
    }),

  setSelectedTransaction: (tx) =>
    set((state) => {
      const memory = state.aiMemory || { visitedAddresses: [], investigatedTxs: [], recentAlertsExplained: [], previousQuestions: [] };
      const visited = tx && tx.hash && !memory.investigatedTxs.includes(tx.hash)
        ? [tx.hash, ...memory.investigatedTxs].slice(0, 10)
        : memory.investigatedTxs;
      return {
        selectedTransaction: tx,
        isAIInvestigationOpen: tx !== null,
        aiMemory: { ...memory, investigatedTxs: visited },
      };
    }),

  setAIInvestigationOpen: (isOpen) => set({ isAIInvestigationOpen: isOpen }),
  setAIPanelOpen: (isOpen) => set({ isAIPanelOpen: isOpen }),
  setSpeechEnabled: (enabled) => set({ speechEnabled: enabled }),
  setCustomAIPrompt: (prompt) => set({ customAIPrompt: prompt }),

  addVisitedAddress: (addr) =>
    set((state) => {
      const memory = state.aiMemory || { visitedAddresses: [], investigatedTxs: [], recentAlertsExplained: [], previousQuestions: [] };
      if (memory.visitedAddresses.includes(addr)) return {};
      return {
        aiMemory: {
          ...memory,
          visitedAddresses: [addr, ...memory.visitedAddresses].slice(0, 10),
        },
      };
    }),

  addInvestigatedTx: (hash) =>
    set((state) => {
      const memory = state.aiMemory || { visitedAddresses: [], investigatedTxs: [], recentAlertsExplained: [], previousQuestions: [] };
      if (memory.investigatedTxs.includes(hash)) return {};
      return {
        aiMemory: {
          ...memory,
          investigatedTxs: [hash, ...memory.investigatedTxs].slice(0, 10),
        },
      };
    }),

  addAlertExplained: (id) =>
    set((state) => {
      const memory = state.aiMemory || { visitedAddresses: [], investigatedTxs: [], recentAlertsExplained: [], previousQuestions: [] };
      if (memory.recentAlertsExplained.includes(id)) return {};
      return {
        aiMemory: {
          ...memory,
          recentAlertsExplained: [id, ...memory.recentAlertsExplained].slice(0, 10),
        },
      };
    }),

  addQuestionToMemory: (q) =>
    set((state) => {
      const memory = state.aiMemory || { visitedAddresses: [], investigatedTxs: [], recentAlertsExplained: [], previousQuestions: [] };
      return {
        aiMemory: {
          ...memory,
          previousQuestions: [q, ...memory.previousQuestions].slice(0, 5),
        },
      };
    }),

  clearAIMemory: () =>
    set({
      aiMemory: {
        visitedAddresses: [],
        investigatedTxs: [],
        recentAlertsExplained: [],
        previousQuestions: [],
      },
    }),

  addTransaction: (tx) => {
    set((state) => {
      const updatedTxList = [tx, ...state.transactions].slice(0, 1000);
      const totalMonitored = state.stats.totalMonitored + 1;
      
      let amlFlagsCount = state.stats.amlFlagsCount;
      if (tx.threatLevel === 'HIGH RISK' || tx.threatLevel === 'CRITICAL' || tx.threatLevel === 'ACTIVE LAUNDERING' || tx.threatLevel === 'FRAUD NETWORK DETECTED') {
        amlFlagsCount += 1;
      }

      // Calculate composite dynamic Threat Index based on recent transactions (average of last 20)
      const last20 = updatedTxList.slice(0, 20);
      const avgScore = last20.reduce((acc, curr) => acc + (curr.fraudScore || 0), 0) / (last20.length || 1);
      const dynamicThreatIndex = Math.min(100, Math.max(10, Math.round(avgScore)));

      return {
        transactions: updatedTxList,
        stats: {
          ...state.stats,
          totalMonitored,
          amlFlagsCount,
          threatIndex: dynamicThreatIndex,
        },
      };
    });
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
      stats: {
        ...state.stats,
        fraudAlertsCount: state.stats.fraudAlertsCount + 1,
      },
    }));
  },

  addWhaleAlert: (whaleAlert) => {
    set((state) => ({
      whaleAlerts: [whaleAlert, ...state.whaleAlerts].slice(0, 100),
      stats: {
        ...state.stats,
        whaleMovementsCount: state.stats.whaleMovementsCount + 1,
      },
    }));
  },

  setDemoActive: (active) => set({ demoActive: active }),

  resetStore: () =>
    set({
      transactions: [],
      alerts: [],
      whaleAlerts: [],
      selectedAddress: null,
      selectedTransaction: null,
      stats: {
        totalMonitored: 0,
        fraudAlertsCount: 0,
        whaleMovementsCount: 0,
        amlFlagsCount: 0,
        threatIndex: 42,
      },
      demoActive: false,
      isAIInvestigationOpen: false,
      isAIPanelOpen: false,
      speechEnabled: false,
      customAIPrompt: null,
      aiMemory: {
        visitedAddresses: [],
        investigatedTxs: [],
        recentAlertsExplained: [],
        previousQuestions: [],
      },
    }),
}));
