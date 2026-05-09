import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreFront } from './pages/StoreFront';
import { ProductPage } from './pages/ProductPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { ProductsAdmin } from './pages/admin/ProductsAdmin';
import { ProductDesignerAdmin } from './pages/admin/ProductDesignerAdmin';
import { ProductContentBuilder } from './pages/admin/ProductContentBuilder';
import { OrdersAdmin } from './pages/admin/OrdersAdmin';
import { ShippingFeesAdmin } from './pages/admin/ShippingFeesAdmin';
import { SettingsAdmin } from './pages/admin/SettingsAdmin';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { useStore } from './store';
import { loadPixels } from './services/pixelService';

import { FormBuilderAdmin } from './pages/admin/FormBuilderAdmin';
import { StoreBuilderAdmin } from './pages/admin/StoreBuilderAdmin';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

export default function App() {
  const { fetchPixels, pixels } = useStore();

  useEffect(() => {
    fetchPixels();
  }, []);

  useEffect(() => {
    if (pixels.length > 0) {
      loadPixels(pixels);
    }
  }, [pixels]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StoreFront />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="product-designer" element={<ProductDesignerAdmin />} />
          <Route path="products/:id/designer" element={<ProductContentBuilder />} />
          <Route path="shipping-fees" element={<ShippingFeesAdmin />} />
          <Route path="products/:id/builder" element={<FormBuilderAdmin />} />
          <Route path="store-builder" element={<StoreBuilderAdmin />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
