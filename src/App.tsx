/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Leaf, Apple, Wheat, Flame, Grid, Sparkles, MapPin, Calendar, 
  ShoppingCart, MessageSquare, ShieldCheck, Tag, Plus, Minus, 
  User, Send, Loader2, X, Search, Filter, Clock, LogOut, 
  LogIn, PlusCircle, CheckCircle, Truck, FileText, ChevronRight, 
  Info, Store, Trash2, Upload
} from 'lucide-react';

import { Product, UserProfile, UserRole, Order, OrderStatus, Chat } from './types';
import { CATEGORIES, LOCATIONS, SAMPLE_PRODUCTS } from './data';
import { db, auth, signInWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  collection, doc, setDoc, getDoc, onSnapshot, addDoc, 
  updateDoc, query, orderBy, where, getDocs, or
} from 'firebase/firestore';

import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import ChatWindow from './components/ChatWindow';
import AIAssistant from './components/AIAssistant';
import FarmerDetailsModal from './components/FarmerDetailsModal';
import ConsumerDetailsModal from './components/ConsumerDetailsModal';
import { useI18n } from './lib/i18n';
import GlobalI18nSelector from './components/GlobalI18nSelector';

export default function App() {
  const { t, formatPrice, convertAndFormatPriceAndUnit, convertAndFormatQuantity, locale, displayUnit } = useI18n();

  // Auth & Profile states
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  // Core data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);

  // Toast notifications state
  interface CustomToast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    action?: {
      label: string;
      onClick: () => void;
    };
  }
  const [toasts, setToasts] = useState<CustomToast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [onlyOrganic, setOnlyOrganic] = useState(false);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'catalog' | 'farmer-dashboard' | 'consumer-orders' | 'cart'>('catalog');
  const [farmerOrderSubTab, setFarmerOrderSubTab] = useState<'active' | 'history'>('active');
  const [farmerOrderTypeTab, setFarmerOrderTypeTab] = useState<'sell' | 'buy'>('sell');

  // Modals / Overlays
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [selectedConsumerId, setSelectedConsumerId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFarmerId, setChatFarmerId] = useState<string | undefined>(undefined);
  const [chatFarmerName, setChatFarmerName] = useState<string | undefined>(undefined);
  const [chatProduct, setChatProduct] = useState<Product | undefined>(undefined);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [chatReadTrigger, setChatReadTrigger] = useState(0);

  // Farmer Listing Form state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Rau củ tươi');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductUnit, setNewProductUnit] = useState('kg');
  const [newProductQuantity, setNewProductQuantity] = useState(0);
  const [newProductLocation, setNewProductLocation] = useState(LOCATIONS[0]);
  const [newProductIsOrganic, setNewProductIsOrganic] = useState(true);
  const [newProductImage, setNewProductImage] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Consumer Order Checkout fields
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Farmer Farm Profile Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [farmDescription, setFarmDescription] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [farmScale, setFarmScale] = useState('');
  const [certifications, setCertifications] = useState('VietGAP');
  const [farmPhone, setFarmPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Pi Network Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'pi'>('cod');
  const [showPiSimulator, setShowPiSimulator] = useState(false);
  const [piPaymentStatus, setPiPaymentStatus] = useState<'idle' | 'initiating' | 'paying' | 'success' | 'failed'>('idle');
  const [piTxId, setPiTxId] = useState('');

  // Sync profile details when profile loads
  useEffect(() => {
    if (profile) {
      setFarmName(profile.farmName || '');
      setFarmDescription(profile.farmDescription || '');
      setFarmAddress(profile.farmAddress || profile.address || '');
      setFarmScale(profile.farmScale || '');
      setCertifications(profile.certifications || 'VietGAP');
      setFarmPhone(profile.phone || '');
    }
  }, [profile]);

  // Preset images for agricultural products
  const PRESET_IMAGES = [
    { name: 'Rau xanh', url: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&q=80&w=800' },
    { name: 'Cà chua chín', url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800' },
    { name: 'Trái cây ngọt', url: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=800' },
    { name: 'Gạo sạch', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Ớt cay tỏi tơi', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800' },
    { name: 'Cam sành tươi', url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=800' },
  ];

  // 1. Auth Change Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile
        try {
          const profileRef = doc(db, 'users', currentUser.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            setProfile({ id: currentUser.uid, ...profileSnap.data() } as UserProfile);
            setShowRoleSelection(false);
          } else {
            // New user, trigger role selection screen
            setShowRoleSelection(true);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(null);
        setShowRoleSelection(false);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Products real-time
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });

      // If database is empty, merge with pre-defined high-quality local samples so users see produce immediately
      if (fetchedProducts.length === 0) {
        setProducts(SAMPLE_PRODUCTS);
      } else {
        setProducts(fetchedProducts);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  // 3. Fetch Orders real-time when user is authenticated
  useEffect(() => {
    if (!profile) {
      setOrders([]);
      return;
    }

    const ordersRef = collection(db, 'orders');
    // Fetch both buy and sell orders for the user
    const q = query(
      ordersRef,
      or(
        where('farmerId', '==', profile.id),
        where('consumerId', '==', profile.id)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((doc) => {
        const orderData = doc.data() as Order;
        fetchedOrders.push({ id: doc.id, ...orderData });
      });
      setOrders(fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, [profile]);

  // 3b. Fetch chats real-time to compute unread counts
  useEffect(() => {
    if (!profile || !user) {
      setUserChats([]);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      or(
        where('consumerId', '==', user.uid),
        where('farmerId', '==', user.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Chat[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Chat);
      });
      setUserChats(fetched);
    }, (error) => {
      console.error("Error listening to chats for badges:", error);
    });

    const handleUpdate = () => {
      setChatReadTrigger(prev => prev + 1);
    };
    window.addEventListener('chat_read_update', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('chat_read_update', handleUpdate);
    };
  }, [profile, user]);

  const unreadChatCount = useMemo(() => {
    if (!user) return 0;
    let count = 0;
    userChats.forEach((chat) => {
      const isLastSenderMe = chat.lastSenderId === user.uid;
      if (isLastSenderMe) return;

      const lastReadStr = localStorage.getItem(`chat_read_${chat.id}`);
      if (!lastReadStr) {
        count++;
      } else {
        const isUnread = new Date(chat.lastMessageAt).getTime() > new Date(lastReadStr).getTime();
        if (isUnread) {
          count++;
        }
      }
    });
    return count;
  }, [userChats, user, chatReadTrigger]);

  // 4. Role Selection handler
  const handleSelectRole = async (selectedRole: UserRole) => {
    if (!user) return;

    const newProfile: UserProfile = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Nhà nông / Khách hàng',
      role: selectedRole,
      phone: '',
      address: '',
      avatarUrl: user.photoURL || '',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
      setShowRoleSelection(false);
      
      // Navigate to correct starting tabs
      if (selectedRole === UserRole.FARMER) {
        setCurrentTab('farmer-dashboard');
      } else {
        setCurrentTab('catalog');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  // 4b. Role Toggle & Fast Upgrade flow for registration/listing
  const handleToggleRole = async (silent = false) => {
    if (!user || !profile) {
      if (!user) {
        alert('Vui lòng đăng nhập Google trước khi thực hiện thao tác này.');
        signInWithGoogle();
      }
      return;
    }

    const nextRole = profile.role === UserRole.FARMER ? UserRole.CONSUMER : UserRole.FARMER;
    
    if (!silent) {
      const message = nextRole === UserRole.FARMER 
        ? "🌾 Bạn muốn kích hoạt tài khoản Nhà Vườn / Người bán để đăng tin gieo trồng và nhận đơn đặt hàng trực tiếp?"
        : "🛒 Bạn muốn quay lại vai trò Người mua / Người tiêu dùng?";
      
      if (!window.confirm(message)) return;
    }

    try {
      const updatedProfile = {
        ...profile,
        role: nextRole
      };
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setProfile(updatedProfile);
      setCurrentTab(nextRole === UserRole.FARMER ? 'farmer-dashboard' : 'catalog');
      
      if (!silent) {
        alert(`🎉 Chúc mừng! Tài khoản của bạn đã được chuyển đổi sang vai trò: ${nextRole === UserRole.FARMER ? 'Bà con nông dân / Người bán' : 'Người tiêu dùng / Người mua'}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Start Listing Flow helper (used from "Đăng bán nông sản" actions everywhere)
  const handleStartListingFlow = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập Google để tiến hành đăng bán sản phẩm nông sản sạch.');
      signInWithGoogle();
      return;
    }

    if (!profile) {
      // Auto-create a farmer profile for logged-in users who clicked "Đăng bán"
      try {
        const newProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Nhà nông / Khách hàng',
          role: UserRole.FARMER,
          farmName: `Vườn của ${user.displayName?.split(' ')[0] || 'Tôi'}`,
          phone: '',
          address: '',
          avatarUrl: user.photoURL || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);
        setProfile(newProfile);
        setCurrentTab('farmer-dashboard');
        setShowAddProductModal(true);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
      }
      return;
    }

    if (profile.role === UserRole.CONSUMER) {
      const confirmUpgrade = window.confirm(
        '🧑‍🌾 Bạn đang ở vai trò Người mua. Bạn có muốn kích hoạt chế độ "Nhà Vườn / Người bán" để đăng bán các loại nông sản gieo trồng của mình không?'
      );
      if (confirmUpgrade) {
        // Upgrade role to FARMER silently or with feedback
        try {
          const updatedProfile = {
            ...profile,
            role: UserRole.FARMER,
            farmName: profile.farmName || `Vườn của ${profile.displayName.split(' ')[0]}`
          };
          await setDoc(doc(db, 'users', user.uid), updatedProfile);
          setProfile(updatedProfile);
          setCurrentTab('farmer-dashboard');
          setShowAddProductModal(true);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    } else {
      // Already farmer, just switch to farmer dashboard tab and open modal
      setCurrentTab('farmer-dashboard');
      setShowAddProductModal(true);
    }
  };

  // Image upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP...).');
      return;
    }
    // Limit file size to 1.5MB for Base64 document storage in firestore
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 1.5MB để tối ưu dung lượng tải.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewProductImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // 5. Add Product handler (Farmer)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.role !== UserRole.FARMER) return;

    if (!newProductName.trim() || newProductPrice <= 0 || newProductQuantity <= 0) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setSubmittingProduct(true);
    const productId = `prod_${Date.now()}`;

    try {
      const productPayload: Omit<Product, 'id'> = {
        farmerId: profile.id,
        farmerName: profile.displayName,
        name: newProductName.trim(),
        category: newProductCategory,
        description: newProductDescription.trim() || 'Nông sản sạch gieo trồng thủ công tự nhiên.',
        price: Number(newProductPrice),
        unit: newProductUnit,
        quantity: Number(newProductQuantity),
        harvestDate: new Date().toISOString().split('T')[0], // today
        location: newProductLocation,
        isOrganic: newProductIsOrganic,
        imageUrl: newProductImage || PRESET_IMAGES[0].url,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'products', productId), productPayload);
      
      // Reset form
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice(0);
      setNewProductQuantity(0);
      setNewProductImage('');
      setShowAddProductModal(false);
      showToast('🎉 Đăng bán nông sản mới thành công lên Hệ thống Gieo Trồng!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${productId}`);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // 6. Checkout Order handler (Consumer)
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || cart.length === 0) return;

    if (!checkoutAddress.trim() || !checkoutPhone.trim()) {
      showToast('Vui lòng điền số điện thoại và địa chỉ nhận nông sản sạch.', 'error');
      return;
    }

    if (paymentMethod === 'pi') {
      setPiPaymentStatus('idle');
      setShowPiSimulator(true);
      return;
    }

    setPlacingOrder(true);

    try {
      // Place orders individually per item in cart
      for (const item of cart) {
        const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const orderPayload: Order = {
          id: orderId,
          consumerId: profile.id,
          consumerName: profile.displayName,
          farmerId: item.product.farmerId,
          farmerName: item.product.farmerName,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          totalPrice: item.product.price * item.quantity,
          status: OrderStatus.PENDING,
          shippingAddress: checkoutAddress.trim(),
          phone: checkoutPhone.trim(),
          notes: checkoutNotes.trim(),
          paymentMethod: 'cod',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save order to DB
        await setDoc(doc(db, 'orders', orderId), orderPayload);

        // Deduct/update product stock in Firestore (skip for local sample products)
        if (!item.product.id.startsWith('sample_')) {
          const productRef = doc(db, 'products', item.product.id);
          const newStock = Math.max(0, item.product.quantity - item.quantity);
          await updateDoc(productRef, { quantity: newStock });
        }
      }

      setCart([]);
      setCheckoutAddress('');
      setCheckoutPhone('');
      setCheckoutNotes('');
      setCurrentTab('consumer-orders');
      showToast('🎉 Đặt hàng nông sản thành công! Bà con nông dân sẽ liên hệ giao hàng sớm nhất.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Complete Order via Pi Network simulated transaction
  const completePiPayment = async (txId: string) => {
    if (!profile || cart.length === 0) return;
    setPlacingOrder(true);
    try {
      for (const item of cart) {
        const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const orderPayload: Order = {
          id: orderId,
          consumerId: profile.id,
          consumerName: profile.displayName,
          farmerId: item.product.farmerId,
          farmerName: item.product.farmerName,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          totalPrice: item.product.price * item.quantity,
          status: OrderStatus.PENDING,
          shippingAddress: checkoutAddress.trim(),
          phone: checkoutPhone.trim(),
          notes: checkoutNotes.trim(),
          paymentMethod: 'pi',
          piTxId: txId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save order to DB
        await setDoc(doc(db, 'orders', orderId), orderPayload);

        // Deduct/update product stock in Firestore (skip for local sample products)
        if (!item.product.id.startsWith('sample_')) {
          const productRef = doc(db, 'products', item.product.id);
          const newStock = Math.max(0, item.product.quantity - item.quantity);
          await updateDoc(productRef, { quantity: newStock });
        }
      }

      setCart([]);
      setCheckoutAddress('');
      setCheckoutPhone('');
      setCheckoutNotes('');
      setShowPiSimulator(false);
      setCurrentTab('consumer-orders');
      showToast('🎉 Thanh toán bằng Ví Pi thành công! Đơn hàng gieo trồng đã gửi đến bà con nhà vườn.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Update Order Status (Farmer or Consumer cancellation)
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // 6. Update Farm Profile handler (Farmer)
  const handleUpdateFarmProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    const updatedProfile = {
      ...profile,
      farmName: farmName.trim(),
      farmDescription: farmDescription.trim(),
      farmAddress: farmAddress.trim(),
      farmScale: farmScale.trim(),
      certifications: certifications,
      phone: farmPhone.trim(),
    };

    try {
      setSavingProfile(true);
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setProfile(updatedProfile as UserProfile);
      setIsEditingProfile(false);
      alert('🎉 Hồ sơ trang trại gieo trồng đã được cập nhật thành công!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, qty = 1) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const newCart = [...prev];
        newCart[existingIdx].quantity = Math.min(product.quantity, newCart[existingIdx].quantity + qty);
        return newCart;
      } else {
        return [...prev, { product, quantity: qty }];
      }
    });
    showToast(`Đã thêm ${qty} ${product.unit} ${product.name} vào giỏ hàng thành công!`, 'success', {
      label: 'Thanh toán ngay 🛒',
      onClick: () => setCurrentTab('cart')
    });
  };

  const handleBuyNow = (product: Product, qty = 1) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const newCart = [...prev];
        newCart[existingIdx].quantity = Math.min(product.quantity, newCart[existingIdx].quantity + qty);
        return newCart;
      } else {
        return [...prev, { product, quantity: qty }];
      }
    });
    setCurrentTab('cart');
    showToast(`Đã chọn mua ${product.name}. Mời bạn xác nhận thông tin giao nhận nông sản!`, 'success');
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Chat window starter
  const handleStartChat = (prod: Product) => {
    if (!profile) {
      showToast('Vui lòng đăng nhập tài khoản để liên hệ bàn bạc trực tiếp với nhà nông.', 'info');
      return;
    }
    if (profile.id === prod.farmerId) {
      showToast('Đây là nông sản của chính bạn! Bạn không cần tự bàn bạc với mình.', 'info');
      return;
    }
    setChatFarmerId(prod.farmerId);
    setChatFarmerName(prod.farmerName);
    setChatProduct(prod);
    setChatOpen(true);
  };

  // Filtering Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || p.location.includes(selectedLocation);
    const matchesOrganic = !onlyOrganic || p.isOrganic;
    return matchesSearch && matchesCategory && matchesLocation && matchesOrganic;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header & Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentTab('catalog')}>
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-xs shrink-0">
              <Leaf className="w-6 h-6 fill-emerald-100" />
            </div>
            <div className="truncate">
              <h1 className="font-black text-xs sm:text-sm md:text-base text-emerald-800 tracking-tight leading-none uppercase truncate">{t('app.title')}</h1>
              <p className="text-[9px] text-slate-500 font-bold tracking-wide mt-1 uppercase truncate">{locale === 'vi' ? 'Kết nối xuất khẩu toàn cầu' : 'Global Export Network'}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-6 text-sm font-semibold text-slate-600">
            <button 
              id="nav-catalog"
              onClick={() => setCurrentTab('catalog')}
              className={`hover:text-emerald-700 cursor-pointer transition-colors ${currentTab === 'catalog' ? 'text-emerald-700 font-bold border-b-2 border-emerald-600 pb-1.5' : ''}`}
            >
              {t('nav.catalog')}
            </button>
            {profile?.role === UserRole.FARMER && (
              <button 
                id="nav-farmer"
                onClick={() => setCurrentTab('farmer-dashboard')}
                className={`hover:text-emerald-700 cursor-pointer transition-colors ${currentTab === 'farmer-dashboard' ? 'text-emerald-700 font-bold border-b-2 border-emerald-600 pb-1.5' : ''}`}
              >
                {t('nav.farmer')}
              </button>
            )}
            {profile?.role === UserRole.CONSUMER && (
              <button 
                id="nav-consumer"
                onClick={() => setCurrentTab('consumer-orders')}
                className={`hover:text-emerald-700 cursor-pointer transition-colors ${currentTab === 'consumer-orders' ? 'text-emerald-700 font-bold border-b-2 border-emerald-600 pb-1.5' : ''}`}
              >
                {t('nav.orders')}
              </button>
            )}
          </nav>

          {/* Actions & Profiles */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            <GlobalI18nSelector />

            {/* Cart Button for Consumers */}
            {(!profile || profile.role === UserRole.CONSUMER) && (
              <button
                id="header-cart-btn"
                onClick={() => setCurrentTab('cart')}
                className="relative p-2 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            )}

            {/* Direct messages icon */}
            {profile && (
              <button
                id="header-chat-btn"
                onClick={() => setChatOpen(true)}
                className="relative p-2 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Hộp thư đối thoại"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Switch Mode / Start Selling button inside header for quick access */}
            {profile?.role === UserRole.CONSUMER && (
              <button
                id="header-switch-to-seller-btn"
                onClick={handleStartListingFlow}
                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                title="Kích hoạt chế độ bán hàng & đăng bán nông sản"
              >
                <Store className="w-3.5 h-3.5 text-emerald-700" />
                <span>Đăng bán</span>
              </button>
            )}
            {profile?.role === UserRole.FARMER && (
              <button
                id="header-switch-to-buyer-btn"
                onClick={() => handleToggleRole(false)}
                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
                title="Chuyển sang vai trò Người mua"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
                <span>Mua hàng</span>
              </button>
            )}

            {/* User Log-In state */}
            {loadingAuth ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : user ? (
              <div className="flex items-center space-x-2.5 bg-slate-100 py-1.5 px-3 rounded-full border border-slate-200">
                <img
                  src={profile?.avatarUrl || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                  alt="avatar"
                  className="w-6.5 h-6.5 rounded-full border border-emerald-600/30 object-cover"
                />
                <div className="hidden lg:block text-left text-[11px] font-semibold leading-tight max-w-[100px] truncate">
                  <p className="text-slate-800">{profile?.displayName || user.displayName}</p>
                  <p className="text-emerald-700 text-[9px] uppercase font-bold">
                    {profile?.role === UserRole.FARMER ? 'Bà con nông dân' : 'Người tiêu dùng'}
                  </p>
                </div>
                <button
                  id="logout-btn"
                  onClick={logout}
                  className="p-1 text-slate-500 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="login-btn"
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 flex justify-around py-2.5 text-xs font-bold text-slate-500">
        <button 
          onClick={() => setCurrentTab('catalog')}
          className={`flex flex-col items-center space-y-1 ${currentTab === 'catalog' ? 'text-emerald-700 font-black' : ''}`}
        >
          <Store className="w-5 h-5" />
          <span>Chợ nông sản</span>
        </button>
        {profile?.role === UserRole.FARMER && (
          <button 
            onClick={() => setCurrentTab('farmer-dashboard')}
            className={`flex flex-col items-center space-y-1 ${currentTab === 'farmer-dashboard' ? 'text-emerald-700 font-black' : ''}`}
          >
            <Leaf className="w-5 h-5" />
            <span>Nhà vườn</span>
          </button>
        )}
        {profile?.role === UserRole.CONSUMER && (
          <button 
            onClick={() => setCurrentTab('consumer-orders')}
            className={`flex flex-col items-center space-y-1 ${currentTab === 'consumer-orders' ? 'text-emerald-700 font-black' : ''}`}
          >
            <FileText className="w-5 h-5" />
            <span>Đơn hàng</span>
          </button>
        )}
        {profile?.role === UserRole.CONSUMER && (
          <button 
            onClick={handleStartListingFlow}
            className="flex flex-col items-center space-y-1 text-emerald-600 hover:text-emerald-800 font-bold"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Đăng bán</span>
          </button>
        )}
        {profile && (
          <button 
            onClick={() => setChatOpen(true)}
            className="relative flex flex-col items-center space-y-1 text-slate-500 hover:text-emerald-700 font-bold cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Hội thoại</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>
        )}
        {(!profile || profile.role === UserRole.CONSUMER) && (
          <button 
            onClick={() => setCurrentTab('cart')}
            className={`flex flex-col items-center space-y-1 ${currentTab === 'cart' ? 'text-emerald-700 font-black' : ''}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Giỏ hàng ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
          </button>
        )}
      </div>

      {/* Main Content Areas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ONBOARDING: User Role Selection */}
        {showRoleSelection && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border border-slate-100"
            >
              <Leaf className="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-black text-slate-950 mb-2">Chào mừng bạn đến với Sàn Nông Sản Việt!</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Hãy lựa chọn vai trò của bạn để chúng tôi có thể cá nhân hóa trải nghiệm trao đổi, mua bán nông sản sạch.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  id="select-role-farmer"
                  onClick={() => handleSelectRole(UserRole.FARMER)}
                  className="p-5 border-2 border-emerald-600/20 hover:border-emerald-600 rounded-2xl flex flex-col items-center justify-center space-y-3 cursor-pointer group bg-emerald-50/20 hover:bg-emerald-50/50 transition-all text-emerald-800"
                >
                  <Store className="w-10 h-10 text-emerald-600 group-hover:scale-105 transition-transform" />
                  <span className="font-bold text-sm text-slate-800">Tôi là Nông Dân</span>
                  <p className="text-[10px] text-slate-500 font-medium">Đăng sản phẩm, gieo trồng sạch, tiếp cận khách hàng trực tiếp</p>
                </button>

                <button
                  id="select-role-consumer"
                  onClick={() => handleSelectRole(UserRole.CONSUMER)}
                  className="p-5 border-2 border-emerald-600/20 hover:border-emerald-600 rounded-2xl flex flex-col items-center justify-center space-y-3 cursor-pointer group bg-emerald-50/20 hover:bg-emerald-50/50 transition-all text-emerald-800"
                >
                  <ShoppingCart className="w-10 h-10 text-emerald-600 group-hover:scale-105 transition-transform" />
                  <span className="font-bold text-sm text-slate-800">Tôi là Người Tiêu Dùng</span>
                  <p className="text-[10px] text-slate-500 font-medium">Mua rau củ sạch tươi ngon, trực tiếp giải cứu nông sản bà con</p>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* TAB 1: CATALOGUE (Browse market) */}
        {currentTab === 'catalog' && (
          <div className="space-y-6">
            
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden shadow-sm bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-8 md:p-12">
              <div className="max-w-2xl relative z-10 space-y-4">
                <span className="bg-emerald-500 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                  Bà con nông dân 🤝 Người tiêu dùng Việt
                </span>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  Nông sản sạch tận vườn, <br className="hidden md:block"/> giá bán trực tiếp từ nhà nông
                </h2>
                <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
                  Chúng tôi mang rau củ, quả chín sẫm từ các hợp tác xã VietGAP Sơn La, Bắc Giang, Đà Lạt nguyên nguồn gốc lên bàn ăn nhà bạn, hoàn toàn không qua trung gian nâng giá.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button 
                    onClick={() => {
                      const el = document.getElementById('catalog-search-bar');
                      el?.focus();
                    }}
                    className="px-6 py-3 bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold rounded-2xl text-sm transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-emerald-800" />
                    <span>Mua sắm nông sản</span>
                  </button>
                  <button 
                    onClick={handleStartListingFlow}
                    className="px-6 py-3 bg-emerald-600/95 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-950/20 text-white font-extrabold rounded-2xl text-sm transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer border border-emerald-500/20"
                  >
                    <PlusCircle className="w-4.5 h-4.5 text-emerald-200 animate-pulse" />
                    <span>Đăng bán nông sản</span>
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 h-full w-1/3 opacity-20 hidden md:block">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600" 
                  alt="fresh crops"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search input */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="catalog-search-bar"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm vải thiều Bắc Giang, dừa xiêm Bến Tre, xà lách Đà Lạt..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl focus:outline-hidden transition-all text-sm text-slate-800"
                />
              </div>

              {/* Advanced Filter Toggles */}
              <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
                {/* Location selector */}
                <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="text-xs font-semibold bg-transparent text-slate-700 outline-hidden border-none cursor-pointer"
                  >
                    <option value="all">Tất cả vùng miền</option>
                    {LOCATIONS.map((loc, idx) => (
                      <option key={idx} value={loc.split(',')[0]}>{loc.split(',')[0]}</option>
                    ))}
                  </select>
                </div>

                {/* Organic Checkbox */}
                <button
                  onClick={() => setOnlyOrganic(!onlyOrganic)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    onlyOrganic
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5" />
                  <span>Nông sản Hữu cơ</span>
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex space-x-2.5 overflow-x-auto pb-2 text-xs font-bold">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.name)}
                  className={`px-4.5 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    (selectedCategory === 'all' && cat.id === 'all') || selectedCategory === cat.name
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Products grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold text-sm">Không tìm thấy nông sản nào phù hợp bộ lọc.</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
                    setOnlyOrganic(false);
                  }}
                  className="mt-3 text-xs text-emerald-700 hover:underline font-bold"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={(p) => setSelectedProduct(p)}
                    onChat={(p) => handleStartChat(p)}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onSelectFarmer={(farmerId) => setSelectedFarmerId(farmerId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FARMER DASHBOARD */}
        {currentTab === 'farmer-dashboard' && profile?.role === UserRole.FARMER && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200 rounded-3xl shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-950 flex items-center">
                  <Store className="w-5.5 h-5.5 mr-2 text-emerald-600" />
                  Nhà Vườn {profile.farmName || profile.displayName}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Quản lý gieo trồng, đăng bán sản phẩm nông nghiệp và theo dõi đơn hàng đặt mua trực tiếp của khách hàng.
                </p>
              </div>
              
              <button
                id="add-new-product-btn"
                onClick={() => setShowAddProductModal(true)}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Đăng bán nông sản mới</span>
              </button>
            </div>

            {/* Dashboard grid (My listings & Farmer Orders) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left pane: Farmer's listed products */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider pl-1 flex items-center justify-between">
                  <span>Nông sản đang đăng bán ({products.filter(p => p.farmerId === profile.id).length})</span>
                </h4>

                <div className="space-y-3">
                  {products.filter(p => p.farmerId === profile.id).length === 0 ? (
                    <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
                      <Leaf className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 italic">Nhà vườn chưa đăng bán sản phẩm nào.</p>
                    </div>
                  ) : (
                    products.filter(p => p.farmerId === profile.id).map((p) => (
                      <div key={p.id} className="bg-white p-3 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-3 truncate">
                          <img 
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} 
                            alt={p.name} 
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                          />
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{convertAndFormatPriceAndUnit(p.price, p.unit)}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-md">
                            {t('prod.stock')}: {convertAndFormatQuantity(p.quantity, p.unit)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right pane: Incoming Orders to fulfill (Divided clearly into Sell and Buy) */}
              <div className="space-y-4">
                {(() => {
                  const sellOrders = orders.filter(o => o.farmerId === profile.id);
                  const buyOrders = orders.filter(o => o.consumerId === profile.id);

                  const typeOrders = farmerOrderTypeTab === 'sell' ? sellOrders : buyOrders;
                  const activeOrders = typeOrders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.SHIPPED);
                  const historyOrders = typeOrders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED);
                  const displayOrders = farmerOrderSubTab === 'active' ? activeOrders : historyOrders;

                  return (
                    <div className="bg-white p-5 border border-slate-200 rounded-3xl shadow-xs space-y-5">
                      
                      {/* Top Tabs: Sell Orders vs Buy Orders */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setFarmerOrderTypeTab('sell');
                            setFarmerOrderSubTab('active');
                          }}
                          className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                            farmerOrderTypeTab === 'sell'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200/50'
                          }`}
                        >
                          <Store className="w-4 h-4" />
                          <span>ĐƠN BÁN ({sellOrders.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFarmerOrderTypeTab('buy');
                            setFarmerOrderSubTab('active');
                          }}
                          className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                            farmerOrderTypeTab === 'buy'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200/50'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>ĐƠN MUA ({buyOrders.length})</span>
                        </button>
                      </div>

                      {/* Header with filters */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {farmerOrderTypeTab === 'sell' ? 'Quản lý Đơn Bán hàng' : 'Theo dõi Đơn Mua nông sản'}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {farmerOrderTypeTab === 'sell' 
                              ? 'Sản phẩm được khách hàng đặt từ vườn gieo của bạn.' 
                              : 'Sản phẩm bạn đặt mua từ nhà vườn sạch khác.'}
                          </p>
                        </div>
                        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl text-[10px] font-extrabold self-start sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => setFarmerOrderSubTab('active')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                              farmerOrderSubTab === 'active'
                                ? 'bg-white text-emerald-800 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <span>Đang xử lý ({activeOrders.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFarmerOrderSubTab('history')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                              farmerOrderSubTab === 'history'
                                ? 'bg-white text-emerald-800 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <span>Lịch sử ({historyOrders.length})</span>
                          </button>
                        </div>
                      </div>

                      {/* Orders rendering */}
                      <div className="space-y-3">
                        {displayOrders.length === 0 ? (
                          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
                            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 italic">
                              {farmerOrderSubTab === 'active' 
                                ? 'Không có đơn hàng nào đang chờ xử lý.' 
                                : 'Chưa có đơn hàng nào trong lịch sử.'}
                            </p>
                          </div>
                        ) : (
                          displayOrders.map((order) => {
                            const isBuyer = order.consumerId === profile.id;
                            const isSeller = order.farmerId === profile.id;

                            return (
                              <div key={order.id} className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs animate-fade-in hover:border-slate-300 transition-colors">
                                {/* Order header */}
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                  <div>
                                    {isSeller ? (
                                      <p 
                                        onClick={() => setSelectedConsumerId(order.consumerId)}
                                        className="font-extrabold text-slate-950 hover:text-emerald-700 hover:underline cursor-pointer flex items-center space-x-1.5"
                                        title="Nhấn để xem chi tiết & lịch sử đặt mua của khách"
                                      >
                                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase">Đơn Bán</span>
                                        <span>Khách: {order.consumerName}</span>
                                        <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-sm font-semibold">Lịch sử</span>
                                      </p>
                                    ) : (
                                      <p 
                                        onClick={() => setSelectedFarmerId(order.farmerId)}
                                        className="font-extrabold text-slate-950 hover:text-emerald-700 hover:underline cursor-pointer flex items-center space-x-1.5"
                                        title="Nhấn để xem chi tiết nhà vườn này"
                                      >
                                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase">Đơn Mua</span>
                                        <span>Nhà vườn: {order.farmerName}</span>
                                        <span className="text-[9px] text-blue-800 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-sm font-semibold">Chi tiết</span>
                                      </p>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1">Mã đơn: #{order.id.slice(-6).toUpperCase()} • Đặt ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                                  </div>

                                  {/* Status badge */}
                                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                                    order.status === OrderStatus.PENDING ? 'bg-yellow-50 text-yellow-800 border border-yellow-100' :
                                    order.status === OrderStatus.ACCEPTED ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                                    order.status === OrderStatus.SHIPPED ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                                    order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                    'bg-red-50 text-red-800 border border-red-100'
                                  }`}>
                                    {order.status === OrderStatus.PENDING ? 'Chờ xác nhận' :
                                     order.status === OrderStatus.ACCEPTED ? 'Đã duyệt' :
                                     order.status === OrderStatus.SHIPPED ? 'Đang vận chuyển' :
                                     order.status === OrderStatus.COMPLETED ? 'Đã hoàn thành' :
                                     'Đã hủy'}
                                  </span>
                                </div>

                                {/* Order content */}
                                <div className="space-y-1.5 text-slate-600 leading-relaxed font-medium">
                                  <p className="font-extrabold text-slate-900 text-sm">
                                    🌾 {order.productName} ({convertAndFormatQuantity(order.quantity, 'kg')})
                                  </p>
                                  <p className="flex justify-between">
                                    <span>{locale === 'vi' ? 'Tổng giá trị đơn:' : 'Total value:'}</span>
                                    <span className="font-black text-emerald-800">{formatPrice(order.totalPrice)}</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span>{locale === 'vi' ? 'Phương thức thanh toán:' : 'Payment Method:'}</span>
                                    <span className="font-bold text-slate-700 uppercase">{order.paymentMethod === 'pi' ? 'Ví Pi Network ⚡' : (locale === 'vi' ? 'Thanh toán COD' : 'Cash on Delivery')}</span>
                                  </p>
                                  <p>{locale === 'vi' ? '📞 Điện thoại:' : '📞 Phone:'} <span className="font-semibold text-slate-800">{order.phone}</span></p>
                                  <p>{locale === 'vi' ? '📍 Nơi nhận:' : '📍 Address:'} <span className="font-semibold text-slate-800">{order.shippingAddress}</span></p>
                                  {order.notes && <p className="italic text-slate-500 bg-slate-100 p-2 rounded-xl border border-slate-150 mt-1">{locale === 'vi' ? 'Ghi chú' : 'Notes'}: "{order.notes}"</p>}
                                </div>

                                {/* Dynamic Order Actions depending on isSeller / isBuyer */}
                                <div className="flex space-x-1.5 justify-end pt-2 border-t border-slate-100">
                                  {isSeller ? (
                                    <>
                                      {order.status === OrderStatus.PENDING && (
                                        <>
                                          <button
                                            id={`cancel-order-${order.id}`}
                                            onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold rounded-xl cursor-pointer transition-colors"
                                          >
                                            Hủy đơn
                                          </button>
                                          <button
                                            id={`accept-order-${order.id}`}
                                            onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.ACCEPTED)}
                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl cursor-pointer transition-colors shadow-xs"
                                          >
                                            Duyệt giao
                                          </button>
                                        </>
                                      )}
                                      {order.status === OrderStatus.ACCEPTED && (
                                        <button
                                          id={`ship-order-${order.id}`}
                                          onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.SHIPPED)}
                                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl cursor-pointer flex items-center space-x-1 transition-colors shadow-xs"
                                        >
                                          <Truck className="w-3.5 h-3.5" />
                                          <span>Giao hàng / Gửi xe</span>
                                        </button>
                                      )}
                                      {order.status === OrderStatus.SHIPPED && (
                                        <button
                                          id={`complete-order-${order.id}`}
                                          onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.COMPLETED)}
                                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl cursor-pointer transition-colors shadow-xs"
                                        >
                                          Hoàn thành giao
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {order.status === OrderStatus.PENDING && (
                                        <button
                                          id={`cancel-order-${order.id}`}
                                          onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold rounded-xl cursor-pointer transition-colors"
                                        >
                                          Hủy đơn mua
                                        </button>
                                      )}
                                      {order.status === OrderStatus.SHIPPED && (
                                        <button
                                          id={`complete-order-${order.id}`}
                                          onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.COMPLETED)}
                                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl cursor-pointer transition-colors shadow-xs"
                                        >
                                          Đã nhận được hàng
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: CONSUMER ORDERS */}
        {currentTab === 'consumer-orders' && profile?.role === UserRole.CONSUMER && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-black text-slate-950 flex items-center">
              <FileText className="w-5.5 h-5.5 mr-2 text-emerald-600" />
              Lịch sử mua nông sản sạch
            </h3>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                  <p className="text-slate-500 font-semibold text-sm">Bạn chưa thực hiện đơn đặt mua nào.</p>
                  <button
                    onClick={() => setCurrentTab('catalog')}
                    className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    Ghé thăm chợ nông sản ngay
                  </button>
                </div>
              ) : (
                orders.map((order) => {
                  return (
                    <div key={order.id} className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-3.5 text-xs">
                      {/* Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900">Bà con gieo trồng: {order.farmerName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Đặt mua: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
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

                      {/* Content */}
                      <div className="space-y-1.5 text-slate-600 leading-relaxed">
                        <p className="font-bold text-slate-800 text-sm">🛍️ {order.productName} ({locale === 'vi' ? 'SL' : 'Qty'}: {convertAndFormatQuantity(order.quantity, 'kg')})</p>
                        <p>{locale === 'vi' ? '💰 Đơn giá tổng cộng:' : '💰 Total price:'} <span className="font-bold text-emerald-800">{formatPrice(order.totalPrice)}</span></p>
                        <p>{locale === 'vi' ? '📍 Giao đến địa chỉ:' : '📍 Shipping address:'} {order.shippingAddress}</p>
                      </div>

                      {/* Cancel action */}
                      {order.status === OrderStatus.PENDING && (
                        <div className="flex justify-end pt-1">
                          <button
                            id={`cancel-order-cons-${order.id}`}
                            onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Hủy đơn mua
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CART & CHECKOUT */}
        {currentTab === 'cart' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h3 className="text-xl font-black text-slate-950 flex items-center">
              <ShoppingCart className="w-5.5 h-5.5 mr-2 text-emerald-600" />
              Giỏ hàng nông sản sạch của bạn
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold text-sm">Chưa có nông sản sạch nào trong giỏ hàng.</p>
                <button
                  onClick={() => setCurrentTab('catalog')}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Ghé chợ nông sản chọn mua
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* List of items */}
                <div className="lg:col-span-3 space-y-3.5">
                  {cart.map((item) => {
                    const totalItemPrice = item.product.price * item.quantity;
                    return (
                      <div key={item.product.id} className="bg-white p-4 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-3 truncate">
                          <img 
                            src={item.product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} 
                            alt={item.product.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-150"
                          />
                          <div className="truncate text-left">
                            <p className="font-bold text-xs text-slate-900 truncate">{item.product.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {locale === 'vi' ? 'Đơn giá' : 'Unit price'}: {convertAndFormatPriceAndUnit(item.product.price, item.product.unit)}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {locale === 'vi' ? 'Số lượng' : 'Quantity'}: {convertAndFormatQuantity(item.quantity, item.product.unit)}
                            </p>
                            <p className="text-emerald-700 font-bold text-xs mt-1">
                              {locale === 'vi' ? 'Tổng' : 'Total'}: {formatPrice(totalItemPrice)}
                            </p>
                          </div>
                        </div>

                        <button
                          id={`remove-cart-${item.product.id}`}
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0 transition-colors"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Checkout info form */}
                <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-3xl shadow-xs h-fit">
                  <h4 className="font-black text-slate-950 text-sm mb-4 uppercase tracking-wider">{locale === 'vi' ? 'Thông tin đặt hàng nông sản' : 'Order Checkout Information'}</h4>

                  {profile ? (
                    <form onSubmit={handleCheckout} className="space-y-4 text-xs">
                      
                      {/* Price summary */}
                      <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between mb-4">
                        <span className="font-bold text-emerald-900">{locale === 'vi' ? 'Tổng thanh toán:' : 'Total amount:'}</span>
                        <span className="font-black text-lg text-emerald-800">
                          {formatPrice(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))}
                        </span>
                      </div>

                      {/* Phone number */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">SỐ ĐIỆN THOẠI LIÊN HỆ <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          required
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          placeholder="Ví dụ: 0987654321"
                          className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-xs text-slate-800"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">ĐỊA CHỈ NHẬN NÔNG SẢN <span className="text-red-500">*</span></label>
                        <textarea
                          required
                          value={checkoutAddress}
                          onChange={(e) => setCheckoutAddress(e.target.value)}
                          placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện..."
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-xs text-slate-800"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">GHI CHÚ GỬI NHÀ VƯỜN</label>
                        <textarea
                          value={checkoutNotes}
                          onChange={(e) => setCheckoutNotes(e.target.value)}
                          placeholder="Giao buổi sáng, gọi trước 15 phút, gửi chành xe..."
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-xs text-slate-800"
                        />
                      </div>

                      {/* Payment Method Selector */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Phương thức thanh toán</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cod')}
                            className={`p-3 rounded-xl border font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                              paymentMethod === 'cod'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1">💵 COD</span>
                            <span className="text-[10px] text-slate-500 font-medium">Nhận hàng trả tiền</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('pi')}
                            className={`p-3 rounded-xl border font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                              paymentMethod === 'pi'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1">⚡ Pi Network</span>
                            <span className="text-[10px] text-slate-500 font-medium">Trả qua Ví Pi</span>
                          </button>
                        </div>
                        {paymentMethod === 'pi' && (
                          <div className="mt-2.5 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[10px] text-amber-900 leading-relaxed font-semibold">
                            <span className="text-amber-800 font-extrabold uppercase block mb-0.5">💰 Thanh toán Pi Network:</span>
                            Ước lượng tỷ giá: <span className="font-extrabold">1 Pi = 100.000 VNĐ</span>.<br />
                            Số Pi cần thanh toán: <span className="font-extrabold text-sm text-emerald-700">
                              {(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) / 100000).toFixed(4)} Pi
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        id="submit-checkout-btn"
                        type="submit"
                        disabled={placingOrder}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2"
                      >
                        {placingOrder ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Gửi Đơn Đặt Hàng</span>
                          </>
                        )}
                      </button>

                    </form>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-xs text-slate-500 italic">Vui lòng đăng nhập Google để tiến hành thanh toán và hỗ trợ liên hệ bà con nông dân gieo trồng.</p>
                      <button
                        onClick={signInWithGoogle}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Đăng nhập ngay
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* 2. Modals: ADD PRODUCT MODAL (FARMER ONLY) */}
      <AnimatePresence>
        {showAddProductModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="font-black text-slate-950 text-base flex items-center">
                  <PlusCircle className="w-5 h-5 mr-1.5 text-emerald-600" />
                  Đăng bán nông sản sạch mới
                </h3>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleAddProduct} className="py-4 space-y-4 text-xs overflow-y-auto max-h-[65vh]">
                
                {/* Product Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">TÊN NÔNG SẢN ĐĂNG BÁN <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ví dụ: Vải thiều chín sẫm mọng nước, Na chi lăng..."
                    className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">DANH MỤC NÔNG SẢN</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden text-slate-800 cursor-pointer"
                    >
                      <option value="Rau củ tươi">Rau củ tươi</option>
                      <option value="Trái cây đặc sản">Trái cây đặc sản</option>
                      <option value="Gạo & Ngũ cốc">Gạo & Ngũ cốc</option>
                      <option value="Gia vị & Thảo mộc">Gia vị & Thảo mộc</option>
                      <option value="Nông sản khác">Nông sản khác</option>
                    </select>
                  </div>

                  {/* Province location */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">ĐỊA PHƯƠNG GIEO TRỒNG</label>
                    <select
                      value={newProductLocation}
                      onChange={(e) => setNewProductLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden text-slate-800 cursor-pointer"
                    >
                      {LOCATIONS.map((loc, idx) => (
                        <option key={idx} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">ĐƠN GIÁ (VNĐ) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(Number(e.target.value))}
                      placeholder="35000"
                      className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-slate-800"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">ĐƠN VỊ TÍNH <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newProductUnit}
                      onChange={(e) => setNewProductUnit(e.target.value)}
                      placeholder="kg, bó, chùm, buồng..."
                      className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-slate-800"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">SỐ LƯỢNG KHO SẴN CÓ <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProductQuantity}
                      onChange={(e) => setNewProductQuantity(Number(e.target.value))}
                      placeholder="200"
                      className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-slate-800"
                    />
                  </div>
                </div>

                {/* Organic status toggle */}
                <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-2xl border border-slate-250">
                  <input
                    type="checkbox"
                    id="organic-checkbox"
                    checked={newProductIsOrganic}
                    onChange={(e) => setNewProductIsOrganic(e.target.checked)}
                    className="w-4.5 h-4.5 accent-emerald-600 rounded-sm cursor-pointer"
                  />
                  <label htmlFor="organic-checkbox" className="font-bold text-slate-700 cursor-pointer">
                    Sản phẩm gieo trồng Hữu Cơ tự nhiên / VietGAP an toàn thực phẩm
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">MÔ TẢ CHI TIẾT NÔNG SẢN</label>
                  <textarea
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    placeholder="Mô tả quy trình gieo trồng sạch, cam kết an toàn, thời điểm thu hoạch tươi ngon trong ngày..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-slate-800"
                  />
                  
                  {/* AI assistant helper inside listing form */}
                  <div className="mt-2 text-[10px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl flex items-center justify-between border border-emerald-100">
                    <span className="font-semibold">💡 Bạn muốn AI gõ mô tả thu hút siêu thị/khách hàng? Hãy mở Trợ Lý AI góc phải màn hình chọn presets!</span>
                  </div>
                </div>

                {/* Image upload, presets / custom URL */}
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700">ẢNH SẢN PHẨM NÔNG SẢN <span className="text-red-500">*</span></label>
                  
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('product-file-upload')?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                      isDragging 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : newProductImage 
                          ? 'border-emerald-500 bg-emerald-50/10' 
                          : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="file"
                      id="product-file-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {newProductImage ? (
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                        <img src={newProductImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-[10px] text-white font-bold">Thay đổi ảnh</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 animate-bounce" />
                        <div>
                          <p className="font-bold text-slate-700 text-xs">Kéo thả ảnh vào đây, hoặc click để chọn ảnh</p>
                          <p className="text-[10px] text-slate-400 mt-1">Chấp nhận PNG, JPG, JPEG, WEBP (Tối đa 1.5MB)</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-extrabold uppercase">Hoặc chọn ảnh mẫu có sẵn</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Presets */}
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_IMAGES.map((img, idx) => {
                      const isSelected = newProductImage === img.url;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setNewProductImage(img.url)}
                          className={`relative h-12 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-transparent'}`}
                          title={img.name}
                        >
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Divider or URL option */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase">Hoặc nhập liên kết ảnh tuỳ ý</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <input
                    type="url"
                    value={newProductImage.startsWith('data:') ? '' : newProductImage}
                    onChange={(e) => setNewProductImage(e.target.value)}
                    placeholder="Dán địa chỉ liên kết ảnh tuỳ ý (e.g. Unsplash)..."
                    className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-hidden text-slate-800 text-[11px]"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    id="submit-product-form-btn"
                    type="submit"
                    disabled={submittingProduct}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-xs"
                  >
                    {submittingProduct ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Đăng bán ngay</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pi Network Payment Simulator Modal */}
      <AnimatePresence>
        {showPiSimulator && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs text-slate-800"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">π</div>
                  <div>
                    <h3 className="font-black text-slate-950 text-sm">Trình Giả Lập Ví Pi Network</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Thử nghiệm thanh toán nông nghiệp số</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPiSimulator(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Body */}
              <div className="py-5 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">{locale === 'vi' ? 'Đơn hàng nông sản:' : 'Produce order:'}</span>
                    <span className="text-slate-800 font-bold">
                      {cart.length} {locale === 'vi' ? 'loại nông sản sạch' : 'fresh produce items'}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">{locale === 'vi' ? 'Tổng thanh toán:' : 'Total amount:'}</span>
                    <span className="text-slate-800 font-bold">
                      {formatPrice(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-dashed border-slate-200 pt-2 font-bold text-amber-900">
                    <span>{locale === 'vi' ? 'Số Pi ước tính (1 Pi = 100K VNĐ):' : 'Estimated Pi (1 Pi = 100K VND):'}</span>
                    <span className="text-lg font-black text-amber-600">
                      {(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) / 100000).toFixed(4)} Pi
                    </span>
                  </div>
                </div>

                {piPaymentStatus === 'idle' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      Hệ thống sẽ liên kết trực tiếp tới ứng dụng <span className="text-amber-600">Pi Browser / Pi Wallet App</span> để tiến hành trừ Pi tự động từ tài khoản của bạn trên Pi Testnet/Mainnet.
                    </p>
                    
                    <div className="space-y-2 p-3 bg-amber-50/40 rounded-xl border border-amber-100/50">
                      <label className="block text-[10px] font-bold text-amber-900 uppercase">CỤM CỰC MẬT KHẨU VÍ (MÔ PHỎNG)</label>
                      <input
                        type="password"
                        placeholder="24 từ mật khẩu ví Pi (Ví dụ: alpha bravo charlie...)"
                        className="w-full px-3 py-2 border border-slate-200 focus:border-amber-500 rounded-lg focus:outline-hidden text-[10px] text-slate-800"
                        readOnly
                        value="••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1 italic font-medium">Bản quyền Google AI Studio bảo mật. Không yêu cầu nhập passphrase thật.</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPiPaymentStatus('initiating');
                        setTimeout(() => {
                          setPiPaymentStatus('paying');
                          setTimeout(() => {
                            const tx = `pi_tx_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`;
                            setPiTxId(tx);
                            setPiPaymentStatus('success');
                          }, 2500);
                        }, 1800);
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer text-xs"
                    >
                      <span>🔑 Khởi chạy & Ký giao dịch bằng Ví Pi</span>
                    </button>
                  </div>
                )}

                {piPaymentStatus === 'initiating' && (
                  <div className="py-8 text-center space-y-3.5">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-800 text-xs">Đang mở cổng Pi Sandbox API...</p>
                      <p className="text-[10px] text-slate-400">Yêu cầu ủy quyền thanh toán từ Node SDK...</p>
                    </div>
                  </div>
                )}

                {piPaymentStatus === 'paying' && (
                  <div className="py-8 text-center space-y-3.5">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-800 text-xs">Đang ghi nhận giao dịch lên Pi Block...</p>
                      <p className="text-[10px] text-slate-400">Đồng thuận phân tán từ các Node Việt Nam...</p>
                    </div>
                  </div>
                )}

                {piPaymentStatus === 'success' && (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-lg font-black shadow-inner">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold text-emerald-800 text-sm">Giao dịch đồng thuận thành công!</p>
                      <p className="text-[10px] text-slate-400">Đã lưu trữ mã Blockchain Pi Ledger</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] text-slate-500 text-left font-mono truncate">
                      <span className="font-bold font-sans text-slate-700 uppercase block mb-1">TXID Ledger:</span>
                      {piTxId}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        completePiPayment(piTxId);
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Xác Nhận & Gửi Đơn Đặt Hàng</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailsModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onChat={(p) => {
              setSelectedProduct(null);
              handleStartChat(p);
            }}
            onAddToCart={(p, qty) => {
              handleAddToCart(p, qty);
              setSelectedProduct(null);
            }}
            onBuyNow={(p, qty) => {
              handleBuyNow(p, qty);
              setSelectedProduct(null);
            }}
            onSelectFarmer={(farmerId) => {
              setSelectedProduct(null);
              setSelectedFarmerId(farmerId);
            }}
          />
        )}
      </AnimatePresence>

      {/* 4. Chat Overlay Window */}
      <AnimatePresence>
        {chatOpen && (
          <ChatWindow
            onClose={() => {
              setChatOpen(false);
              setChatFarmerId(undefined);
              setChatFarmerName(undefined);
              setChatProduct(undefined);
            }}
            targetFarmerId={chatFarmerId}
            targetFarmerName={chatFarmerName}
            initialProduct={chatProduct}
            onAddToCart={(prod) => {
              setChatOpen(false);
              handleAddToCart(prod, 1);
            }}
            onBuyNow={(prod) => {
              setChatOpen(false);
              handleBuyNow(prod, 1);
            }}
          />
        )}
      </AnimatePresence>

      {/* 4.1 Farmer Details Modal */}
      <AnimatePresence>
        {selectedFarmerId && (
          <FarmerDetailsModal
            farmerId={selectedFarmerId}
            onClose={() => setSelectedFarmerId(null)}
            onSelectProduct={(prod) => {
              setSelectedFarmerId(null);
              setSelectedProduct(prod);
            }}
            onChatWithFarmer={(fId) => {
              setSelectedFarmerId(null);
              const prodWithFarmer = products.find(p => p.farmerId === fId);
              const name = prodWithFarmer?.farmerName || 'Nhà vườn';
              handleStartChat({ farmerId: fId, farmerName: name } as any);
            }}
            allProducts={products}
            allOrders={orders}
          />
        )}
      </AnimatePresence>

      {/* 4.2 Consumer/Buyer Details Modal */}
      <AnimatePresence>
        {selectedConsumerId && (
          <ConsumerDetailsModal
            consumerId={selectedConsumerId}
            onClose={() => setSelectedConsumerId(null)}
            allOrders={orders}
            farmerId={user?.uid || ''}
          />
        )}
      </AnimatePresence>

      {/* 5. Smart AI Assistant floating component */}
      <AIAssistant 
        farmerMode={profile?.role === UserRole.FARMER}
        onOptimizeDescription={(optText) => {
          // If farmer is creating product, help fill in the description
          setNewProductDescription(optText);
          alert('💡 Đã tự động điền bản mô tả sản phẩm được tối ưu bởi AI!');
        }}
      />

      {/* 6. Footer Section */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12 mt-16 text-xs font-semibold leading-relaxed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="font-black text-sm uppercase text-emerald-400">Sàn Nông Sản Việt</span>
            </div>
            <p className="text-slate-400 font-medium">
              Sứ mệnh của chúng tôi là bảo vệ sức khỏe người tiêu dùng bằng nông nghiệp sạch hữu cơ, nâng cao sinh kế bền vững cho bà con nông dân gieo trồng khắp các tỉnh thành Việt Nam.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-widest mb-4 text-[10px]">Tính năng giải pháp</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>• Bản đồ định vị nguồn gốc vùng nông nghiệp gieo trồng</li>
              <li>• Hợp tác xã VietGAP và chỉ dẫn địa lý hữu cơ</li>
              <li>• Thương mại đàm phán chat trực tiếp không trung gian</li>
              <li>• Trợ lý AI tư vấn kỹ thuật gieo trồng & dinh dưỡng nấu ăn</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-widest mb-4 text-[10px]">Hỗ trợ kỹ thuật</h4>
            <p className="text-slate-400 font-medium">
              Cung cấp giải pháp số bởi Google AI Studio Build. Hệ thống lưu trữ đồng bộ bảo mật Zero-Trust ABAC Firestore.
            </p>
            <p className="text-emerald-500 font-bold mt-2">Phát triển bởi anhthanhbg123@gmail.com</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-center text-slate-500 text-[10px]">
          © {new Date().getFullYear()} Sàn Giao Dịch Nông Sản Việt. All Rights Reserved.
        </div>
      </footer>

      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className={`p-4 rounded-2xl shadow-xl border flex flex-col pointer-events-auto bg-white/95 backdrop-blur-md ${
                t.type === 'success' ? 'border-emerald-100 text-slate-800' :
                t.type === 'error' ? 'border-red-100 text-slate-800' :
                'border-sky-100 text-slate-800'
              }`}
            >
              <div className="flex items-start space-x-3 text-xs">
                {t.type === 'success' && <div className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shrink-0 font-bold">✓</div>}
                {t.type === 'error' && <div className="w-5 h-5 bg-red-100 text-red-800 rounded-full flex items-center justify-center shrink-0 font-bold">✕</div>}
                {t.type === 'info' && <div className="w-5 h-5 bg-sky-100 text-sky-800 rounded-full flex items-center justify-center shrink-0 font-bold">i</div>}
                
                <div className="flex-1">
                  <p className="font-semibold leading-relaxed text-slate-700">{t.message}</p>
                  {t.action && (
                    <button
                      onClick={() => {
                        t.action?.onClick();
                        setToasts(prev => prev.filter(item => item.id !== t.id));
                      }}
                      className="mt-2 text-xs font-black text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center space-x-1 hover:underline"
                    >
                      <span>{t.action.label}</span>
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs p-1"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
