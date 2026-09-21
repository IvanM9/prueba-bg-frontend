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

  getCart(): Observable<Cart> {
    return this.api.get<Cart>('/cart');
  }
}
