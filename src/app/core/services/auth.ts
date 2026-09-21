import { inject, Injectable } from '@angular/core';
import { Api } from './api';
import { LoginRequest, LoginResponse } from '../models/login';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private api = inject(Api);

  login(request: LoginRequest) {
    return this.api.post<LoginResponse>('/login', request).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
      },
      error: (err) => {
        alert('Login incorrecto: ' + err.message);
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

}
