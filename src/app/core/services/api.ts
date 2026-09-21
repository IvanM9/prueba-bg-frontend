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
    return this.http.post<T>(url, body);
  }

  get<T>(url: string) {
    return this.http.get<T>(url);
  }

  put<T>(url: string, body: any) {
    return this.http.put<T>(url, body);
  }

  delete<T>(url: string) {
    return this.http.delete<T>(url);
  }

}