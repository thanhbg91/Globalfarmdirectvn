import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Phone, User, Calendar, Tag, ShieldCheck, Award, FileText, ShoppingBag, Loader2, MessageSquare, ShoppingCart, Info, Compass } from 'lucide-react';
import { Product, Order, UserProfile, OrderStatus } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface FarmerDetailsModalProps {
  farmerId: string;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onChatWithFarmer: (farmerId: string) => void;
  allProducts: Product[];
  allOrders: Order[];
}

export default function FarmerDetailsModal({
  farmerId,
  onClose,
  onSelectProduct,
  onChatWithFarmer,
  allProducts,
  allOrders,
}: FarmerDetailsModalProps) {
  const [farmerProfile, setFarmerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  const currentUserId = auth.currentUser?.uid;

  // Fetch farmer profile
  useEffect(() => {
    async function fetchFarmer() {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', farmerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFarmerProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          // Fallback if profile doesn't exist in DB
          setFarmerProfile({
            id: farmerId,
            email: '',
            displayName: 'Nhà nông Sạch',
            role: 'farmer' as any,
            farmName: 'Nhà vườn Gieo Trồng Sạch',
            farmDescription: 'Chuyên cung cấp các loại rau củ quả, nông sản VietGAP trực tiếp từ nông trại.',
            createdAt: new Date().toISOString()
          } as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching farmer profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFarmer();
  }, [farmerId]);

  // Filter products belonging to this farmer
  const farmerProducts = allProducts.filter((p) => p.farmerId === farmerId);

  // Filter orders placed by the current user to this farmer (Buyer's purchase history with this garden)
  const myOrdersWithFarmer = allOrders.filter(
    (o) => o.farmerId === farmerId && (o.consumerId === currentUserId || o.farmerId === currentUserId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]"
      >
        {/* Header section with farmer card style */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-700 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-100" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <img
                src={farmerProfile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                alt={farmerProfile?.displayName}
                className="w-16 h-16 rounded-2xl border-2 border-white/20 object-cover bg-white/10 shrink-0"
              />
              <div className="text-center sm:text-left space-y-1 truncate w-full">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <h3 className="text-lg font-black tracking-tight truncate">
                    {farmerProfile?.farmName || `Vườn gieo của ${farmerProfile?.displayName}`}
                  </h3>
                  <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center space-x-1 shrink-0 shadow-sm border border-emerald-400/20">
                    <ShieldCheck className="w-3 h-3 fill-white" />
                    <span>Đã xác minh</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-100 font-semibold flex items-center justify-center sm:justify-start">
                  <User className="w-3.5 h-3.5 mr-1" />
                  <span>Chủ vườn: {farmerProfile?.displayName}</span>
                </p>
                {farmerProfile?.farmAddress && (
                  <p className="text-[11px] text-emerald-100 flex items-center justify-center sm:justify-start truncate">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                    <span className="truncate">{farmerProfile.farmAddress}</span>
                  </p>
                )}
                {farmerProfile?.phone && (
                  <p className="text-[11px] text-emerald-100 flex items-center justify-center sm:justify-start">
                    <Phone className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                    <span>SĐT nhà vườn: {farmerProfile.phone}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center space-x-1.5 ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Nông sản mở bán ({farmerProducts.length})</span>
            </button>
            <button
              id="farmer-modal-tab-orders"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center space-x-1.5 ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Lịch sử đặt mua tại vườn ({myOrdersWithFarmer.length})</span>
            </button>
          </div>

          <button
            onClick={() => onChatWithFarmer(farmerId)}
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>Liên hệ trao đổi</span>
          </button>
        </div>

        {/* Tab contents (Scrollable body) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
              <p className="text-slate-400 text-xs font-bold">Đang tải thông tin vườn gieo...</p>
            </div>
          ) : (
            <>
              {/* Profile details text description */}
              {activeTab === 'products' && farmerProfile?.farmDescription && (
                <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-2 text-xs text-slate-600 leading-relaxed">
                  <h4 className="font-extrabold text-slate-800 flex items-center">
                    <Info className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Giới thiệu nhà vườn sạch
                  </h4>
                  <p className="whitespace-pre-wrap">{farmerProfile.farmDescription}</p>
                  
                  {/* Farm Scale & Certifications */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                    {farmerProfile.farmScale && (
                      <p className="flex items-center">
                        <Compass className="w-4 h-4 mr-1 text-emerald-600" />
                        <span>Quy mô: {farmerProfile.farmScale}</span>
                      </p>
                    )}
                    {farmerProfile.certifications && (
                      <p className="flex items-center">
                        <Award className="w-4 h-4 mr-1 text-emerald-600" />
                        <span>Chứng nhận: {farmerProfile.certifications}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PRODUCTS TAB */}
              {activeTab === 'products' && (
                <div className="space-y-3">
                  {farmerProducts.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
                      <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-bounce" />
                      <p className="text-slate-500 font-semibold text-sm">Nhà vườn hiện chưa đăng bán thêm nông sản nào.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {farmerProducts.map((prod) => {
                        const isOutOfStock = prod.quantity <= 0;
                        return (
                          <div
                            key={prod.id}
                            onClick={() => onSelectProduct(prod)}
                            className="bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs hover:border-emerald-300 transition-all flex space-x-3 cursor-pointer group"
                          >
                            <img
                              src={prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'}
                              alt={prod.name}
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100 group-hover:scale-102 transition-transform"
                            />
                            <div className="truncate flex-1 flex flex-col justify-between text-xs">
                              <div>
                                <h5 className="font-extrabold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                                  {prod.name}
                                </h5>
                                <p className="text-[10px] text-slate-500">{prod.category}</p>
                              </div>
                              <div className="flex justify-between items-baseline mt-1.5">
                                <span className="font-black text-emerald-700">
                                  {prod.price.toLocaleString('vi-VN')}đ/{prod.unit}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                                  isOutOfStock ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {isOutOfStock ? 'Hết hàng' : `Kho: ${prod.quantity} ${prod.unit}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ORDERS TAB: Buyer's Order History with this specific Garden */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {myOrdersWithFarmer.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-semibold text-sm">Bạn chưa thực hiện đơn đặt mua nào từ nhà vườn này.</p>
                      {farmerProducts.length > 0 && (
                        <button
                          onClick={() => setActiveTab('products')}
                          className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                        >
                          Xem các nông sản tươi ngon ngay
                        </button>
                      )}
                    </div>
                  ) : (
                    myOrdersWithFarmer.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs"
                      >
                        {/* Order Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <div>
                            <p className="font-black text-slate-900">📦 Đơn hàng #{order.id.slice(-6).toUpperCase()}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Ngày đặt mua: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                            order.status === OrderStatus.PENDING ? 'bg-yellow-50 text-yellow-800 border border-yellow-100' :
                            order.status === OrderStatus.ACCEPTED ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                            order.status === OrderStatus.SHIPPED ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                            order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            'bg-red-50 text-red-800 border border-red-100'
                          }`}>
                            {order.status === OrderStatus.PENDING ? 'Chờ xác nhận' :
                             order.status === OrderStatus.ACCEPTED ? 'Đã duyệt' :
                             order.status === OrderStatus.SHIPPED ? 'Đang vận chuyển' :
                             order.status === OrderStatus.COMPLETED ? 'Đã nhận nông sản' :
                             'Đã hủy'}
                          </span>
                        </div>

                        {/* Order Content */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-medium leading-relaxed">
                          <div className="space-y-1">
                            <p className="font-extrabold text-slate-800 text-sm">🛍️ {order.productName} (SL: {order.quantity})</p>
                            <p>💰 Đơn giá tổng cộng: <span className="font-bold text-emerald-800">{order.totalPrice.toLocaleString('vi-VN')}đ</span></p>
                          </div>
                          <div className="space-y-1 sm:border-l sm:pl-4 border-slate-100">
                            <p>📍 Giao đến: {order.shippingAddress}</p>
                            <p>💳 Thanh toán: <span className="uppercase font-bold text-slate-700">{order.paymentMethod === 'pi' ? 'Ví Pi Network ⚡' : 'Thanh toán khi nhận (COD)'}</span></p>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[11px] text-slate-500 italic">
                            Ghi chú: "{order.notes}"
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
