import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { OrdersComponent } from './features/orders/orders-component';
import { LoginComponent } from './features/login/login-component';
import { ProductsComponent } from './features/products/products-component';
import { CartComponent } from './features/cart/cart-component';
import { CheckoutComponent } from './features/checkout/checkout-component';
import { OrderDetailComponent } from './features/order-detail/order-detail-component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [authGuard] },
  { path: 'orders/:id', component: OrderDetailComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: '**', redirectTo: '/products' },
];
