import React, { createContext, useContext, useState, useEffect } from 'react';

const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};

const INITIAL_DATA = {
  products: [
    {
      id: 'modern-armchair',
      type: 'simple',
      name: 'Modern Armchair',
      description: 'Minimalist hatlara sahip konforlu tekli koltuk.',
      heroImg: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1000',
      price: 4000,
      stock: 12
    },
    {
      id: 'legato-sofa',
      type: 'modular',
      name: 'Legato Modular Corner Sofa',
      description: 'Lüks oturum ve modüler mimariyi birleştiren amiral gemisi koltuk serimiz.',
      heroImg: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/modular_sofa_hero_1774359019597.png'
    }
  ],
  modules: [
    { id: 'm1', name: 'Left Arm', price: 5000, stock: 5, img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_left_arm_1774359019597_1774359041062.png' },
    { id: 'm2', name: 'Right Arm', price: 5000, stock: 5, img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_left_arm_1774359019597_1774359041062.png' },
    { id: 'm3', name: 'Middle', price: 3000, stock: 10, img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_center_1774359019597_1774359057361.png' },
    { id: 'm4', name: 'Corner', price: 4500, stock: 4, img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_corner_1774359019597_1774359076895.png' }
  ],
  defaultConfigs: {
    'legato-sofa': [
      { moduleId: 'm1', quantity: 1 },
      { moduleId: 'm2', quantity: 1 },
      { moduleId: 'm3', quantity: 2 },
      { moduleId: 'm4', quantity: 1 }
    ]
  }
};

export const ShopProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_shop_data');
      const parsed = saved ? JSON.parse(saved) : null;
      // Force seed if no products exist or data is empty
      if (!parsed || !parsed.products || parsed.products.length === 0) {
        return INITIAL_DATA;
      }
      return parsed;
    } catch (e) {
      return INITIAL_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem('aura_shop_data', JSON.stringify(data));
  }, [data]);

  const resetData = () => {
    setData(INITIAL_DATA);
    localStorage.setItem('aura_shop_data', JSON.stringify(INITIAL_DATA));
  };

  // --- Actions ---
  const addProduct = (product) => {
    setData(prev => ({
      ...prev,
      products: [...prev.products, { ...product, id: Date.now().toString() }]
    }));
  };

  const updateProduct = (id, updates) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const deleteProduct = (id) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const addModule = (module) => {
    const newModule = { ...module, id: 'm-' + Date.now().toString() };
    setData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
    return newModule;
  };

  const updateModule = (id, updates) => {
    setData(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  };

  const deleteModule = (id) => {
    setData(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== id),
      defaultConfigs: Object.keys(prev.defaultConfigs).reduce((acc, pId) => {
        acc[pId] = prev.defaultConfigs[pId].filter(c => c.moduleId !== id);
        return acc;
      }, {})
    }));
  };

  const updateDefaultConfig = (productId, newConfig) => {
    setData(prev => ({
      ...prev,
      defaultConfigs: {
        ...prev.defaultConfigs,
        [productId]: newConfig
      }
    }));
  };

  const value = {
    products: data.products,
    modules: data.modules,
    defaultConfigs: data.defaultConfigs,
    resetData,
    addProduct,
    updateProduct,
    deleteProduct,
    addModule,
    updateModule,
    deleteModule,
    updateDefaultConfig
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
