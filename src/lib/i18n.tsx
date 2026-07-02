import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'vi' | 'en' | 'zh' | 'ko' | 'ja';
export type Currency = 'VND' | 'USD' | 'EUR' | 'CNY';
export type DisplayUnit = 'kg' | 'ton' | 'ta' | 'pound' | 'box';

// Currency exchange rates relative to VND (e.g. 1 Unit = X VND)
export const EXCHANGE_RATES: Record<Currency, number> = {
  VND: 1,
  USD: 25400, // 1 USD = 25,400 VND
  EUR: 27200, // 1 EUR = 27,200 VND
  CNY: 3500,  // 1 CNY = 3,500 VND
};

// Unit conversion factors relative to 1 KG (e.g. How many kg is 1 display unit, or conversion ratio)
// Base unit in DB is always 'kg' or count-based.
export const UNIT_CONVERSIONS = {
  kg: { ratio: 1, name: { vi: 'kg', en: 'kg', zh: '公斤', ko: 'kg', ja: 'kg' } },
  ton: { ratio: 1000, name: { vi: 'Tấn', en: 'Tons', zh: '吨', ko: '톤', ja: 'トン' } },
  ta: { ratio: 100, name: { vi: 'Tạ', en: 'Quintals', zh: '担', ko: '백kg', ja: '百kg' } },
  pound: { ratio: 0.45359237, name: { vi: 'Pound', en: 'Pounds', zh: '磅', ko: '파운드', ja: 'ポンド' } },
  box: { ratio: 15, name: { vi: 'Thùng (15kg)', en: 'Boxes (15kg)', zh: '箱 (15公斤)', ko: '상자 (15kg)', ja: '箱 (15kg)' } },
};

