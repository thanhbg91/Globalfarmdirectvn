/**
 * Shared Type Definitions for Sàn Giao Dịch Nông Sản Việt
 */

export enum UserRole {
  FARMER = 'farmer',
  CONSUMER = 'consumer',
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  farmName?: string;
  farmDescription?: string;
  farmAddress?: string;
  farmScale?: string;
  certifications?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  name: string;
  category: string; // e.g. "Rau củ", "Trái cây", "Gạo & Ngũ cốc", "Gia vị & Thảo mộc", "Khác"
  description: string;
  price: number; // VNĐ per unit
  unit: string;  // kg, bó, hộp, bao, trái...
  quantity: number; // stock
  harvestDate: string; // YYYY-MM-DD
  location: string; // e.g. "Bắc Giang", "Đà Lạt", "Đồng Tháp", etc.
  isOrganic: boolean;
  imageUrl?: string;
  createdAt: string;
  hsCode?: string; // HS Code for international shipping
  certIsISO?: boolean; // ISO Certification
  certIsHACCP?: boolean; // HACCP Certification
  certIsGlobalGAP?: boolean; // GlobalGAP Certification
  certIsPhytosanitary?: boolean; // Phytosanitary inspection certification
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Order {
  id: string;
  consumerId: string;
  consumerName: string;
  farmerId: string;
  farmerName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string;
  phone: string;
  notes?: string;
  paymentMethod?: 'cod' | 'pi';
  piTxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string; // farmerId_consumerId
  farmerId: string;
  consumerId: string;
  farmerName: string;
  consumerName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  consumerId: string;
  consumerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}
