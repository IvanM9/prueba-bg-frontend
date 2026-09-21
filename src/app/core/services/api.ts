import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  post<T>(url: string, body: any) {
    return this.http.post<T>(this.baseUrl + url, body, { withCredentials: true });
  }

  get<T>(url: string) {
    return this.http.get<T>(this.baseUrl + url, { withCredentials: true });
  }

  put<T>(url: string, body: any) {
    return this.http.put<T>(this.baseUrl + url, body, { withCredentials: true });
  }

  delete<T>(url: string) {
    return this.http.delete<T>(this.baseUrl + url, { withCredentials: true });
  }

}