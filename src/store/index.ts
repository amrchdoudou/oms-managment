import { create } from 'zustand';

interface StoreState {
  products: any[];
  pixels: any[];
  settings: any;
  fetchProducts: () => Promise<void>;
  fetchPixels: () => Promise<void>;
  fetchSettings: () => Promise<void>;
}

const getApiBase = () => {
    return (import.meta as any).env?.VITE_API_URL || '';
};

export const useStore = create<StoreState>((set) => ({
  products: [],
  pixels: [],
  settings: {},
  fetchProducts: async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/products`);
      const data = await res.json();
      set({ products: Array.isArray(data) ? data : [] });
    } catch {
      set({ products: [] });
    }
  },
  fetchPixels: async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/pixels`);
      const data = await res.json();
      set({ pixels: Array.isArray(data) ? data : [] });
    } catch {
      set({ pixels: [] });
    }
  },
  fetchSettings: async () => {
    const res = await fetch(`${getApiBase()}/api/settings/delivery_fees`);
    const data = res.ok ? await res.json() : { home: 600, desk: 400 };
    set({ settings: { delivery_fees: data } });
  }
}));
