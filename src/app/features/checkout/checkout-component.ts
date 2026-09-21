import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart';
import { OrdersService } from '../../core/services/orders';
import { Cart } from '../../core/models/cart';
import { OrderDetail } from '../../core/models/order-detail';

type CheckoutState = 'loading' | 'ready' | 'success';

@Component({
  selector: 'app-checkout-component',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './checkout-component.html',
  styleUrl: './checkout-component.css',
})
export class CheckoutComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);

  readonly cart = signal<Cart | null>(null);
  readonly state = signal<CheckoutState>('loading');
  readonly loadError = signal<string | null>(null);
  readonly confirming = signal(false);
  readonly order = signal<OrderDetail | null>(null);
  readonly conflictMessage = signal<string | null>(null);
  readonly conflictErrors = signal<string[]>([]);
  readonly confirmError = signal<string | null>(null);

  readonly items = computed(() => this.cart()?.items ?? []);
  readonly itemCount = computed(() => this.items().reduce((acc, item) => acc + item.quantity, 0));

  ngOnInit(): void {
    this.loadCart();
  }

  retryLoad(): void {
    this.loadCart();
  }

  confirmPurchase(): void {
    if (this.confirming() || this.state() !== 'ready') return;

    this.confirming.set(true);
    this.confirmError.set(null);
    this.conflictMessage.set(null);
    this.conflictErrors.set([]);

    this.ordersService.createOrder().subscribe({
      next: (createdOrder) => {
        this.confirming.set(false);
        this.order.set(createdOrder);
        this.cart.set(null);
        this.state.set('success');
      },
      error: (error: HttpErrorResponse) => {
        this.confirming.set(false);
        if (error.status === 409) {
          this.conflictMessage.set(this.backendMessage(error) ?? 'No se pudo completar la compra.');
          this.conflictErrors.set(this.backendErrors(error));
          this.refreshCart();
        } else if (error.status === 400) {
          this.redirectToProducts(
            this.backendMessage(error) ?? 'Tu carrito está vacío. Agrega productos antes de pagar.',
          );
        } else {
          this.confirmError.set(
            this.backendMessage(error) ?? 'No se pudo confirmar la compra. Inténtalo de nuevo.',
          );
        }
      },
    });
  }

  retryAfterConflict(): void {
    this.conflictMessage.set(null);
    this.conflictErrors.set([]);
    this.loadCart();
  }

  private loadCart(): void {
    this.state.set('loading');
    this.loadError.set(null);

    this.cartService.getCart().subscribe({
      next: (cart) => {
        if (cart.items.length === 0) {
          this.redirectToProducts('Tu carrito está vacío. Agrega productos antes de pagar.');
          return;
        }
        this.cart.set(cart);
        this.state.set('ready');
      },
      error: () => {
        this.loadError.set('No se pudo cargar el resumen de tu compra. Inténtalo de nuevo.');
      },
    });
  }

  private refreshCart(): void {
    this.cartService.getCart().subscribe({
      next: (cart) => this.cart.set(cart),
      error: () => undefined,
    });
  }

  private redirectToProducts(notice: string): void {
    this.router.navigate(['/products'], { queryParams: { notice } });
  }

  private backendMessage(error: HttpErrorResponse): string | null {
    const message = error.error?.message;
    return typeof message === 'string' && message.trim().length > 0 ? message : null;
  }

  private backendErrors(error: HttpErrorResponse): string[] {
    const errors = error.error?.errors;
    if (!Array.isArray(errors)) return [];
    return errors.filter((entry): entry is string => typeof entry === 'string');
  }
}
