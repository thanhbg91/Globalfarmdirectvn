import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Phone, User, Calendar, ShieldCheck, FileText, Loader2, Mail, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Order, UserProfile, OrderStatus } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ConsumerDetailsModalProps {
  consumerId: string;
  onClose: () => void;
  allOrders: Order[];
  farmerId: string;
}

export default function ConsumerDetailsModal({
  consumerId,
  onClose,
  allOrders,
  farmerId,
}: ConsumerDetailsModalProps) {
  const [consumerProfile, setConsumerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch consumer profile
  useEffect(() => {
    async function fetchConsumer() {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', consumerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConsumerProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          // Fallback if profile doesn't exist in DB
          setConsumerProfile({
            id: consumerId,
            email: '',
            displayName: 'Người mua Sạch',
            role: 'consumer' as any,
            createdAt: new Date().toISOString()
          } as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching consumer profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchConsumer();
  }, [consumerId]);

  // Filter orders placed by this specific consumer to this farmer
  const consumerOrdersWithMe = allOrders.filter(
    (o) => o.consumerId === consumerId && o.farmerId === farmerId
  );

  const completedOrdersCount = consumerOrdersWithMe.filter(o => o.status === OrderStatus.COMPLETED).length;
  const totalSpent = consumerOrdersWithMe
    .filter(o => o.status === OrderStatus.COMPLETED)
    .reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]"
      >
        {/* Header section with customer theme */}
        <div className="bg-linear-to-r from-slate-900 to-slate-850 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <img
                src={consumerProfile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                alt={consumerProfile?.displayName}
                className="w-14 h-14 rounded-2xl border border-white/10 object-cover bg-white/10 shrink-0"
              />
              <div className="text-center sm:text-left space-y-1 truncate w-full">
                <h3 className="text-lg font-black tracking-tight truncate flex items-center justify-center sm:justify-start space-x-2">
                  <span>{consumerProfile?.displayName}</span>
                  {completedOrdersCount >= 3 && (
                    <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center space-x-1 shrink-0">
                      ⭐ Khách quen
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300 font-semibold flex items-center justify-center sm:justify-start">
                  <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>Người tiêu dùng sạch</span>
                </p>
                {consumerProfile?.email && (
                  <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start truncate">
                    <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span className="truncate">{consumerProfile.email}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Loyalty indicators / stats banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-2 gap-4 shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-150 flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase">Mua thành công</p>
              <p className="text-sm font-black text-slate-800">{completedOrdersCount} đơn hàng</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-150 flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase">Tổng giá trị</p>
              <p className="text-sm font-black text-emerald-700">{totalSpent.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </div>

        {/* Tab contents (Scrollable body) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center">
            <FileText className="w-4 h-4 mr-1.5 text-emerald-600" />
            Lịch sử giao dịch với nhà vườn của bạn ({consumerOrdersWithMe.length})
          </h4>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-slate-400 text-xs font-bold">Đang tải lịch sử đặt hàng...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consumerOrdersWithMe.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 italic">Khách hàng chưa từng đặt mua sản phẩm nào từ bạn.</p>
                </div>
              ) : (
                consumerOrdersWithMe.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs"
                  >
                    {/* Order Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900">📦 Đơn hàng #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Đặt ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        order.status === OrderStatus.PENDING ? 'bg-yellow-50 text-yellow-800' :
                        order.status === OrderStatus.ACCEPTED ? 'bg-blue-50 text-blue-800' :
                        order.status === OrderStatus.SHIPPED ? 'bg-indigo-50 text-indigo-800' :
                        order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-800' :
                        'bg-red-50 text-red-800'
                      }`}>
                        {order.status === OrderStatus.PENDING ? 'Chờ xác nhận' :
                         order.status === OrderStatus.ACCEPTED ? 'Đã duyệt' :
                         order.status === OrderStatus.SHIPPED ? 'Đang vận chuyển' :
                         order.status === OrderStatus.COMPLETED ? 'Đã nhận nông sản' :
                         'Đã hủy'}
                      </span>
                    </div>

                    {/* Order Content */}
                    <div className="space-y-1.5 text-slate-600 font-medium">
                      <p className="font-extrabold text-slate-800">🛍️ {order.productName} (SL: {order.quantity})</p>
                      <p>💰 Đơn giá tổng cộng: <span className="font-bold text-emerald-800">{order.totalPrice.toLocaleString('vi-VN')}đ</span></p>
                      <p className="flex items-center text-slate-500">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>Giao đến: {order.shippingAddress}</span>
                      </p>
                      <p className="flex items-center text-slate-500">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>SĐT liên hệ: {order.phone}</span>
                      </p>
                    </div>

                    {order.notes && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[11px] text-slate-500 italic">
                        Ghi chú gửi vườn: "{order.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
