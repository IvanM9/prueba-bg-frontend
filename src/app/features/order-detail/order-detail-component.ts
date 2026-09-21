import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService } from '../../core/services/orders';
import { OrderDetail } from '../../core/models/order-detail';

@Component({
  selector: 'app-order-detail-component',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-detail-component.html',
  styleUrl: './order-detail-component.css',
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);

  readonly order = signal<OrderDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly notFound = signal(false);

  readonly items = computed(() => this.order()?.items ?? []);
  readonly itemCount = computed(() => this.items().reduce((acc, item) => acc + item.quantity, 0));

  ngOnInit(): void {
    this.loadOrder();
  }

  retry(): void {
    this.loadOrder();
  }

  private loadOrder(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);

    this.order.set(null);
    this.loadError.set(null);
    this.notFound.set(false);

    if (!rawId || !Number.isInteger(id) || id <= 0) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }

    this.loading.set(true);

    this.ordersService.getOrder(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        if (error.status === 404) {
          this.notFound.set(true);
        } else {
          this.loadError.set('No se pudo cargar la orden. Inténtalo de nuevo.');
        }
      },
    });
  }
}
