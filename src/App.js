import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import AuthProvider from './contexts/AuthProvider';
import OrderProvider from './contexts/OrderProvider';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';
import AdminRoute from './routes/AdminRoute';
import ContactScreen from './screens/ContactScreen';
import ErrorScreen from './screens/ErrorScreen';
import HomeScreen from './screens/HomeScreen';
import OrderScreen from './screens/OrderScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ProductsScreen from './screens/ProductsScreen';
import ServicesDetailScreen from './screens/ServicesDetailScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ConsultationScreen from './screens/ConsultationScreen';
import AdminScreen from './screens/AdminScreen';
import OrderManagementScreen from './screens/OrderManagementScreen';
import AdminConsultationsScreen from './screens/AdminConsultationsScreen';
import DoctorChatScreen from './screens/DoctorChatScreen';
import AdminMessagesScreen from './screens/AdminMessagesScreen';
import AdminCustomersScreen from './screens/AdminCustomersScreen';
import AdminStatsScreen from './screens/AdminStatsScreen';
import ChatButton from './components/ChatButton/ChatButton';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <Navbar />
          <div className="pt-20">
            <Switch>
            <Route exact path="/"><HomeScreen /></Route>
            <Route exact path="/contact"><ContactScreen /></Route>
            <Route exact path="/consultation"><ConsultationScreen /></Route>
            <AdminRoute exact path="/admin"><AdminScreen /></AdminRoute>
            <AdminRoute exact path="/admin/orders"><OrderManagementScreen /></AdminRoute>
            <AdminRoute exact path="/admin/consultations"><AdminConsultationsScreen /></AdminRoute>
            <AdminRoute exact path="/admin/messages"><AdminMessagesScreen /></AdminRoute>
            <AdminRoute exact path="/admin/customers"><AdminCustomersScreen /></AdminRoute>
            <AdminRoute exact path="/admin/stats"><AdminStatsScreen /></AdminRoute>
            <PrivateRoute exact path="/doctor-chat"><DoctorChatScreen /></PrivateRoute>
            <PublicRoute path="/signup"><SignUpScreen /></PublicRoute>
            <PublicRoute path="/signin"><SignInScreen /></PublicRoute>
            <Route exact path="/services/:title"><ServicesDetailScreen /></Route>
            <Route exact path="/products/"><ProductsScreen /></Route>
            <Route exact path="/products/:title"><ProductDetailScreen /></Route>
            <PrivateRoute exact path="/orders"><OrderScreen /></PrivateRoute>
            <PrivateRoute exact path="/checkout"><CheckoutScreen /></PrivateRoute>
            <PrivateRoute exact path="/profile"><UserProfileScreen /></PrivateRoute>
            <Route path="*"><ErrorScreen /></Route>
            </Switch>
          </div>
          <ChatButton />
          <Footer />
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
