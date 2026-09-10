export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Product {
  id: number;
  code: string;
  barcode: string;
  designation: string;
  category: string;
  purchase_price: number;
  sale_price: number;
  tva: number;
  stock_quantity: number;
  min_stock: number;
}

export interface Client {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_id: string;
  notes: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_id: string;
  notes: string;
}

export interface Settings {
  id?: number;
  company_name?: string;
  activity?: string;
  address?: string;
  city?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  commercial_register?: string;
  rib?: string;
  bank?: string;
  fiscal_stamp?: number;
  currency?: string;
  logo_path?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id: number;
  designation: string;
  quantity: number;
  unit_price_ht: number;
  tva: number;
  discount?: number;
  total_ht: number;
  total_ttc: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  date: string;
  time?: string;
  client_id: number;
  total_ht: number;
  total_tva: number;
  fiscal_stamp: number;
  total_ttc: number;
  global_discount?: number;
  status: string;
  client_name?: string;
  client_address?: string;
  client_tax_id?: string;
  client_phone?: string;
  items?: InvoiceItem[];
}
