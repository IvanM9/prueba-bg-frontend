import { OrderItem } from "./order-item";

export interface OrderDetail {
  id: number;
  createdAt: string;
  subtotal: number;
  discount: number;
  total: number;
  items: OrderItem[];
}