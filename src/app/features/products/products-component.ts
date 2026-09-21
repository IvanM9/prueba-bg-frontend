import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Products } from '../../core/services/products';
import { CartService } from '../../core/services/cart';
import { Product } from '../../core/models/product';

interface Feedback {
  type: 'success' | 'error' | 'info';
  text: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const LOW_STOCK_THRESHOLD = 3;

@Component({
  selector: 'app-products-component',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './products-component.html',
  styleUrl: './products-component.css',
})
export class ProductsComponent implements OnInit {
  private readonly productsService = inject(Products);
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly selectedCategory = signal('');

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly addingProductId = signal<number | null>(null);
  readonly feedback = signal<Feedback | null>(null);

  private readonly quantities = signal<Record<number, number>>({});
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly categories = computed(() => {
    const seen = new Set<string>();
    for (const product of this.products()) {
      if (product.category) seen.add(product.category);
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  });

  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    if (!category) return this.products();
    return this.products().filter((product) => product.category === category);
  });

  ngOnInit(): void {
    const notice = this.route.snapshot.queryParamMap.get('notice');
    if (notice?.trim()) {
      this.showFeedback({ type: 'info', text: notice });
    }
    this.loadProducts(this.searchControl.value);

    const searchSub = this.searchControl.valueChanges
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged())
      .subscribe((term) => this.loadProducts(term));

    this.destroyRef.onDestroy(() => {
      searchSub.unsubscribe();
      if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    });
  }

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCategory.set(select.value);
  }

  quantityFor(product: Product): number {
    return this.quantities()[product.id] ?? 1;
  }

  onQuantityInput(product: Product, event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = Math.floor(Number(input.value));
    const clamped = Number.isNaN(parsed)
      ? 1
      : Math.min(Math.max(parsed, 1), Math.max(product.stock, 1));
    this.quantities.update((current) => ({ ...current, [product.id]: clamped }));
    if (String(clamped) !== input.value) input.value = String(clamped);
  }

  isOutOfStock(product: Product): boolean {
    return product.stock <= 0;
  }

  isLowStock(product: Product): boolean {
    return product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  }

  addToCart(product: Product): void {
    if (this.isOutOfStock(product) || this.addingProductId() !== null) return;

    const quantity = this.quantityFor(product);
    this.addingProductId.set(product.id);
    this.feedback.set(null);

    this.cartService.addItem(product.id, quantity).subscribe({
      next: () => {
        this.addingProductId.set(null);
        this.quantities.update((current) => ({ ...current, [product.id]: 1 }));
        this.showFeedback({
          type: 'success',
          text: `${product.name} (x${quantity}) agregado al carrito.`,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.addingProductId.set(null);
        this.showFeedback({ type: 'error', text: this.resolveErrorMessage(error) });
      },
    });
  }

  retry(): void {
    this.loadProducts(this.searchControl.value);
  }

  private loadProducts(term: string): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.productsService.getProducts(term).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
        this.loadError.set('No se pudieron cargar los productos. Inténtalo de nuevo.');
      },
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const backendMessage =
      typeof error.error?.message === 'string' && error.error.message.trim().length > 0
        ? error.error.message
        : null;
    if (backendMessage) return backendMessage;
    if (error.status === 404) return 'Producto no encontrado.';
    return 'No se pudo agregar el producto al carrito. Inténtalo de nuevo.';
  }

  private showFeedback(message: Feedback): void {
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedback.set(message);
    this.feedbackTimer = setTimeout(() => this.feedback.set(null), 5000);
  }
}
