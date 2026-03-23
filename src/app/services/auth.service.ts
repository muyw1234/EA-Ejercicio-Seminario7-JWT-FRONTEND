import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userRole = new BehaviorSubject<string>('guest'); 
  currentRole$ = this.userRole.asObservable();
  constructor(private http: HttpClient) {}
  
  login(rol: string) {
    localStorage.setItem('rol', rol);
    this.userRole.next(rol);
  }

  logout() {
    localStorage.removeItem('rol');
    this.userRole.next('guest');
  }

  iniciarSesionBackend(email: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/login`, { email, password });
    }

  getRole() {
    return this.userRole.value;
  }
}