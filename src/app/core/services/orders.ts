import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { OrderDetail } from '../models/order-detail';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private api = inject(Api);

  createOrder(): Observable<OrderDetail> {
    return this.api.post<OrderDetail>('/orders', {});
  }
}
