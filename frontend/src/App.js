import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIHistory from './pages/AIHistory';
import Profile from './pages/Profile';
import DocumentVault from './pages/DocumentVault';
import TripCollaboration from './pages/TripCollaboration';
import TripInspiration from './pages/TripInspiration';
import DayOfMode from './pages/DayOfMode';
import VisaAdvisor from './pages/VisaAdvisor';
import InsuranceRecommender from './pages/InsuranceRecommender';
import DynamicAdjuster from './pages/DynamicAdjuster';
import CustomViewsPage from './pages/CustomViewsPage';
import Sidebar from './components/Sidebar';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// === Batch 08 Gaps & Frontend Mounts ===
import CfDynamicItineraryAdjustmentForRealTimeDelay from './pages/CfDynamicItineraryAdjustmentForRealTimeDelay'
import CfLocalCurrencySpendingTrackerWithMultiCurrency from './pages/CfLocalCurrencySpendingTrackerWithMultiCurrency'
import CfTravelCommunityFeaturesShareTripsFollowTravelers from './pages/CfTravelCommunityFeaturesShareTripsFollowTravelers'
import CfVisaDocumentAdvisorCheckingRequirementsByDestination from './pages/CfVisaDocumentAdvisorCheckingRequirementsByDestination'
import CfTravelInsuranceRecommenderAssessingNeedsAndPlans from './pages/CfTravelInsuranceRecommenderAssessingNeedsAndPlans'
import CfGroupTripCostSplitterWithSplitwiseStyle from './pages/CfGroupTripCostSplitterWithSplitwiseStyle'
import GapAiCoverageIsComprehensive from './pages/GapAiCoverageIsComprehensive'
import GapNoVisionBasedReceiptExpenseCapture from './pages/GapNoVisionBasedReceiptExpenseCapture'
import GapNoConversationalTravelAgentVoiceInterface from './pages/GapNoConversationalTravelAgentVoiceInterface'
import GapNoDeepIntegrationWithBookingPlatformsExpedia from './pages/GapNoDeepIntegrationWithBookingPlatformsExpedia'
import GapNoRealTimeFlightPriceAlerts from './pages/GapNoRealTimeFlightPriceAlerts'
import GapNoTravelInsuranceComparisonShopping from './pages/GapNoTravelInsuranceComparisonShopping'
import GapNoVisaRequirementChecker from './pages/GapNoVisaRequirementChecker'
import GapNoMultiCurrencyTracking from './pages/GapNoMultiCurrencyTracking'
import GapNoWebhooksForTripEvents from './pages/GapNoWebhooksForTripEvents'
import GapNoNotificationsSubsystem from './pages/GapNoNotificationsSubsystem'
import GapNoAuditLog from './pages/GapNoAuditLog'

const ProtectedRoute = ({ children }) => children;
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-dynamic-itinerary-adjustment-for-real-time-delay-handling" element={<ProtectedRoute><CfDynamicItineraryAdjustmentForRealTimeDelay /></ProtectedRoute>} />
      <Route path="/cf-local-currency-spending-tracker-with-multi-currency-conversion" element={<ProtectedRoute><CfLocalCurrencySpendingTrackerWithMultiCurrency /></ProtectedRoute>} />
      <Route path="/cf-travel-community-features-share-trips-follow-travelers" element={<ProtectedRoute><CfTravelCommunityFeaturesShareTripsFollowTravelers /></ProtectedRoute>} />
      <Route path="/cf-visa-document-advisor-checking-requirements-by-destination" element={<ProtectedRoute><CfVisaDocumentAdvisorCheckingRequirementsByDestination /></ProtectedRoute>} />
      <Route path="/cf-travel-insurance-recommender-assessing-needs-and-plans" element={<ProtectedRoute><CfTravelInsuranceRecommenderAssessingNeedsAndPlans /></ProtectedRoute>} />
      <Route path="/cf-group-trip-cost-splitter-with-splitwise-style-settlements" element={<ProtectedRoute><CfGroupTripCostSplitterWithSplitwiseStyle /></ProtectedRoute>} />
      <Route path="/gap-ai-coverage-is-comprehensive" element={<ProtectedRoute><GapAiCoverageIsComprehensive /></ProtectedRoute>} />
      <Route path="/gap-no-vision-based-receipt-expense-capture" element={<ProtectedRoute><GapNoVisionBasedReceiptExpenseCapture /></ProtectedRoute>} />
      <Route path="/gap-no-conversational-travel-agent-voice-interface" element={<ProtectedRoute><GapNoConversationalTravelAgentVoiceInterface /></ProtectedRoute>} />
      <Route path="/gap-no-deep-integration-with-booking-platforms-expedia-booking" element={<ProtectedRoute><GapNoDeepIntegrationWithBookingPlatformsExpedia /></ProtectedRoute>} />
      <Route path="/gap-no-real-time-flight-price-alerts" element={<ProtectedRoute><GapNoRealTimeFlightPriceAlerts /></ProtectedRoute>} />
      <Route path="/gap-no-travel-insurance-comparison-shopping" element={<ProtectedRoute><GapNoTravelInsuranceComparisonShopping /></ProtectedRoute>} />
      <Route path="/gap-no-visa-requirement-checker" element={<ProtectedRoute><GapNoVisaRequirementChecker /></ProtectedRoute>} />
      <Route path="/gap-no-multi-currency-tracking" element={<ProtectedRoute><GapNoMultiCurrencyTracking /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-for-trip-events" element={<ProtectedRoute><GapNoWebhooksForTripEvents /></ProtectedRoute>} />
      <Route path="/gap-no-notifications-subsystem" element={<ProtectedRoute><GapNoNotificationsSubsystem /></ProtectedRoute>} />
      <Route path="/gap-no-audit-log" element={<ProtectedRoute><GapNoAuditLog /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="app-main">
        {/* Mobile header with hamburger */}
        <header className="mobile-header">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="mobile-header-title">TravelAI</span>
        </header>
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/ai-history"
              element={
                <PrivateRoute>
                  <AIHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/feature/:featureName"
              element={
                <PrivateRoute>
                  <FeaturePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/document-vault"
              element={<PrivateRoute><DocumentVault /></PrivateRoute>}
            />
            <Route
              path="/trip-collaboration"
              element={<PrivateRoute><TripCollaboration /></PrivateRoute>}
            />
            <Route
              path="/trip-inspiration"
              element={<PrivateRoute><TripInspiration /></PrivateRoute>}
            />
            <Route
              path="/day-of-mode"
              element={<PrivateRoute><DayOfMode /></PrivateRoute>}
            />
            <Route
              path="/visa-advisor"
              element={<PrivateRoute><VisaAdvisor /></PrivateRoute>}
            />
            <Route
              path="/insurance-recommender"
              element={<PrivateRoute><InsuranceRecommender /></PrivateRoute>}
            />
            <Route
              path="/dynamic-adjuster"
              element={<PrivateRoute><DynamicAdjuster /></PrivateRoute>}
            />
            <Route
              path="/custom-views"
              element={<PrivateRoute><CustomViewsPage /></PrivateRoute>}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
