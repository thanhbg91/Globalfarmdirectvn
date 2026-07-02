import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Leaf, ShieldCheck, Star, ShoppingCart, MessageSquare, Plus, Minus, User, Send, Loader2, CheckCircle } from 'lucide-react';
import { Product, Review } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useI18n } from '../lib/i18n';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onChat: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onSelectFarmer?: (farmerId: string) => void;
}

export default function ProductDetailsModal({ product, onClose, onChat, onAddToCart, onBuyNow, onSelectFarmer }: ProductDetailsModalProps) {
  const { t, formatPrice, convertAndFormatPriceAndUnit, convertAndFormatQuantity, locale } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Fetch reviews for this product
  useEffect(() => {
    async function fetchReviews() {
      setLoadingReviews(true);
      try {
        const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
        const querySnapshot = await getDocs(q);
        const fetchedReviews: Review[] = [];
        querySnapshot.forEach((doc) => {
          fetchedReviews.push({ id: doc.id, ...doc.data() } as Review);
        });

        // If no reviews in firestore yet, seed some mock reviews
        if (fetchedReviews.length === 0) {
          const sampleReviews: Review[] = [
            {
              id: 'rev_1',
              productId: product.id,
              consumerId: 'cons_1',
              consumerName: 'Trần Minh Quân',
              rating: 5,
              comment: 'Giao hàng rất nhanh, nông sản còn cực kỳ tươi. Xứng đáng 5 sao!',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'rev_2',
              productId: product.id,
              consumerId: 'cons_2',
              consumerName: 'Phan Thị Hoa',
              rating: 4,
              comment: 'Sản phẩm ngon lành và mọng nước. Sẽ tiếp tục ủng hộ bà con nông dân!',
              createdAt: new Date(Date.now() - 172800000).toISOString(),
            }
          ];
          setReviews(sampleReviews);
        } else {
          setReviews(fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    }
    fetchReviews();
  }, [product.id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setReviewError('Vui lòng đăng nhập để gửi đánh giá.');
      return;
    }
    if (!newComment.trim()) {
      setReviewError('Vui lòng nhập bình luận đánh giá.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');

    try {
      const reviewData = {
        productId: product.id,
        consumerId: auth.currentUser.uid,
        consumerName: auth.currentUser.displayName || 'Người tiêu dùng',
        rating: newRating,
        comment: newComment,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      
      setReviews(prev => [reviewData as Review, ...prev]);
      setNewComment('');
      setNewRating(5);
    } catch (err) {
      console.error('Error adding review:', err);
      setReviewError('Lỗi khi gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isOutOfStock = product.quantity <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Left Side: Product Image & Details */}
        <div className="md:w-1/2 bg-slate-50 relative flex flex-col h-[35vh] md:h-auto border-b md:border-b-0 md:border-r border-slate-200">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Product Description, Reviews, Actions */}
        <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col h-[55vh] md:h-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-bold text-xs uppercase tracking-wider">
              {t(`cat.${product.category}`) || product.category}
            </span>
            <div className="flex items-center text-xs text-slate-500">
              <MapPin className="w-4 h-4 mr-1 text-slate-400" />
              <span className="font-semibold text-slate-700">{product.location}</span>
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-950 mb-2 leading-tight">
            {product.name}
          </h3>

          {/* Organic Certificate Badge */}
          {product.isOrganic && (
            <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-lg border border-emerald-100 font-semibold mb-4 w-fit">
              <Leaf className="w-4 h-4 text-emerald-600 fill-emerald-100" />
              <span>{t('prod.vietgap')}</span>
            </div>
          )}

          {/* Pricing & Stock Details */}
          <div className="flex items-baseline space-x-1.5 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-lg font-black text-emerald-700">
              {convertAndFormatPriceAndUnit(product.price, product.unit)}
            </span>
            <span className="text-xs text-slate-400 ml-auto font-bold">
              {t('prod.stock')} {convertAndFormatQuantity(product.quantity, product.unit)}
            </span>
          </div>

          {/* About Farmer */}
          <div 
            onClick={() => onSelectFarmer?.(product.farmerId)}
            className="mb-4 p-3.5 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl border border-emerald-100/50 cursor-pointer transition-colors group"
            title="Nhấn để xem chi tiết nhà vườn"
          >
            <div className="flex items-center space-x-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{t('prod.farmer_vessel')}</span>
            </div>
            <p className="text-sm font-black text-slate-800 group-hover:text-emerald-800 group-hover:underline flex items-center justify-between">
              <span>{product.farmerName}</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md">{locale === 'vi' ? 'Xem nhà vườn' : 'View Farm'}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span>{t('prod.harvest_date')} {product.harvestDate}</span>
            </p>
          </div>

          {/* Product Description */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">{t('prod.description')}</h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Actions Block (Quantity Selector, Buy, Chat) */}
          {!isOutOfStock && (
            <div className="border-t border-b border-slate-100 py-4 mb-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">{t('prod.quantity')}:</span>
                <div className="flex items-center space-x-3 bg-slate-100 px-3 py-1.5 rounded-xl">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-1 hover:bg-white rounded-md transition-all cursor-pointer text-slate-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm text-slate-800 w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}
                    className="p-1 hover:bg-white rounded-md transition-all cursor-pointer text-slate-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => onChat(product)}
                  className="py-3 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('prod.negotiate')}</span>
                </button>
                <button
                  onClick={() => onAddToCart(product, quantity)}
                  className="py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{t('prod.add_to_cart')}</span>
                </button>
                <button
                  onClick={() => onBuyNow(product, quantity)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('prod.buy_now')} ({formatPrice(product.price * quantity)})</span>
                </button>
              </div>
            </div>
          )}

          {/* Reviews & Feedback Block */}
          <div className="mt-2">
            <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider flex items-center justify-between">
              <span>Đánh giá từ khách hàng ({reviews.length})</span>
              <span className="flex items-center text-amber-500 text-xs">
                <Star className="w-4 h-4 fill-amber-500 mr-1" />
                {reviews.length > 0 
                  ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
                  : 'Chưa có'}
              </span>
            </h4>

            {/* Write a review form */}
            {auth.currentUser ? (
              <form onSubmit={handleAddReview} className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <p className="text-xs font-bold text-slate-700 mb-2">Để lại phản hồi của bạn:</p>
                
                {/* Rating selection */}
                <div className="flex space-x-1.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="cursor-pointer"
                    >
                      <Star 
                        className={`w-5 h-5 ${
                          star <= newRating 
                            ? 'text-amber-500 fill-amber-500' 
                            : 'text-slate-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                {/* Comment box */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Bình luận về chất lượng, tươi ngon của sản phẩm..."
                    className="flex-1 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview || !newComment.trim()}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer shrink-0"
                  >
                    {submittingReview ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {reviewError && <p className="text-[10px] text-red-600 mt-1.5 font-medium">{reviewError}</p>}
              </form>
            ) : (
              <p className="text-xs text-slate-500 italic bg-slate-50 px-4 py-3 rounded-xl text-center mb-6 border border-dashed border-slate-200">
                Vui lòng đăng nhập bằng Google ở góc trên màn hình để viết đánh giá sản phẩm.
              </p>
            )}

            {/* List of reviews */}
            {loadingReviews ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có đánh giá nào cho sản phẩm này.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 flex items-center">
                        <User className="w-3 h-3 mr-1 text-slate-500" />
                        {rev.consumerName}
                      </span>
                      <div className="flex space-x-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3.5 h-3.5 ${star <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block mt-1 text-right">
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
