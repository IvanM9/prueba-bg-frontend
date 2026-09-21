import { inject, Injectable, signal } from '@angular/core';
import { Api } from './api';
import { LoginRequest, LoginResponse, MeResponse } from '../models/login';
import { catchError, map, Observable, of, tap } from 'rxjs';

export interface SessionUser {
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private api = inject(Api);

  readonly currentUser = signal<SessionUser | null>(null);

  login(request: LoginRequest): Observable<LoginResponse> {
 
    return this.api
      .post<LoginResponse>('/auth/login', request)
      .pipe(
        tap((response) =>
          this.currentUser.set({ email: response.email, role: response.role }),
        ),
      );
  }

  logout(): Observable<void> {
    return this.api.post<void>('/auth/logout', {}).pipe(
      tap(() => this.currentUser.set(null)),
      catchError(() => {
        this.currentUser.set(null);
        return of(undefined);
      }),
    );
  }

  me(): Observable<SessionUser | null> {
    if (this.currentUser()) {
      return of(this.currentUser());
    }
    return this.api.get<MeResponse>('/auth/me').pipe(
      map((response) => {
        const user: SessionUser = { email: response.email, role: response.role };
        this.currentUser.set(user);
        return user;
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }
}
