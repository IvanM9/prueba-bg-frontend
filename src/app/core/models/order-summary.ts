export interface OrderSummary {
  id: number;
  createdAt: string;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}