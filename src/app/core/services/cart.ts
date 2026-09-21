import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { Cart } from '../models/cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private api = inject(Api);

  addItem(productId: number, quantity: number): Observable<Cart> {
    return this.api.post<Cart>('/cart/items', { productId, quantity });
  }

  updateItem(productId: number, quantity: number): Observable<Cart> {
    return this.api.put<Cart>(`/cart/items/${productId}`, { quantity });
  }

  removeItem(productId: number): Observable<void> {
    return this.api.delete<void>(`/cart/items/${productId}`);
  }

  clearCart(): Observable<void> {
    return this.api.delete<void>('/cart');
  }

  getCart(): Observable<Cart> {
    return this.api.get<Cart>('/cart');
  }
}
