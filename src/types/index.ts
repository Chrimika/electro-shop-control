
// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'owner' | 'vendor' | 'repairer';
  storeId?: string;
  repairSpecialty?: string; // For repairers
}

// Store types
export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
}

// Products and inventory
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  supplier: string;
  basePrice: number;
  imageUrl?: string;
  createdAt: Date;
}

export interface StoreInventory {
  storeId: string;
  productId: string;
  quantity: number;
  updatedAt: Date;
}

// Sales types
export type SaleType = 
  | 'direct' 
  | 'installment' 
  | 'partialPaid' 
  | 'deliveredNotPaid' 
  | 'trade';

export interface Sale {
  id: string;
  storeId: string;
  vendorId: string;
  customer?: Customer;
  items: SaleItem[];
  saleType: SaleType;
  totalAmount: number;
  paidAmount: number;
  createdAt: Date;
  deadline?: Date; // For installment, partialPaid, deliveredNotPaid
  status: 'completed' | 'pending' | 'cancelled';
  cancellationReason?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isBadged: boolean; // Special customer with privileges
}

// Repair types
export interface RepairRequest {
  id: string;
  storeId: string;
  customerId: string;
  deviceType: 'phone' | 'computer' | 'other';
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  status: 'pending' | 'diagnosed' | 'repairing' | 'completed' | 'cancelled';
  createdAt: Date;
  repairerId?: string;
  estimatedDuration?: number; // in hours
  estimatedCost?: number;
  completedAt?: Date;
}

// Notification types
export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'sale' | 'repair' | 'inventory' | 'customer' | 'system';
  createdAt: Date;
  isRead: boolean;
  relatedId?: string; // ID of the related entity (sale, repair, etc.)
}
