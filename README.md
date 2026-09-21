# Tienda — Frontend (bg_frontend)

SPA de la prueba técnica Full Stack: login, catálogo con búsqueda, carrito,
checkout e historial de órdenes. Consume la API de `bg_backend`.

Stack: **Angular 21 (standalone components, signals)** · **Tailwind CSS 4** · **RxJS** · **Vitest**.

## Requisitos

- Node.js 24 (`node --version`)
- Angular CLI 21 (`npm i -g @angular/cli@21` o usar `npx ng`)
- El **backend corriendo**

## Cómo ejecutar

```bash
npm install
ng serve
# o: npm start
```

App en **`http://localhost:4200`**. Recarga automática al editar `src/`.

> Hay `pnpm-lock.yaml` en el repo; con `npm install` funciona igual. Si usas pnpm,
> ejecuta `pnpm install && pnpm start`.

### Backend objetivo (importante)

El frontend apunta al backend según `src/environments/`:

| Archivo | `apiUrl` por defecto | Uso |
|---|---|---|
| `environment.ts` | `http://localhost:5000/api` | build/servidor por defecto |
| `environment.development.ts` | `http://localhost:5017/api` | `ng serve`|
| `environment.production.ts` | `http://localhost:5000/api` | build de producción |

Si arrancas la API en otro puerto, sobrescribe la URL en el build:

```bash
API_URL="http://localhost:5000/api" npm run build:prod
```

Sin backend levantado verás errores de red en login/productos: es esperado.

## Credenciales semilla

| Email | Password | Rol |
|---|---|---|
| `cliente@tienda.com` | `Cliente123!` | Customer |
| `admin@tienda.com` | `Admin123!` | Admin |

## Flujo de prueba sugerido

1. **Login**: entra con `cliente@tienda.com / Cliente123!` → redirige a `/products`.
   Con password mala verás "Credenciales inválidas" (401 real del backend).
2. **Buscar**: escribe `mouse` (debounce 300 ms) → filtra; prueba el select de
   categoría (p. ej. `Libros`) y el estado vacío.
3. **Agregar**: en una tarjeta, ajusta cantidad (máx = stock) → "Agregar".
   `ELEC-003` muestra **Agotado** y no deja agregar; pide más unidades que el stock
   para ver el `409` del backend ("Stock insuficiente. Disponible: N").
4. **Carrito** (`/cart`): cambia cantidades (cada `PUT` devuelve el carrito
   recalculado), elimina items, observa el panel Subtotal / Descuento
   ("10% por compra mayor a $100", solo si > 0) / Total. Prueba "Vaciar carrito"
   (pide confirmación) y el estado vacío.
5. **Checkout** (`/checkout`): revisa el resumen de solo lectura → "Confirmar compra".
   Éxito (`201`): verás número de orden, fecha, items y total + link a `/orders`.
   Con carrito vacío te devuelve a productos con aviso (caso `400`).
6. **Historial** (`/orders` → `/orders/:id`): tabla con fecha, #items, subtotal,
   descuento y total; entra al detalle (snapshots de nombre/precio) y prueba un id
   inexistente (`/orders/9999` → "Orden no encontrada").
7. Recarga el navegador en cualquier ruta protegida: la sesión persiste mientras la
   cookie siga válida; el header muestra tu email y el botón Salir cierra sesión.

## Decisiones

- **Standalone components + `app.routes.ts`**: sin `NgModules`; rutas
  `/login` (pública) y `/products`, `/cart`, `/checkout`, `/orders`, `/orders/:id`
  protegidas con `authGuard`, `**` → `/products`.
- **Autenticación por cookie HttpOnly (diverge de la guía a propósito)**:
  la guía proponía `localStorage` + header `Bearer` manual. Lo implementado es más
  seguro: el backend fija `access_token` HttpOnly en el login, el `Api` service envía
  `withCredentials: true` en toda petición y el `authInterceptor` funcional solo
  garantiza credenciales + redirige a `/login` ante `401`. El JS nunca toca el token
  (mitiga robo por XSS). Estado de sesión con `signal currentUser` + `GET /auth/me`.
- **Totales siempre del backend**: ningún componente calcula subtotal/descuento/total;
  se renderiza el `CartDto`/`OrderDetailDto` tal cual. El `PUT` del carrito ya devuelve
  el carrito recalculado: se reemplaza el `signal`, no se parchea.
- **Errores de negocio locales, inesperados globales**: `400/404/409` se muestran en
  contexto (tarjeta, carrito, checkout con lista `errors`); `401` va al login por el
  interceptor; `500`/red se surfacean como banner reintentable.
- **Búsqueda con `debounceTime(300)` + `distinctUntilChanged` + `switchMap`-like**
  (se cancela la búsqueda anterior): evita resultados viejos sobrescribiendo nuevos.
  Categorías derivadas del listado cargado (sin endpoint extra).
- **SSR habilitado por defecto** (`app.config.server.ts`, `server.ts`): el `ng serve`
  de desarrollo funciona normal; `npm run serve:ssr:bg_frontend` sirve el build SSR.


```bash
ng serve    # desarrollo → http://localhost:4200
ng build    # build prod → dist/
ng test     # unit tests (Vitest)
```

