import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppScreen, UserRole, InspectionRecord, ConsumerReport, ExtractionResult, Product, RuleEvaluation } from '../types';
import {
  getStoredInspections,
  saveInspection,
  getStoredConsumerReports,
  saveConsumerReport,
  getOfflineQueue,
  syncOfflineQueueToServer
} from '../services/offlineStorage';
import { SAMPLE_PRODUCTS } from '../data/mockData';
import { evaluateExtractionAgainstRules } from '../services/ruleEngine';

interface AppContextType {
  userRole: UserRole;
  activeScreen: AppScreen;
  screenHistory: AppScreen[];
  officerProfile: {
    name: string;
    badge_id: string;
    zone: string;
    avatar: string;
  };
  consumerProfile: {
    name: string;
    phone: string;
  };
  inspections: InspectionRecord[];
  consumerReports: ConsumerReport[];
  currentProduct: Product | null;
  currentExtraction: ExtractionResult | null;
  currentEvaluations: RuleEvaluation[];
  isCompliant: boolean;
  totalViolations: number;
  totalPenalty: number;
  currentInspectionId: string | null;
  isOffline: boolean;
  offlineQueueCount: number;
  deviceFrame: boolean;
  toggleDeviceFrame: () => void;
  toggleOffline: () => void;
  navigateTo: (screen: AppScreen) => void;
  goBack: () => void;
  selectRole: (role: UserRole) => void;
  loginOfficer: (id: string, pass: string) => void;
  loginConsumer: (phone: string, otp: string) => void;
  logout: () => void;
  setAnalysisData: (product: Product, extraction: ExtractionResult) => void;
  finalizeInspection: (signDoc?: boolean) => InspectionRecord;
  submitNewConsumerReport: (note?: string) => ConsumerReport;
  syncOfflineQueue: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [activeScreen, setActiveScreen] = useState<AppScreen>('splash');
  const [screenHistory, setScreenHistory] = useState<AppScreen[]>(['splash']);
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [consumerReports, setConsumerReports] = useState<ConsumerReport[]>([]);

  // Current analysis state
  const [currentProduct, setCurrentProduct] = useState<Product | null>(SAMPLE_PRODUCTS[1].product);
  const [currentExtraction, setCurrentExtraction] = useState<ExtractionResult | null>(SAMPLE_PRODUCTS[1].extraction);
  const [currentEvaluations, setCurrentEvaluations] = useState<RuleEvaluation[]>([]);
  const [isCompliant, setIsCompliant] = useState<boolean>(false);
  const [totalViolations, setTotalViolations] = useState<number>(0);
  const [totalPenalty, setTotalPenalty] = useState<number>(0);
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(null);

  const officerProfile = {
    name: 'Insp. R. Kumar',
    badge_id: 'LM-DL-2024-8849',
    zone: 'Zone 4 • Delhi Central',
    avatar: 'RK'
  };

  const consumerProfile = {
    name: 'Ananya Sharma',
    phone: '+91 98765 43210'
  };

  // Load storage on initial mount
  useEffect(() => {
    const loadedInspections = getStoredInspections();
    const loadedReports = getStoredConsumerReports();
    setInspections(loadedInspections);
    setConsumerReports(loadedReports);

    // Load initial queue count
    setOfflineQueueCount(getOfflineQueue().length);

    // Listen to queue mutations & sync events
    const handleQueueUpdated = (e: any) => {
      setOfflineQueueCount(e.detail?.count ?? getOfflineQueue().length);
    };
    const handleQueueSynced = () => {
      setInspections(getStoredInspections());
      setOfflineQueueCount(0);
    };

    window.addEventListener('manak:queue-updated', handleQueueUpdated);
    window.addEventListener('manak:queue-synced', handleQueueSynced);

    // Initial evaluation for default sample
    const evalRes = evaluateExtractionAgainstRules(SAMPLE_PRODUCTS[1].extraction);
    setCurrentEvaluations(evalRes.evaluations);
    setIsCompliant(evalRes.is_compliant);
    setTotalViolations(evalRes.total_violations);
    setTotalPenalty(evalRes.total_penalty);

    return () => {
      window.removeEventListener('manak:queue-updated', handleQueueUpdated);
      window.removeEventListener('manak:queue-synced', handleQueueSynced);
    };
  }, []);

