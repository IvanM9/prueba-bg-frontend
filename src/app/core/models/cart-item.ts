export interface CartItem {
  productId: number;
  productName: string;
  productCode: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  lineSubtotal: number;
}