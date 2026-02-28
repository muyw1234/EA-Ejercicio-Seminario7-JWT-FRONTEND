import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organizacion } from '../models/organizacion.model';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // =========================
  // ORGANIZACIONES
  // =========================

  getOrganizaciones(): Observable<{ organizaciones: Organizacion[] }> {
    return this.http.get<{ organizaciones: Organizacion[] }>(
      `${this.baseUrl}/organizaciones/get`
    );
  }

  createOrganizacion(name: string) {
    return this.http.post(
      `${this.baseUrl}/organizaciones/create`,
      { name }
    );
  }

  updateOrganizacion(id: string, name: string) {
    return this.http.patch(
      `${this.baseUrl}/organizaciones/update/${id}`,
      { name }
    );
  }

  // =========================
  // USUARIOS
  // =========================

  getUsuarios(): Observable<{ usuario: Usuario[] }> {
    return this.http.get<{ usuario: Usuario[] }>(
      `${this.baseUrl}/usuarios/get`
    );
  }

  createUsuario(name: string, organizacion: string) {
    return this.http.post(
      `${this.baseUrl}/usuarios/create`,
      { name, organizacion }
    );
  }
}