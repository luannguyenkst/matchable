export interface Product {
  id: number;
  category_id?: number;
  category_name?: string;
  category_slug?: string; 
  sku: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  price: number;
  compare_price?: number;
  inventory_quantity: number;
  track_inventory: boolean;
  low_stock_threshold: number;
  weight?: number;
  is_active: boolean;
  is_featured: boolean;
  primary_image?: string;
  image_count: number;
  images?: ProductImage[];
  variants?: ProductVariant[];
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price?: number;
  compare_price?: number;
  inventory_quantity: number;
  weight?: number;
  attributes: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  parent_id?: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
  child_count: number;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
}

export interface ProductListResponse {
  products: Product[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}