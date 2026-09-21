import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../core/services/orders';
import { OrderSummary } from '../../core/models/order-summary';

@Component({
  selector: 'app-orders-component',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders-component.html',
  styleUrl: './orders-component.css',
})
export class OrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);

  readonly orders = signal<OrderSummary[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly isEmpty = computed(() => !this.loading() && !this.loadError() && this.orders().length === 0);

  ngOnInit(): void {
    this.loadOrders();
  }

  retry(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.ordersService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.loading.set(false);
        this.loadError.set('No se pudieron cargar tus compras. Inténtalo de nuevo.');
      },
    });
  }
}
