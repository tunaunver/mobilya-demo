import React, { useState } from 'react';
import { useShop } from './ShopContext';
import { motion, AnimatePresence } from 'framer-motion';

const CURRENCY_FORMATTER = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 0,
});

const SimpleProductPage = ({ productId }) => {
  const { products } = useShop();
  const product = products.find(p => p.id === productId);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-serif">
        <div className="text-center">
          <h2 className="text-4xl mb-4 italic">Ürün Bulunamadı</h2>
          <a href="/" className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:underline">Geri Dön →</a>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock < 1;
  const isMaxStock = qty >= product.stock;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-32">
      {/* Dynamic Header */}
      <nav className="p-8 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50 border-b border-slate-50">
        <div className="flex items-center space-x-3">
          <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl">A</div>
          <span className="text-2xl font-serif tracking-widest uppercase">AURA</span>
        </div>
        <div className="flex items-center space-x-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
           <a href="/" className="hover:text-black transition-colors">Galeri</a>
           <a href="/admin" className="hover:text-black transition-colors">Yönetim</a>
           <button className="bg-black text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition-all">Destek</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 md:px-24 py-16 lg:grid lg:grid-cols-2 lg:gap-24">
        
        {/* Left: Product Media */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative aspect-square bg-slate-50 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white"
        >
          <img src={product.heroImg} className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" alt={product.name}/>
          <div className="absolute top-10 left-10">
             <span className="bg-black/80 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Yeni Sezon</span>
          </div>
        </motion.div>

        {/* Right: Product Details */}
        <div className="flex flex-col justify-center py-12 lg:py-0">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-serif mb-6 tracking-tight leading-none uppercase">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-8">
               <span className="text-2xl font-bold tracking-tighter">{CURRENCY_FORMATTER.format(product.price)}</span>
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${isOutOfStock ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                 {isOutOfStock ? 'Tükendi' : `Stokta Son ${product.stock} Ürün`}
               </span>
            </div>
            <p className="text-slate-500 text-lg font-light leading-relaxed max-w-lg mb-8">
              {product.description}
            </p>
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center space-x-8 mb-12">
               <div className="flex items-center space-x-6">
                 <button 
                   onClick={() => setQty(Math.max(1, qty - 1))}
                   disabled={qty === 1}
                   className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl hover:bg-black hover:text-white transition-all shadow-sm"
                 >
                   -
                 </button>
                 <span className="text-xl font-bold tabular-nums">{qty}</span>
                 <button 
                    onClick={() => setQty(qty + 1)}
                    disabled={isMaxStock || isOutOfStock}
                    className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl hover:bg-black hover:text-white transition-all shadow-sm"
                 >
                   +
                 </button>
               </div>
               <div className="flex-1 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ara Toplam</p>
                  <p className="text-2xl font-bold tracking-tighter">{CURRENCY_FORMATTER.format(product.price * qty)}</p>
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <button 
               onClick={() => alert('Ürün sepete eklendi!')}
               disabled={isOutOfStock}
               className={`flex-1 h-20 rounded-[1.5rem] flex items-center justify-center space-x-4 text-xs font-bold uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl ${isOutOfStock ? 'bg-slate-100 text-slate-400 grayscale cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-slate-800 shadow-black/20'}`}
             >
               <i className="ph ph-shopping-bag text-xl"></i>
               <span>Sepete Ekle</span>
             </button>
             <button disabled={isOutOfStock} className="px-8 h-20 rounded-[1.5rem] border border-slate-100 flex items-center justify-center text-slate-400 hover:text-black hover:border-black transition-all">
                <i className="ph ph-heart text-2xl"></i>
             </button>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-slate-50 pt-12">
             <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <i className="ph ph-truck text-2xl"></i>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-relaxed">
                   Ücretsiz<br/><span className="text-slate-900">Güvenli Teslimat</span>
                </div>
             </div>
             <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                   <i className="ph ph-calendar text-2xl"></i>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-relaxed">
                   Hızlı<br/><span className="text-slate-900">2 İş Gününde Kargo</span>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimpleProductPage;
