import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { OrderDetail } from '../models/order-detail';
import { OrderSummary } from '../models/order-summary';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private api = inject(Api);

  createOrder(): Observable<OrderDetail> {
    return this.api.post<OrderDetail>('/orders', {});
  }

  getOrders(): Observable<OrderSummary[]> {
    return this.api.get<OrderSummary[]>('/orders');
  }

  getOrder(id: number): Observable<OrderDetail> {
    return this.api.get<OrderDetail>(`/orders/${id}`);
  }
}