  const navigateTo = (screen: AppScreen) => {
    setScreenHistory(prev => [...prev, screen]);
    setActiveScreen(screen);
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      const prevScreen = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setActiveScreen(prevScreen);
    } else {
      if (userRole === 'officer') setActiveScreen('officer_dashboard');
      else if (userRole === 'consumer') setActiveScreen('consumer_dashboard');
      else setActiveScreen('role_select');
    }
  };

  const selectRole = (role: UserRole) => {
    setUserRole(role);
    if (role === 'officer') {
      navigateTo('officer_login');
    } else if (role === 'consumer') {
      navigateTo('consumer_login');
    }
  };

  const loginOfficer = (_id: string, _pass: string) => {
    setUserRole('officer');
    navigateTo('officer_dashboard');
  };

  const loginConsumer = (_phone: string, _otp: string) => {
    setUserRole('consumer');
    navigateTo('consumer_dashboard');
  };

  const logout = () => {
    setUserRole(null);
    navigateTo('role_select');
  };

  const setAnalysisData = (product: Product, extraction: ExtractionResult) => {
    setCurrentProduct(product);
    setCurrentExtraction(extraction);
    const evalRes = evaluateExtractionAgainstRules(extraction);
    setCurrentEvaluations(evalRes.evaluations);
    setIsCompliant(evalRes.is_compliant);
    setTotalViolations(evalRes.total_violations);
    setTotalPenalty(evalRes.total_penalty);
    setCurrentInspectionId(`insp-${Date.now().toString().slice(-6)}`);
  };

  const finalizeInspection = (signDoc: boolean = true): InspectionRecord => {
    const id = currentInspectionId || `insp-${Date.now().toString().slice(-6)}`;
    const newRecord: InspectionRecord = {
      id,
      product: currentProduct || SAMPLE_PRODUCTS[0].product,
      performed_by: {
        id: 'usr-officer-01',
        name: officerProfile.name,
        badge_id: officerProfile.badge_id,
        role: 'officer',
        zone: officerProfile.zone
      },
      mode: currentProduct?.source_type === 'ecommerce' ? 'url_check' : 'scan',
      status: isOffline ? 'provisional' : 'verified',
      geo: {
        lat: 28.6139,
        lng: 77.2090,
        address: 'Connaught Place, New Delhi - 110001'
      },
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      evidence_image: currentProduct?.image_url || SAMPLE_PRODUCTS[0].product.image_url,
      evidence_hash: `sha256-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      extraction: currentExtraction || SAMPLE_PRODUCTS[0].extraction,
      evaluations: currentEvaluations,
      is_compliant: isCompliant,
      total_violations: totalViolations,
      total_penalty: totalPenalty,
      is_signed: signDoc,
      signature_details: signDoc ? {
        signed_by: `${officerProfile.name} (Digital DSC)`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        provider: 'documenso',
        certificate_id: `DSC-IN-LM-${Date.now().toString().slice(-6)}`
      } : undefined,
      report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
      synced: !isOffline
    };

    saveInspection(newRecord);
    setInspections(prev => [newRecord, ...prev.filter(i => i.id !== id)]);

    if (isOffline) {
      setOfflineQueueCount(prev => prev + 1);
    }

    return newRecord;
  };

  const submitNewConsumerReport = (note?: string): ConsumerReport => {
    const refId = `MANAK-CR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const violations = currentEvaluations
      .filter(e => e.status === 'violation')
      .map(e => `${e.requirement_name} (${e.rule_source})`);

    const newReport: ConsumerReport = {
      id: `cr-${Date.now()}`,
      reference_id: refId,
      inspection_id: currentInspectionId || `insp-cr-${Date.now()}`,
      product_name: currentProduct?.title || 'Unknown Product',
      brand: currentProduct?.brand || 'Generic',
      product_image: currentProduct?.image_url || SAMPLE_PRODUCTS[1].product.image_url,
      violations_summary: violations.length > 0 ? violations : ['Suspected labeling discrepancy'],
      consumer_note: note || 'Reported via MANAK Consumer Self-Check.',
      submitted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'submitted',
      assigned_officer: 'Insp. R. Kumar (Delhi Central Zone 4)'
    };

    saveConsumerReport(newReport);
    setConsumerReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const syncOfflineQueue = async () => {
    await syncOfflineQueueToServer();
    setInspections(getStoredInspections());
    setOfflineQueueCount(0);
  };

  const toggleDeviceFrame = () => setDeviceFrame(prev => !prev);
  const toggleOffline = () => {
    setIsOffline(prev => {
      const next = !prev;
      if (!next && offlineQueueCount > 0) {
        syncOfflineQueue();
      }
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        activeScreen,
        screenHistory,
        officerProfile,
        consumerProfile,
        inspections,
        consumerReports,
        currentProduct,
        currentExtraction,
        currentEvaluations,
        isCompliant,
        totalViolations,
        totalPenalty,
        currentInspectionId,
        isOffline,
        offlineQueueCount,
        deviceFrame,
        toggleDeviceFrame,
        toggleOffline,
        navigateTo,
        goBack,
        selectRole,
        loginOfficer,
        loginConsumer,
        logout,
        setAnalysisData,
        finalizeInspection,
        submitNewConsumerReport,
        syncOfflineQueue
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
