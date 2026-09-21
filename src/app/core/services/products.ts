import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class Products {
  private api = inject(Api);

  getProducts(name?: string): Observable<Product[]> {
    const query = name?.trim();
    const url = query ? `/products?name=${encodeURIComponent(query)}` : '/products';
    return this.api.get<Product[]>(url);
  }
}
