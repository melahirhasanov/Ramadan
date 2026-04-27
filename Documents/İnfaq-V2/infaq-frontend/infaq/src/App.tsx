import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import FamiliesPage from './pages/Families/FamiliesPage';
import FamilyDetailsPage from './pages/Families/FamilyDetailsPage';
import FamilyFormPage from './pages/Families/FamilyFormPage';
import VolunteersPage from './pages/Volunteers/VolunteersPage';
import VolunteerFormPage from './pages/Volunteers/VolunteerFormPage';
import IdeasPage from './pages/Trade/IdeasPage';
import ProductsPage from './pages/Trade/ProductsPage';
import MaterialsPage from './pages/Trade/MaterialsPage';
import PurchasesPage from './pages/Trade/PurchasesPage';
import ExtraCostsPage from './pages/Trade/ExtraCostsPage';
import DailyTransportPage from './pages/Trade/DailyTransportPage';
import OrdersPage from './pages/Trade/OrdersPage';
import ReportsPage from './pages/Reports/ReportsPage';
import ReportFormPage from './pages/Reports/ReportFormPage';
import MyIdeasPage from './pages/VolunteerPanel/MyIdeasPage';
import AllIdeasPage from './pages/VolunteerPanel/AllIdeasPage';
import MyProductsPage from './pages/MasterPanel/MyProductsPage';
import MyPurchasesPage from './pages/MasterPanel/MyPurchasesPage';
import MyExtraCostsPage from './pages/MasterPanel/MyExtraCostsPage';
import MyIncomePage from './pages/MasterPanel/MyIncomePage';
import ProfilePage from './pages/Profile/ProfilePage';
import VolunteerDetailsPage from './pages/Volunteers/VolunteerDetailsPage';
import BackendResponsibleFormPage from './pages/BackendResponsibleFormPage/BackendResponsibleFormPage';
import BackendResponsibleDetailsPage from './pages/BackendResponsibleFormPage/BackendResponsibleDetailsPage';
import BackendResponsiblesPage from './pages/BackendResponsibleFormPage/BackendResponsibles';
import MasterFormPage from './pages/Masters/MasterFormPage';
import MasterDetailsPage from './pages/Masters/MasterDetailsPage';
import MastersPage from './pages/Masters/MastersPage';
import CategoryManager from './pages/Trade/CategoryManager';
import ProductCostsPage from './pages/Trade/ProductCostsPage';

const PrivateRoute: React.FC<{ children: React.JSX.Element; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Yüklənir...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

      {/* Admin & backend_responsible */}
      <Route path="/families" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><FamiliesPage /></PrivateRoute>} />
      <Route path="/families/new" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><FamilyFormPage /></PrivateRoute>} />
      <Route path="/families/:id" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><FamilyDetailsPage /></PrivateRoute>} />
      <Route path="/families/:id/edit" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><FamilyFormPage /></PrivateRoute>} />
      <Route path="/volunteers" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><VolunteersPage /></PrivateRoute>} />
      <Route path="/volunteers/new" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><VolunteerFormPage /></PrivateRoute>} />
      <Route path="/trade/ideas" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><IdeasPage /></PrivateRoute>} />
      <Route path="/trade/products" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><ProductsPage /></PrivateRoute>} />
      <Route path="/trade/materials" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><MaterialsPage /></PrivateRoute>} />
      <Route path="/trade/purchases" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><PurchasesPage /></PrivateRoute>} />
      <Route path="/trade/extracosts" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><ExtraCostsPage /></PrivateRoute>} />
      <Route path="/trade/dailytransport" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><DailyTransportPage /></PrivateRoute>} />
      <Route path="/trade/orders" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><OrdersPage /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><ReportsPage /></PrivateRoute>} />
      <Route path="/reports/new" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><ReportFormPage /></PrivateRoute>} />
<Route path="/volunteers/:id" element={<PrivateRoute allowedRoles={['admin','backend_responsible']}><VolunteerDetailsPage/></PrivateRoute>} />
<Route path="/volunteers/edit/:id" element={<PrivateRoute allowedRoles={['admin','backend_responsible']}><VolunteerFormPage /></PrivateRoute>} />
<Route path="/backend-responsibles" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><BackendResponsiblesPage /></PrivateRoute>} />
<Route path="/backend-responsibles/new" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><BackendResponsibleFormPage /></PrivateRoute>} />
<Route path="/backend-responsibles/:id" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><BackendResponsibleDetailsPage /></PrivateRoute>} />
<Route path="/backend-responsibles/edit/:id" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><BackendResponsibleFormPage /></PrivateRoute>} />
<Route path="/masters" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><MastersPage /></PrivateRoute>} />
<Route path="/masters/new" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><MasterFormPage /></PrivateRoute>} />
<Route path="/masters/:id" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><MasterDetailsPage /></PrivateRoute>} />
<Route path="/masters/edit/:id" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><MasterFormPage /></PrivateRoute>} />
<Route path="/categories" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><CategoryManager /></PrivateRoute>} />
<Route path="/product-costs" element={<PrivateRoute allowedRoles={['admin', 'backend_responsible']}><ProductCostsPage /></PrivateRoute>} />

      {/* Volunteer */}
      <Route path="/my-ideas" element={<PrivateRoute allowedRoles={['volunteer']}><MyIdeasPage /></PrivateRoute>} />
      <Route path="/all-ideas" element={<PrivateRoute allowedRoles={['volunteer']}><AllIdeasPage /></PrivateRoute>} />

      {/* Master */}
      <Route path="/my-products" element={<PrivateRoute allowedRoles={['master']}><MyProductsPage /></PrivateRoute>} />
      <Route path="/my-purchases" element={<PrivateRoute allowedRoles={['master']}><MyPurchasesPage /></PrivateRoute>} />
      <Route path="/my-extracosts" element={<PrivateRoute allowedRoles={['master']}><MyExtraCostsPage /></PrivateRoute>} />
      <Route path="/my-income" element={<PrivateRoute allowedRoles={['master']}><MyIncomePage /></PrivateRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;