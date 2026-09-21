import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart';
import { Cart } from '../../core/models/cart';
import { CartItem } from '../../core/models/cart-item';

interface Feedback {
  type: 'success' | 'error';
  text: string;
}

@Component({
  selector: 'app-cart-component',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart-component.html',
  styleUrl: './cart-component.css',
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cart = signal<Cart | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly feedback = signal<Feedback | null>(null);
  readonly confirmingClear = signal(false);
  readonly clearing = signal(false);

  private readonly busyIds = signal<ReadonlySet<number>>(new Set());
  private readonly drafts = signal<Record<number, number>>({});
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly items = computed(() => this.cart()?.items ?? []);
  readonly isEmpty = computed(() => !this.loading() && this.items().length === 0);
  readonly itemCount = computed(() => this.items().reduce((acc, item) => acc + item.quantity, 0));

  ngOnInit(): void {
    this.loadCart();

    this.destroyRef.onDestroy(() => {
      if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    });
  }

  private loadCart(options: { silent?: boolean } = {}): void {
    if (!options.silent) {
      this.loading.set(true);
      this.loadError.set(null);
    }

    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.loading.set(false);
        this.loadError.set(null);
        this.drafts.update((current) => {
          const ids = new Set(cart.items.map((item) => item.productId));
          return Object.fromEntries(Object.entries(current).filter(([key]) => ids.has(Number(key))));
        });
      },
      error: () => {
        this.loading.set(false);
        if (!options.silent) {
          this.loadError.set('No se pudo cargar el carrito. Inténtalo de nuevo.');
        } else {
          this.showFeedback({ type: 'error', text: 'No se pudo actualizar el carrito. Inténtalo de nuevo.' });
        }
      },
    });
  }

  isBusy(productId: number): boolean {
    return this.busyIds().has(productId);
  }

  displayQuantity(item: CartItem): number {
    return this.drafts()[item.productId] ?? item.quantity;
  }

  increment(item: CartItem): void {
    this.changeQuantity(item, item.quantity + 1);
  }

  decrement(item: CartItem): void {
    if (item.quantity <= 1) return;
    this.changeQuantity(item, item.quantity - 1);
  }

  onDraftInput(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = Math.floor(Number(input.value));
    const draft = Number.isNaN(parsed) ? 1 : Math.max(parsed, 1);
    this.drafts.update((current) => ({ ...current, [item.productId]: draft }));
  }

  commitDraft(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const draft = this.drafts()[item.productId];
    const quantity = draft ?? item.quantity;

    if (quantity === item.quantity) {
      this.drafts.update((current) => {
        const { [item.productId]: _removed, ...rest } = current;
        return rest;
      });
      input.value = String(item.quantity);
      return;
    }

    this.changeQuantity(item, quantity);
  }

  changeQuantity(item: CartItem, quantity: number): void {
    if (this.isBusy(item.productId)) return;

    const normalized = Math.floor(quantity);
    if (!Number.isFinite(normalized) || normalized < 1) return;
    if (normalized === item.quantity) return;

    this.setBusy(item.productId, true);
    this.feedback.set(null);

    this.cartService.updateItem(item.productId, normalized).subscribe({
      next: (updatedCart) => {
        this.cart.set(updatedCart);
        this.clearDraft(item.productId);
        this.setBusy(item.productId, false);
      },
      error: (error: HttpErrorResponse) => {
        this.setBusy(item.productId, false);
        this.clearDraft(item.productId);
        if (error.status === 409) {
          this.showFeedback({ type: 'error', text: this.resolveConflictMessage(error) });
          this.loadCart({ silent: true });
        } else if (error.status === 404) {
          this.showFeedback({ type: 'error', text: 'Ese producto ya no está en el carrito.' });
          this.loadCart({ silent: true });
        } else {
          this.showFeedback({
            type: 'error',
            text: this.backendMessage(error) ?? 'No se pudo actualizar la cantidad. Inténtalo de nuevo.',
          });
          this.loadCart({ silent: true });
        }
      },
    });
  }

  removeItem(item: CartItem): void {
    if (this.isBusy(item.productId)) return;

    this.setBusy(item.productId, true);
    this.feedback.set(null);

    this.cartService.removeItem(item.productId).subscribe({
      next: () => {
        this.setBusy(item.productId, false);
        this.showFeedback({ type: 'success', text: `${item.productName} eliminado del carrito.` });
        this.loadCart({ silent: true });
      },
      error: (error: HttpErrorResponse) => {
        this.setBusy(item.productId, false);
        if (error.status === 404) {
          this.loadCart({ silent: true });
          this.showFeedback({ type: 'error', text: 'Ese producto ya no está en el carrito.' });
        } else {
          this.showFeedback({
            type: 'error',
            text: this.backendMessage(error) ?? 'No se pudo eliminar el producto. Inténtalo de nuevo.',
          });
        }
      },
    });
  }

  requestClear(): void {
    this.confirmingClear.set(true);
  }

  cancelClear(): void {
    this.confirmingClear.set(false);
  }

  confirmClear(): void {
    if (this.clearing()) return;

    this.clearing.set(true);
    this.confirmingClear.set(false);
    this.feedback.set(null);

    this.cartService.clearCart().subscribe({
      next: () => {
        this.clearing.set(false);
        this.drafts.set({});
        this.showFeedback({ type: 'success', text: 'Carrito vaciado.' });
        this.loadCart({ silent: true });
      },
      error: (error: HttpErrorResponse) => {
        this.clearing.set(false);
        this.showFeedback({
          type: 'error',
          text: this.backendMessage(error) ?? 'No se pudo vaciar el carrito. Inténtalo de nuevo.',
        });
      },
    });
  }

  retry(): void {
    this.loadCart();
  }

  private setBusy(productId: number, busy: boolean): void {
    this.busyIds.update((current) => {
      const next = new Set(current);
      if (busy) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }

  private clearDraft(productId: number): void {
    this.drafts.update((current) => {
      if (!(productId in current)) return current;
      const { [productId]: _removed, ...rest } = current;
      return rest;
    });
  }

  private backendMessage(error: HttpErrorResponse): string | null {
    const message = error.error?.message;
    return typeof message === 'string' && message.trim().length > 0 ? message : null;
  }

  private resolveConflictMessage(error: HttpErrorResponse): string {
    return this.backendMessage(error) ?? 'Stock insuficiente para esa cantidad.';
  }

  private showFeedback(message: Feedback): void {
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedback.set(message);
    this.feedbackTimer = setTimeout(() => this.feedback.set(null), 5000);
  }
}
