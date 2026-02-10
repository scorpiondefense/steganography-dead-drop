export interface User {
  id: string;
  username: string;
  email: string;
  role: "customer" | "admin";
  created_at: string;
}

export interface Painting {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  artist: string;
  medium: string;
  price_cents: number;
  image_path: string;
  thumbnail_path: string | null;
  status: "active" | "sold" | "hidden";
  has_steg_message: boolean;
  steg_decoded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  total_cents: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_zip: string;
  shipping_country: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  painting_id: string;
  price_cents: number;
}

export interface OrderWithItems {
  order: Order;
  items: OrderItemWithPainting[];
}

export interface OrderItemWithPainting {
  order_item: OrderItem;
  painting: Painting;
}

export interface CartItem {
  id: string;
  user_id: string;
  painting_id: string;
  created_at: string;
}

export interface CartItemWithPainting {
  cart_item: CartItem;
  painting: Painting;
}

export interface Comment {
  id: string;
  painting_id: string;
  user_id: string;
  content: string;
  status: "visible" | "hidden" | "flagged";
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StegMessage {
  id: string;
  painting_id: string;
  direction: "incoming" | "outgoing";
  message_text: string;
  decoded_by: string | null;
  encoded_by: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaintingList {
  paintings: Painting[];
  total: number;
}

export interface AdminStats {
  total_users: number;
  total_paintings: number;
  total_orders: number;
  total_comments: number;
  total_revenue_cents: number;
  steg_paintings: number;
}

export interface DecodeResponse {
  message: string;
  painting_id: string;
  steg_message: StegMessage;
}

export interface EncodeResponse {
  success: boolean;
  painting_id: string;
  steg_message: StegMessage;
}
