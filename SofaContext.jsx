import React, { createContext, useContext, useState, useEffect } from 'react';

const SofaContext = createContext();

export const useSofa = () => {
  const context = useContext(SofaContext);
  if (!context) throw new Error('useSofa must be used within a SofaProvider');
  return context;
};

const INITIAL_DATA = {
  products: [
    {
      id: 'legato-sofa',
      name: 'Legato Modular Corner Sofa',
      description: 'Premium modular sofa system with deep seating and tailored upholstery.',
      heroImg: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/modular_sofa_hero_1774359019597.png'
    }
  ],
  modules: [
    { 
      id: 'm1', 
      name: 'Sol Kol Ünitesi', 
      price: 5000, 
      img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_left_arm_1774359019597_1774359041062.png' 
    },
    { 
      id: 'm2', 
      name: 'Sağ Kol Ünitesi', 
      price: 5000, 
      img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_left_arm_1774359019597_1774359041062.png' 
    },
    { 
      id: 'm3', 
      name: 'Orta Tekli Ünite', 
      price: 3000, 
      img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_center_1774359019597_1774359057361.png' 
    },
    { 
      id: 'm4', 
      name: 'Köşe Ünitesi', 
      price: 4500, 
      img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_corner_1774359019597_1774359076895.png' 
    },
    { 
      id: 'm5', 
      name: 'Chaise Lounge', 
      price: 7000, 
      img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_chaise_1774359019597_1774359092693.png' 
    },
    { 
      id: 'm6', 
      name: 'Oturan / Puf', 
      price: 2500, 
      img: 'file:///C:/Users/HP/.gemini/antigravity/brain/a9d32394-2dc1-4c30-a7a0-4cd20d30c393/sofa_module_ottoman_1774359019597_1774359108716.png' 
    }
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

export const SofaProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('aura_sofa_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('aura_sofa_data', JSON.stringify(data));
  }, [data]);

  // --- Actions ---

  const updateProduct = (id, updates) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const addModule = (module) => {
    setData(prev => ({
      ...prev,
      modules: [...prev.modules, { ...module, id: Date.now().toString() }]
    }));
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
      // Also cleanup default configs
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
    updateProduct,
    addModule,
    updateModule,
    deleteModule,
    updateDefaultConfig
  };

  return <SofaContext.Provider value={value}>{children}</SofaContext.Provider>;
};
