export interface OrderSummary {
  id: number;
  createdAt: Date;
  subtotal: number;
  discount: number;
  itemCount: number;
}