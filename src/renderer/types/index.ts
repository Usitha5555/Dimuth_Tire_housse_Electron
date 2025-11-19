export type ProductType = 'tire' | 'alloy_wheel' | 'general';

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category?: string;
  product_type?: ProductType;
  // Tire size fields
  tire_width?: number;
  tire_aspect_ratio?: number;
  tire_diameter?: number;
  tire_load_index?: string;
  tire_speed_rating?: string;
  // Alloy wheel size fields
  wheel_diameter?: number;
  wheel_width?: number;
  wheel_pcd?: string;
  wheel_offset?: string;
  wheel_center_bore?: string;
  wheel_stud_count?: number;
  wheel_stud_type?: string;
  // Combined size display
  size_display?: string;
  image_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: 'sale' | 'purchase' | 'adjustment' | 'return';
  quantity: number;
  reference_id?: number;
  notes?: string;
  created_at: string;
}

export interface DailySalesReport {
  summary: {
    total_invoices: number;
    total_revenue: number;
    total_subtotal: number;
    total_tax: number;
    total_discount: number;
  };
  topProducts: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