// Translation Dictionaries
const DICTIONARIES: Record<Locale, Record<string, string>> = {
  vi: {
    // Nav & General
    'nav.catalog': 'Chợ nông sản',
    'nav.farmer': 'Nhà vườn của tôi',
    'nav.orders': 'Đơn hàng của tôi',
    'nav.cart': 'Giỏ hàng',
    'nav.chat': 'Trò chuyện',
    'nav.add_product': 'Đăng bán',
    'app.title': 'Sàn Giao Dịch Nông Sản Xuất Khẩu',
    'app.subtitle': 'Kết nối trực tiếp nhà vườn Việt Nam với đối tác xuất khẩu toàn cầu',
    
    // Search & Filter
    'filter.search_placeholder': 'Tìm sản phẩm, nhà vườn hoặc địa danh...',
    'filter.all_categories': 'Tất cả danh mục',
    'filter.all_locations': 'Tất cả địa phương',
    'filter.organic_only': 'Đạt VietGAP / Hữu cơ',
    'filter.total_products': 'Tìm thấy {count} nông sản',
    
    // Categories
    'cat.Rau củ': 'Rau củ',
    'cat.Trái cây': 'Trái cây',
    'cat.Gạo & Ngũ cốc': 'Gạo & Ngũ cốc',
    'cat.Gia vị & Thảo mộc': 'Gia vị & Thảo mộc',
    'cat.Khác': 'Nông sản khác',
    'cat.Rau củ tươi': 'Rau củ tươi',

    // Product Card / Info
    'prod.vietgap': 'Đạt VietGAP / Hữu cơ',
    'prod.out_of_stock': 'Đợi thu hoạch mới',
    'prod.low_stock': 'Sắp hết mùa',
    'prod.farmer_vessel': 'Vườn gieo:',
    'prod.harvest_date': 'Hái:',
    'prod.stock': 'Kho:',
    'prod.negotiate': 'Bàn bạc',
    'prod.buy_now': 'Đặt mua',
    'prod.details': 'Chi tiết nông sản',
    'prod.description': 'Mô tả sản phẩm',
    'prod.quantity': 'Số lượng',
    'prod.total': 'Tổng tiền',
    'prod.buy_now_btn': 'Mua Ngay',
    'prod.add_to_cart': 'Thêm vào giỏ',
    
    // Farmer Dashboard
    'farmer.dashboard': 'Quản lý nhà vườn',
    'farmer.revenue': 'Tổng Doanh Thu',
    'farmer.listed_products': 'Nông sản đang đăng bán',
    'farmer.add_new_product': 'Đăng bán nông sản mới',
    'farmer.no_products': 'Bạn chưa đăng bán nông sản nào.',
    'farmer.edit_profile': 'Cập nhật thông tin nhà vườn',
    'farmer.farm_name': 'Tên nhà vườn',
    'farmer.farm_desc': 'Mô tả nhà vườn',
    'farmer.farm_address': 'Địa chỉ nhà vườn',
    'farmer.farm_scale': 'Quy mô diện tích (m2 / ha)',
    'farmer.farm_cert': 'Chứng nhận chất lượng',
    'farmer.farm_phone': 'Số điện thoại',
    'farmer.saving': 'Đang lưu...',
    'farmer.save_profile': 'Lưu thông tin nhà vườn',
    'farmer.listed_at': 'Đăng ngày',
    'farmer.update_stock': 'Cập nhật kho',

    // Orders tab
    'order.title_sell': 'Quản lý Đơn Bán hàng',
    'order.title_buy': 'Theo dõi Đơn Mua nông sản',
    'order.desc_sell': 'Sản phẩm được khách hàng đặt từ vườn gieo của bạn.',
    'order.desc_buy': 'Sản phẩm bạn đặt mua từ nhà vườn sạch khác.',
    'order.status_active': 'Đang xử lý',
    'order.status_history': 'Lịch sử',
    'order.no_orders_active': 'Không có đơn hàng nào đang chờ xử lý.',
    'order.no_orders_history': 'Chưa có đơn hàng nào trong lịch sử.',
    'order.sell_label': 'ĐƠN BÁN',
    'order.buy_label': 'ĐƠN MUA',
    'order.code': 'Mã đơn',
    'order.date': 'Đặt ngày',
    'order.buyer': 'Khách',
    'order.seller': 'Nhà vườn',
    'order.payment_method': 'Phương thức thanh toán',
    'order.payment_cod': 'Thanh toán COD',
    'order.payment_pi': 'Ví Pi Network ⚡',
    'order.phone': 'Điện thoại',
    'order.address': 'Nơi nhận',
    'order.notes': 'Ghi chú',
    'order.history_btn': 'Lịch sử',
    'order.details_btn': 'Chi tiết',
    
    // Order actions
    'order.act.cancel': 'Hủy đơn',
    'order.act.cancel_buy': 'Hủy đơn mua',
    'order.act.approve': 'Duyệt giao',
    'order.act.ship': 'Giao hàng / Gửi xe',
    'order.act.complete_sell': 'Hoàn thành giao',
    'order.act.complete_buy': 'Đã nhận được hàng',

    // Order status titles
    'status.pending': 'Chờ xác nhận',
    'status.accepted': 'Đã duyệt',
    'status.shipped': 'Đang giao',
    'status.completed': 'Đã hoàn thành',
    'status.cancelled': 'Đã hủy',

    // Cart tab
    'cart.title': 'Giỏ hàng gieo trồng',
    'cart.empty': 'Giỏ hàng của bạn đang trống.',
    'cart.empty_btn': 'Ghé chợ nông sản',
    'cart.summary': 'Tóm tắt đơn đặt',
    'cart.items_total': 'Cộng tiền',
    'cart.shipping_info': 'Thông tin nhận hàng',
    'cart.address_label': 'Địa chỉ giao hàng thực tế',
    'cart.phone_label': 'Số điện thoại liên hệ',
    'cart.notes_placeholder': 'Ghi chú thêm về xe chở hoặc thời gian thu hoạch mong muốn...',
    'cart.pay_method_label': 'Chọn hình thức thanh toán',
    'cart.pay_cod_desc': 'Thanh toán tiền mặt khi xe tải giao hàng đến nơi.',
    'cart.pay_pi_desc': 'Thanh toán bảo mật tức thì bằng tiền Pi Network.',
    'cart.checkout_btn': 'Thanh toán đơn hàng',
    'cart.placing_order': 'Đang kết nối nhà vườn...',

    // Consumer Orders Tab
    'consumer.title': 'Lịch sử mua nông sản sạch',
    'consumer.empty': 'Bạn chưa thực hiện đơn đặt mua nào.',
    'consumer.empty_btn': 'Ghé thăm chợ nông sản ngay',

    // Toast & Dialog
    'toast.added_to_cart': 'Đã thêm {name} vào giỏ hàng!',
    'toast.auth_required': 'Vui lòng đăng nhập để thực hiện tính năng này',
    'toast.profile_updated': 'Đã cập nhật thông tin nhà vườn thành công!',
    'toast.order_placed_pi': '🎉 Thanh toán bằng Ví Pi thành công! Đơn hàng gieo trồng đã gửi đến bà con nhà vườn.',
    'toast.order_placed_cod': '🎉 Đơn hàng gieo trồng đã gửi đến bà con nhà vườn thành công!',
    'toast.status_updated': 'Cập nhật trạng thái đơn hàng thành công!',
  },
  en: {
    'nav.catalog': 'Produce Market',
    'nav.farmer': 'My Farm',
    'nav.orders': 'My Orders',
    'nav.cart': 'Cart',
    'nav.chat': 'Chat',
    'nav.add_product': 'List Produce',
    'app.title': 'Agricultural Export Exchange',
    'app.subtitle': 'Directly connecting Vietnamese farms with global export partners',
    'filter.search_placeholder': 'Search produce, farms, or regions...',
    'filter.all_categories': 'All Categories',
    'filter.all_locations': 'All Locations',
    'filter.organic_only': 'VietGAP / Organic Certified',
    'filter.total_products': 'Found {count} products',
    'cat.Rau củ': 'Vegetables',
    'cat.Trái cây': 'Fruits',
    'cat.Gạo & Ngũ cốc': 'Rice & Grains',
    'cat.Gia vị & Thảo mộc': 'Spices & Herbs',
    'cat.Khác': 'Other Produce',
    'cat.Rau củ tươi': 'Fresh Veggies',
    'prod.vietgap': 'VietGAP / Organic',
    'prod.out_of_stock': 'Out of stock (Wait for harvest)',
    'prod.low_stock': 'Ending season soon',
    'prod.farmer_vessel': 'Farm:',
    'prod.harvest_date': 'Harvest:',
    'prod.stock': 'Stock:',
    'prod.negotiate': 'Negotiate',
    'prod.buy_now': 'Order Now',
    'prod.details': 'Produce Details',
    'prod.description': 'Product Description',
    'prod.quantity': 'Quantity',
    'prod.total': 'Total',
    'prod.buy_now_btn': 'Buy Now',
    'prod.add_to_cart': 'Add to Cart',
    'farmer.dashboard': 'Farm Management',
    'farmer.revenue': 'Total Revenue',
    'farmer.listed_products': 'Your Listed Produce',
    'farmer.add_new_product': 'List New Produce',
    'farmer.no_products': 'You have not listed any produce yet.',
    'farmer.edit_profile': 'Edit Farm Profile',
    'farmer.farm_name': 'Farm Name',
    'farmer.farm_desc': 'Farm Description',
    'farmer.farm_address': 'Farm Address',
    'farmer.farm_scale': 'Farm Size (sqm / hectares)',
    'farmer.farm_cert': 'Quality Certifications',
    'farmer.farm_phone': 'Phone Number',
    'farmer.saving': 'Saving...',
    'farmer.save_profile': 'Save Farm Profile',
    'farmer.listed_at': 'Listed on',
    'farmer.update_stock': 'Update Stock',
    'order.title_sell': 'Manage Sales Orders',
    'order.title_buy': 'Track Purchase Orders',
    'order.desc_sell': 'Produce ordered by customers from your farm.',
    'order.desc_buy': 'Produce ordered by you from other green farms.',
    'order.status_active': 'Processing',
    'order.status_history': 'History',
    'order.no_orders_active': 'No pending orders found.',
    'order.no_orders_history': 'No historic orders found.',
    'order.sell_label': 'SALES',
    'order.buy_label': 'PURCHASE',
    'order.code': 'Order ID',
    'order.date': 'Order Date',
    'order.buyer': 'Customer',
    'order.seller': 'Farm',
    'order.payment_method': 'Payment Method',
    'order.payment_cod': 'Cash on Delivery (COD)',
    'order.payment_pi': 'Pi Network Wallet ⚡',
    'order.phone': 'Phone',
    'order.address': 'Delivery Address',
    'order.notes': 'Notes',
    'order.history_btn': 'History',
    'order.details_btn': 'Details',
    'order.act.cancel': 'Cancel Order',
    'order.act.cancel_buy': 'Cancel Purchase',
    'order.act.approve': 'Approve',
    'order.act.ship': 'Ship / Handover',
    'order.act.complete_sell': 'Complete Delivery',
    'order.act.complete_buy': 'Mark Received',
    'status.pending': 'Pending',
    'status.accepted': 'Approved',
    'status.shipped': 'In Transit',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'cart.title': 'My Cultivation Cart',
    'cart.empty': 'Your cart is empty.',
    'cart.empty_btn': 'Go to Market',
    'cart.summary': 'Order Summary',
    'cart.items_total': 'Subtotal',
    'cart.shipping_info': 'Shipping Information',
    'cart.address_label': 'Detailed Delivery Address',
    'cart.phone_label': 'Contact Phone Number',
    'cart.notes_placeholder': 'Transportation details, shipping requests, or harvest timing...',
    'cart.pay_method_label': 'Payment Method',
    'cart.pay_cod_desc': 'Pay cash when the vehicle delivers the goods to your destination.',
    'cart.pay_pi_desc': 'Secure instant payment using Pi Network cryptocurrency.',
    'cart.checkout_btn': 'Place Order Now',
    'cart.placing_order': 'Connecting to Farm...',
    'consumer.title': 'My Organic Produce Purchases',
    'consumer.empty': 'You have not placed any orders yet.',
    'consumer.empty_btn': 'Visit Produce Market Now',
    'toast.added_to_cart': 'Added {name} to cart!',
    'toast.auth_required': 'Please sign in to perform this action',
    'toast.profile_updated': 'Farm profile updated successfully!',
    'toast.order_placed_pi': '🎉 Pi Payment Successful! Cultivation order sent to the farmer.',
    'toast.order_placed_cod': '🎉 Cultivation order submitted successfully!',
    'toast.status_updated': 'Order status updated successfully!',
  },
  zh: {
    'nav.catalog': '农产品市场',
    'nav.farmer': '我的农场',
    'nav.orders': '我的订单',
    'nav.cart': '购物车',
    'nav.chat': '在线沟通',
    'nav.add_product': '发布产品',
    'app.title': '农产品出口交易所',
    'app.subtitle': '直接连接越南农场与全球出口合作伙伴',
    'filter.search_placeholder': '搜索产品、农场或地区...',
    'filter.all_categories': '所有分类',
    'filter.all_locations': '所有产区',
    'filter.organic_only': 'VietGAP / 有机认证',
    'filter.total_products': '找到 {count} 个农产品',
    'cat.Rau củ': '蔬菜',
    'cat.Trái cây': '水果',
    'cat.Gạo & Ngũ cốc': '大米和谷物',
    'cat.Gia vị & Thảo mộc': '调味品与草药',
    'cat.Khác': '其他农产品',
    'cat.Rau củ tươi': '新鲜蔬菜',
    'prod.vietgap': 'VietGAP / 有机认证',
    'prod.out_of_stock': '缺货中（等待新采收）',
    'prod.low_stock': '季末即将售罄',
    'prod.farmer_vessel': '农场：',
    'prod.harvest_date': '采收日期：',
    'prod.stock': '库存：',
    'prod.negotiate': '商议价格',
    'prod.buy_now': '立即预订',
    'prod.details': '农产品详情',
    'prod.description': '产品描述说明',
    'prod.quantity': '数量',
    'prod.total': '总额',
    'prod.buy_now_btn': '立即购买',
    'prod.add_to_cart': '加入购物车',
    'farmer.dashboard': '农场经营管理',
    'farmer.revenue': '总营业额',
    'farmer.listed_products': '已发布的农产品',
    'farmer.add_new_product': '发布新农产品',
    'farmer.no_products': '您尚未发布任何农产品。',
    'farmer.edit_profile': '更新农场主页',
    'farmer.farm_name': '农场名称',
    'farmer.farm_desc': '农场介绍',
    'farmer.farm_address': '农场地址',
    'farmer.farm_scale': '种植面积 (平方米 / 公顷)',
    'farmer.farm_cert': '质量安全认证',
    'farmer.farm_phone': '联系电话',
    'farmer.saving': '正在保存...',
    'farmer.save_profile': '保存农场信息',
    'farmer.listed_at': '发布日期',
    'farmer.update_stock': '更新库存',
    'order.title_sell': '销售订单管理',
    'order.title_buy': '采购订单跟踪',
    'order.desc_sell': '客户从您的农场订购的产品。',
    'order.desc_buy': '您从其他绿色农场订购的产品。',
    'order.status_active': '处理中',
    'order.status_history': '历史记录',
    'order.no_orders_active': '暂无待处理订单。',
    'order.no_orders_history': '暂无历史订单。',
    'order.sell_label': '销售单',
    'order.buy_label': '采购单',
    'order.code': '订单号',
    'order.date': '下单时间',
    'order.buyer': '采购商',
    'order.seller': '农场',
    'order.payment_method': '付款方式',
    'order.payment_cod': '货到付款 (COD)',
    'order.payment_pi': 'Pi 钱包支付 ⚡',
    'order.phone': '联系电话',
    'order.address': '收货地址',
    'order.notes': '备注说明',
    'order.history_btn': '历史记录',
    'order.details_btn': '详情',
    'order.act.cancel': '取消订单',
    'order.act.cancel_buy': '取消采购',
    'order.act.approve': '审核通过',
    'order.act.ship': '发货/运送',
    'order.act.complete_sell': '完成交货',
    'order.act.complete_buy': '确认收货',
    'status.pending': '待确认',
    'status.accepted': '已审核',
    'status.shipped': '运输中',
    'status.completed': '已完成',
    'status.cancelled': '已取消',
    'cart.title': '订购购物车',
    'cart.empty': '购物车是空的。',
    'cart.empty_btn': '浏览农产品',
    'cart.summary': '账单总计',
    'cart.items_total': '商品小计',
    'cart.shipping_info': '收货人及运送信息',
    'cart.address_label': '详细收货地址',
    'cart.phone_label': '收货联系电话',
    'cart.notes_placeholder': '请填写运输货运要求或期望采收时间...',
    'cart.pay_method_label': '支付方式选择',
    'cart.pay_cod_desc': '货车送货上门后，以现金进行结算。',
    'cart.pay_pi_desc': '通过 Pi 币加密货币安全快速进行转账支付。',
    'cart.checkout_btn': '确认提交订单',
    'cart.placing_order': '正在连接农场主...',
    'consumer.title': '绿色农产品采购记录',
    'consumer.empty': '您尚未提交过任何订单。',
    'consumer.empty_btn': '前往市场选购',
    'toast.added_to_cart': '已成功将 {name} 加入购物车！',
    'toast.auth_required': '请先登录以使用此功能',
    'toast.profile_updated': '农场资料保存成功！',
    'toast.order_placed_pi': '🎉 Pi 支付成功！种植订单已成功发送至农场主。',
    'toast.order_placed_cod': '🎉 订购合同提交成功！已向农家发送通知。',
    'toast.status_updated': '订单状态更新成功！',
  },
  ko: {
    'nav.catalog': '농산물 직거래 장터',
    'nav.farmer': '내 농장 관리',
    'nav.orders': '내 주문 내역',
    'nav.cart': '장바구니',
    'nav.chat': '1:1 대화',
    'nav.add_product': '농산물 등록',
    'app.title': '농산물 수출 직거래 플랫폼',
    'app.subtitle': '베트남 우수 농가와 글로벌 바이어를 직접 연결합니다',
    'filter.search_placeholder': '품목, 농장명, 생산지 검색...',
    'filter.all_categories': '모든 카테고리',
    'filter.all_locations': '모든 생산지',
    'filter.organic_only': 'VietGAP / 유기농 인증',
    'filter.total_products': '{count}개의 상품이 있습니다',
    'cat.Rau củ': '야채/채소',
    'cat.Trái cây': '과일',
    'cat.Gạo & Ngũ cốc': '쌀/잡곡',
    'cat.Gia vị & Thảo mộc': '허브/조미료',
    'cat.Khác': '기타 농산물',
    'cat.Rau củ tươi': '신선 채소',
    'prod.vietgap': 'VietGAP / 유기농',
    'prod.out_of_stock': '품절 (새 수확 대기 중)',
    'prod.low_stock': '시즌 종료 임박',
    'prod.farmer_vessel': '생산 농가:',
    'prod.harvest_date': '수확일:',
    'prod.stock': '재고량:',
    'prod.negotiate': '단가 협상',
    'prod.buy_now': '구매 신청',
    'prod.details': '상세 정보',
    'prod.description': '상품 설명',
    'prod.quantity': '구매 수량',
    'prod.total': '총 결제금액',
    'prod.buy_now_btn': '바로 구매',
    'prod.add_to_cart': '장바구니 담기',
    'farmer.dashboard': '농가 대시보드',
    'farmer.revenue': '누적 총 매출액',
    'farmer.listed_products': '판매 중인 농산물',
    'farmer.add_new_product': '새 농산물 등록',
    'farmer.no_products': '등록된 판매 농산물이 없습니다.',
    'farmer.edit_profile': '농장 프로필 수정',
    'farmer.farm_name': '농장명',
    'farmer.farm_desc': '농장 설명',
    'farmer.farm_address': '농장 주소',
    'farmer.farm_scale': '재배 면적 (㎡ / ha)',
    'farmer.farm_cert': '보유 인증 마크',
    'farmer.farm_phone': '연락처',
    'farmer.saving': '저장 중...',
    'farmer.save_profile': '프로필 저장하기',
    'farmer.listed_at': '등록일',
    'farmer.update_stock': '재고 변경',
    'order.title_sell': '판매 주문서 관리',
    'order.title_buy': '구매 주문서 추적',
    'order.desc_sell': '고객들이 내 농장에 신청한 신선 주문 건들입니다.',
    'order.desc_buy': '내가 타 친환경 농가에 구매 신청한 주문 건들입니다.',
    'order.status_active': '진행중인 주문',
    'order.status_history': '완료 내역',
    'order.no_orders_active': '진행 중인 주문이 없습니다.',
    'order.no_orders_history': '완료된 이전 거래가 없습니다.',
    'order.sell_label': '판매 건',
    'order.buy_label': '구매 건',
    'order.code': '주문번호',
    'order.date': '주문일시',
    'order.buyer': '바이어명',
    'order.seller': '농가명',
    'order.payment_method': '결제 방식',
    'order.payment_cod': '현장 현금결제 (COD)',
    'order.payment_pi': 'Pi 네트워크 지갑 ⚡',
    'order.phone': '연락처',
    'order.address': '배송 주소지',
    'order.notes': '전달사항',
    'order.history_btn': '내역 보기',
    'order.details_btn': '상세보기',
    'order.act.cancel': '주문 취소',
    'order.act.cancel_buy': '구매 취소',
    'order.act.approve': '주문 승인',
    'order.act.ship': '출고/배송 시작',
    'order.act.complete_sell': '배송 완료',
    'order.act.complete_buy': '수령 완료',
    'status.pending': '승인 대기',
    'status.accepted': '결제 승인',
    'status.shipped': '배송 중',
    'status.completed': '거래 완료',
    'status.cancelled': '취소됨',
    'cart.title': '친환경 농산물 장바구니',
    'cart.empty': '장바구니에 담긴 상품이 없습니다.',
    'cart.empty_btn': '농산물 보러가기',
    'cart.summary': '결제 내역 요약',
    'cart.items_total': '총 상품 금액',
    'cart.shipping_info': '배송 정보 입력',
    'cart.address_label': '정확한 수령 주소',
    'cart.phone_label': '수령인 연락처',
    'cart.notes_placeholder': '출고 요청 사항, 운송 편 또는 수확 희망 시기 등...',
    'cart.pay_method_label': '결제 수단 선택',
    'cart.pay_cod_desc': '배송 차량 도착 시 현장에서 현금으로 결제합니다.',
    'cart.pay_pi_desc': '안전하고 신속한 Pi 암호화폐 모바일 송금 방식입니다.',
    'cart.checkout_btn': '주문 완료하기',
    'cart.placing_order': '농가에 주문 전달 중...',
    'consumer.title': '내 유기농 농산물 구매 내역',
    'consumer.empty': '구매한 내역이 아직 없습니다.',
    'consumer.empty_btn': '인기 농산물 구경가기',
    'toast.added_to_cart': '{name} 상품을 장바구니에 담았습니다!',
    'toast.auth_required': '이 기능을 사용하려면 로그인이 필요합니다',
    'toast.profile_updated': '농장 정보를 성공적으로 업데이트했습니다!',
    'toast.order_placed_pi': '🎉 Pi 결제 완료! 성공적으로 농가에 주문이 접수되었습니다.',
    'toast.order_placed_cod': '🎉 성공적으로 직거래 주문을 발송하였습니다!',
    'toast.status_updated': '주문 상태 변경이 완료되었습니다!',
  },
  ja: {
    'nav.catalog': '産地直送市場',
    'nav.farmer': 'マイ農園管理',
    'nav.orders': '注文履歴',
    'nav.cart': 'カート',
    'nav.chat': 'メッセージ',
    'nav.add_product': '新規出品',
    'app.title': '農産物輸出取引プラットフォーム',
    'app.subtitle': 'ベトナムの厳選農家とグローバルな輸出パートナーを直接繋ぎます',
    'filter.search_placeholder': '農作物、農園、または地域で検索...',
    'filter.all_categories': '全カテゴリー',
    'filter.all_locations': '全生産地',
    'filter.organic_only': 'VietGAP / 有機JAS相当',
    'filter.total_products': '{count}件の農作物が見つかりました',
    'cat.Rau củ': '野菜類',
    'cat.Trái cây': '果物類',
    'cat.Gạo & Ngũ cốc': '米・穀物類',
    'cat.Gia vị & Thảo mộc': 'ハーブ・香辛料',
    'cat.Khác': 'その他農産物',
    'cat.Rau củ tươi': '新鮮野菜',
    'prod.vietgap': 'VietGAP / 有機JAS相当',
    'prod.out_of_stock': '入荷待ち（次期収穫を待つ）',
    'prod.low_stock': 'まもなくシーズン終了',
    'prod.farmer_vessel': '生産農園:',
    'prod.harvest_date': '収穫日:',
    'prod.stock': '在庫量:',
    'prod.negotiate': '単価商談',
    'prod.buy_now': '注文する',
    'prod.details': '商品詳細スペック',
    'prod.description': '商品の説明・こだわり',
    'prod.quantity': '注文数量',
    'prod.total': '合計金額',
    'prod.buy_now_btn': '即時購入',
    'prod.add_to_cart': 'カートに入れる',
    'farmer.dashboard': '農家ダッシュボード',
    'farmer.revenue': '累計総売上額',
    'farmer.listed_products': '現在出品中の農産物',
    'farmer.add_new_product': '新製品を出品する',
    'farmer.no_products': 'まだ出品している農産物はありません。',
    'farmer.edit_profile': '農園情報の更新',
    'farmer.farm_name': '農園・組織名',
    'farmer.farm_desc': '農園のご紹介',
    'farmer.farm_address': '農園の所在地',
    'farmer.farm_scale': '栽培面積 (㎡ / ha)',
    'farmer.farm_cert': '品質・安全認証規格',
    'farmer.farm_phone': '電話番号',
    'farmer.saving': '保存中...',
    'farmer.save_profile': '変更を保存する',
    'farmer.listed_at': '出品日',
    'farmer.update_stock': '在庫を更新',
    'order.title_sell': '販売受注の管理',
    'order.title_buy': '購入発注の追跡',
    'order.desc_sell': 'あなたの農園に対して取引先から発注された注文一覧です。',
    'order.desc_buy': 'あなたが他の優良農園に対して発注した注文一覧です。',
    'order.status_active': '対応中',
    'order.status_history': '取引履歴',
    'order.no_orders_active': '対応中の注文はありません。',
    'order.no_orders_history': '過去の取引履歴はありません。',
    'order.sell_label': '売付分',
    'order.buy_label': '買付分',
    'order.code': '注文番号',
    'order.date': '受注日時',
    'order.buyer': '購入バイヤー',
    'order.seller': '生産農家',
    'order.payment_method': '決済方法',
    'order.payment_cod': '代金引換 (COD)',
    'order.payment_pi': 'Piネットワーク決済 ⚡',
    'order.phone': '連絡用電話番号',
    'order.address': 'お届け先住所',
    'order.notes': '特記事項・指示',
    'order.history_btn': '取引履歴',
    'order.details_btn': '詳細を見る',
    'order.act.cancel': '注文を拒否',
    'order.act.cancel_buy': '発注を取り消す',
    'order.act.approve': '受注を承諾',
    'order.act.ship': '出荷する / 配送手配',
    'order.act.complete_sell': '配達完了を確認',
    'order.act.complete_buy': '受領完了を報告',
    'status.pending': '承諾待ち',
    'status.accepted': '承諾済み',
    'status.shipped': '配送中',
    'status.completed': '取引完了',
    'status.cancelled': 'キャンセル済',
    'cart.title': '栽培契約カート',
    'cart.empty': 'カートに商品が入っていません。',
    'cart.empty_btn': '直売所へ戻る',
    'cart.summary': 'ご請求額の概要',
    'cart.items_total': '小計',
    'cart.shipping_info': 'お届け先情報の指定',
    'cart.address_label': '正確なお届け先住所',
    'cart.phone_label': '日中連絡の取れる電話番号',
    'cart.notes_placeholder': '希望する運送便や集荷方法、希望収穫時期など...',
    'cart.pay_method_label': '決済方法の選択',
    'cart.pay_cod_desc': '配達トラックが目的地に到着した際、現金で決済。',
    'cart.pay_pi_desc': 'Pi暗号資産を用いて安全かつ瞬時にオンライン送金します。',
    'cart.checkout_btn': '注文を確定する',
    'cart.placing_order': '農家に発注情報を送信中...',
    'consumer.title': '有機・厳選農産物の購入履歴',
    'consumer.empty': '購入履歴がまだありません。',
    'consumer.empty_btn': '産直市場へ足を運ぶ',
    'toast.added_to_cart': '{name}をカートに追加しました！',
    'toast.auth_required': 'この機能を使用するにはログインが必要です',
    'toast.profile_updated': '農園プロフィールを正常に更新しました！',
    'toast.order_placed_pi': '🎉 Pi決済完了！農園主へ契約発注が通知されました。',
    'toast.order_placed_cod': '🎉 直取引注文が農家へ送信されました！',
    'toast.status_updated': '注文ステータスを正常に変更しました！',
  }
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  displayUnit: DisplayUnit;
  setDisplayUnit: (unit: DisplayUnit) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  
  // Formatters
  formatPrice: (priceInVnd: number) => string;
  formatPriceOnly: (priceInVnd: number) => number;
  getCurrencySymbol: () => string;
  
  // Units & Quantities
  convertAndFormatPriceAndUnit: (priceInVnd: number, originalUnit: string) => string;
  convertAndFormatQuantity: (qty: number, originalUnit: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem('app_locale') as Locale) || 'vi';
  });
  
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem('app_currency') as Currency) || 'VND';
  });

  const [displayUnit, setDisplayUnitState] = useState<DisplayUnit>(() => {
    return (localStorage.getItem('app_display_unit') as DisplayUnit) || 'kg';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('app_locale', newLocale);
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('app_currency', newCurrency);
  };

  const setDisplayUnit = (newUnit: DisplayUnit) => {
    setDisplayUnitState(newUnit);
    localStorage.setItem('app_display_unit', newUnit);
  };

  // Translation helper
  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const dict = DICTIONARIES[locale] || DICTIONARIES['vi'];
    let text = dict[key] || DICTIONARIES['vi'][key] || key;
    
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  // Get raw price converted
  const formatPriceOnly = (priceInVnd: number): number => {
    if (currency === 'VND') return priceInVnd;
    return priceInVnd / EXCHANGE_RATES[currency];
  };

  const getCurrencySymbol = (): string => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'CNY': return '¥';
      default: return 'đ';
    }
  };

  // Currency Formatter
  const formatPrice = (priceInVnd: number): string => {
    const converted = formatPriceOnly(priceInVnd);
    
    if (currency === 'VND') {
      return `${Math.round(converted).toLocaleString('vi-VN')} đ`;
    } else {
      const symbol = getCurrencySymbol();
      // Format with 2 decimal places or 1 depending on value
      const decimals = converted < 100 ? 2 : 1;
      return `${symbol}${converted.toLocaleString(locale === 'vi' ? 'en-US' : locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
  };

  // Checks if a unit string is standard kg/kilogram/etc
  const isKgUnit = (unitStr: string): boolean => {
    if (!unitStr) return false;
    const clean = unitStr.toLowerCase().trim();
    return clean === 'kg' || clean === 'kí' || clean === 'kilo' || clean === 'kilogram' || clean === 'kilôgam';
  };

  // Unit and Price Converter combined
  const convertAndFormatPriceAndUnit = (priceInVnd: number, originalUnit: string): string => {
    if (!isKgUnit(originalUnit)) {
      // If original unit is not kg (e.g. bundle, box, piece), keep it, just format currency
      return `${formatPrice(priceInVnd)} / ${originalUnit}`;
    }

    // Original unit is 'kg'
    const targetUnitDef = UNIT_CONVERSIONS[displayUnit];
    
    // Convert price
    // Since unit ratio is "how many kg is 1 targetUnit" (e.g. 1 ton = 1000 kg)
    // The price for 1 targetUnit is: priceInVnd * targetUnitDef.ratio
    const pricePerTargetUnit = priceInVnd * targetUnitDef.ratio;
    const formattedPrice = formatPrice(pricePerTargetUnit);
    const targetUnitName = targetUnitDef.name[locale];
    
    return `${formattedPrice} / ${targetUnitName}`;
  };

  // Convert and Format stock quantity
  const convertAndFormatQuantity = (qty: number, originalUnit: string): string => {
    if (!isKgUnit(originalUnit)) {
      // If it's count-based, keep it
      return `${qty} ${originalUnit}`;
    }

    // Original unit is 'kg'
    const targetUnitDef = UNIT_CONVERSIONS[displayUnit];
    const convertedQty = qty / targetUnitDef.ratio;
    const targetUnitName = targetUnitDef.name[locale];

    // Format quantity beautifully
    let formattedQty = '';
    if (convertedQty % 1 === 0) {
      formattedQty = convertedQty.toString();
    } else {
      // Use up to 3 decimal places
      formattedQty = convertedQty.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      });
    }

    return `${formattedQty} ${targetUnitName}`;
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        currency,
        setCurrency,
        displayUnit,
        setDisplayUnit,
        t,
        formatPrice,
        formatPriceOnly,
        getCurrencySymbol,
        convertAndFormatPriceAndUnit,
        convertAndFormatQuantity,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
