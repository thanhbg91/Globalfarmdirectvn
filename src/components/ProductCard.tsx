import React from 'react';
import { motion } from 'motion/react';
import { Leaf, MapPin, Calendar, ShoppingCart, MessageSquare, ShieldCheck, Tag } from 'lucide-react';
import { Product } from '../types';
import { useI18n } from '../lib/i18n';

interface ProductCardProps {
  key?: string;
  product: Product;
  onSelect: (product: Product) => void;
  onChat: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectFarmer?: (farmerId: string) => void;
}

export default function ProductCard({ product, onSelect, onChat, onAddToCart, onSelectFarmer }: ProductCardProps) {
  const { t, convertAndFormatPriceAndUnit, convertAndFormatQuantity } = useI18n();
  const isOutOfStock = product.quantity <= 0;

  return (
    <motion.div
      id={`product-card-${product.id}`}
      layout
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.12)] transition-all duration-300 flex flex-col h-full relative group"
    >
      {/* Organic Badge & Out of stock banner */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        {product.isOrganic && (
          <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center space-x-1 shadow-md uppercase tracking-wider backdrop-blur-md bg-opacity-95">
            <Leaf className="w-3.5 h-3.5 fill-white animate-pulse" />
            <span>{t('prod.vietgap')}</span>
          </span>
        )}
        {product.quantity <= 15 && product.quantity > 0 && (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider backdrop-blur-md bg-opacity-95">
            {t('prod.low_stock')}
          </span>
        )}
      </div>

      {/* Product Image */}
      <div 
        id={`product-image-container-${product.id}`}
        onClick={() => onSelect(product)} 
        className="w-full h-52 bg-slate-100 overflow-hidden relative cursor-pointer"
      >
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-xs">
            <span className="text-white font-extrabold text-xs uppercase tracking-widest px-4 py-2 border border-white/20 rounded-xl bg-slate-950/40">
              {t('prod.out_of_stock')}
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Category & Location */}
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider">
            {t(`cat.${product.category}`) || product.category}
          </span>
          <span className="flex items-center text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg">
            <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {product.location}
          </span>
        </div>

        {/* Title */}
        <h4 
          onClick={() => onSelect(product)} 
          className="font-extrabold text-slate-900 text-[17px] leading-snug hover:text-emerald-600 cursor-pointer transition-colors line-clamp-1 mb-2 tracking-tight"
        >
          {product.name}
        </h4>

        {/* Farmer display name */}
        <div 
          onClick={(e) => { e.stopPropagation(); onSelectFarmer?.(product.farmerId); }}
          className="text-xs text-slate-500 mb-3 flex items-center hover:text-emerald-700 cursor-pointer group/farmer"
        >
          <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600 fill-emerald-50 shrink-0" />
          <span className="font-bold text-slate-700 shrink-0">{t('prod.farmer_vessel')}</span>
          <span className="truncate ml-1 font-extrabold text-slate-800 group-hover/farmer:underline group-hover/farmer:text-emerald-700 transition-colors">{product.farmerName}</span>
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-medium">
          {product.description}
        </p>

        {/* Harvest Date & Stock Info */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 mb-4 text-xs">
          <div className="flex items-center text-slate-500 font-bold">
            <Calendar className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
            <span className="text-slate-600 truncate">{t('prod.harvest_date')} {product.harvestDate}</span>
          </div>
          <div className="flex items-center text-slate-500 font-bold justify-end">
            <Tag className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
            <span className="text-slate-600 truncate">{t('prod.stock')} {convertAndFormatQuantity(product.quantity, product.unit)}</span>
          </div>
        </div>

        {/* Pricing & CTA Buttons */}
        <div className="mt-auto pt-2 flex flex-col space-y-3">
          {/* Price */}
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-black text-emerald-600 font-sans tracking-tight">
              {convertAndFormatPriceAndUnit(product.price, product.unit)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-5 gap-2">
            <button
              id={`chat-btn-${product.id}`}
              onClick={(e) => { e.stopPropagation(); onChat(product); }}
              className="col-span-2 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-100 hover:border-emerald-200 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              title="Chat trực tiếp với nông dân"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>{t('prod.negotiate')}</span>
            </button>
            <button
              id={`add-to-cart-btn-${product.id}`}
              disabled={isOutOfStock}
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              className={`col-span-3 py-2.5 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-200 border-slate-200 cursor-not-allowed text-slate-400 shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]'
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>{t('prod.buy_now')}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
