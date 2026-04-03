import React from 'react';
import { useShop } from './ShopContext';
import { motion } from 'framer-motion';

const CURRENCY_FORMATTER = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 0,
});

const ProductGallery = () => {
  const { products, modules, defaultConfigs } = useShop();

  const getStartingPrice = (product) => {
    if (product.type === 'simple') return product.price;
    
    // For modular, starting price is the sum of the default configuration
    const config = defaultConfigs[product.id] || [];
    return config.reduce((sum, item) => {
      const module = modules.find(m => m.id === item.moduleId);
      return sum + (module ? module.price * item.quantity : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="p-8 flex justify-between items-center border-b border-slate-50">
        <div className="flex items-center space-x-3">
          <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl">A</div>
          <span className="text-2xl font-serif tracking-widest uppercase">AURA</span>
        </div>
        <div className="flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-slate-400">
           <a href="/admin" className="hover:text-black transition-colors">Yönetim Paneli</a>
           <a href="#" className="hover:text-black transition-colors">Koleksiyonlar</a>
           <button className="bg-black text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition-all">Giriş Yap</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="px-8 md:px-24 py-20 text-center bg-slate-50/50">
        <h1 className="text-5xl md:text-7xl font-serif mb-6 tracking-tight">Koleksiyonu Keşfedin</h1>
        <p className="max-w-2xl mx-auto text-slate-500 text-lg font-light leading-relaxed">
           Modern mimari ile zanaatkar ruhunun buluştuğu noktada, yaşam alanlarınız için en özel modüler ve bağımsız mobilya tasarımlarımızı inceleyin.
        </p>
      </header>

      {/* Grid */}
      <main className="px-8 md:px-24 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {products.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[4/5] bg-slate-100 rounded-[2.5rem] overflow-hidden mb-6 relative shadow-sm group-hover:shadow-2xl transition-all duration-700">
                <img src={product.heroImg} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={product.name}/>
                <div className="absolute top-6 left-6">
                  <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 shadow-sm text-slate-900">
                    {product.type === 'modular' ? 'Modüler Set' : 'Bağımsız Ürün'}
                  </span>
                </div>
              </div>
              
              <div className="px-4 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-serif mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{product.name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none">
                    {product.type === 'modular' ? 'Konfigüre Edilebilir' : `Stok Adedi: ${product.stock}`}
                  </p>
                </div>
                <div className="flex flex-col lg:items-end">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{product.type === 'modular' ? 'Başlangıç' : 'Fiyat'}</span>
                   <span className="text-xl font-bold tracking-tighter text-slate-900 leading-none">{CURRENCY_FORMATTER.format(getStartingPrice(product))}</span>
                </div>
              </div>
              
              <div className="mt-8 px-4 flex space-x-4">
                 <a 
                   href={product.type === 'modular' ? `/configurator?id=${product.id}` : `/product/${product.id}`}
                   className="flex-1 bg-black text-white text-center py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                 >
                   {product.type === 'modular' ? 'Konfigüre Et' : 'İncele ve Satın Al'}
                 </a>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-24 px-8 text-white text-center">
         <div className="max-w-4xl mx-auto">
            <h4 className="text-3xl font-serif mb-6 italic opacity-80">"Eviniz, ruhunuzun yansımasıdır."</h4>
            <div className="w-20 h-0.5 bg-indigo-500 mx-auto mb-12"></div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.4em]">© 2024 AURA Luxe Furniture Design Studio</p>
         </div>
      </footer>
    </div>
  );
};

export default ProductGallery;
