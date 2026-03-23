import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario.model';
import { Organizacion } from '../models/organizacion.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-list.html',
  styleUrls: ['./usuario-list.css'],
})
export class UsuarioList implements OnInit {
  usuarios: Usuario[] = [];
  organizaciones: Organizacion[] = [];
  usuariosFiltrados: Usuario[] = [];
  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  mostrarForm = false;
  usuarioForm!: FormGroup;
  editando = false;
  usuarioEditId: string | null = null;
  expanded: { [key: string]: boolean } = {};
  limite = 10;
  mostrarTodosUsuarios = false;
  rol: string = 'guest'; 
  isLoggedIn = false;
  loginForm: FormGroup;
  loginError: string = '';

  constructor(private api: UsuarioService, private fb: FormBuilder, private cdr: ChangeDetectorRef, private dialog: MatDialog, private auth: AuthService) {
    this.usuarioForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      organizacion: ['', Validators.required],
      rol: ['user', Validators.required]
    });
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.searchControl = new FormControl('');

    

  }

  // Función para validar que las contraseñas son idénticas
  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    // Solo validamos si ambos campos tienen algo escrito
    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  //Función: leer
  ngOnInit(): void {
    this.auth.currentRole$.subscribe(roleActual => {
    this.rol = roleActual as 'admin' | 'user';
    this.isLoggedIn = (roleActual !== 'guest'); 
    this.cdr.detectChanges();
  });

    this.load();
    this.loadOrganizaciones();
    
    this.searchControl.valueChanges.subscribe(value => {
      const term = value?.toLowerCase() ?? '';
  
      this.usuariosFiltrados = this.usuarios.filter(org =>
        org.name.toLowerCase().includes(term)
      );
    });
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.api.getUsuarios().subscribe({
      next: (res) => {
        this.usuarios = res;
        this.usuariosFiltrados = [...this.usuarios];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se han podido cargar los usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }


  onLogin(): void {
    const { email, password } = this.loginForm.value;
    
    this.auth.iniciarSesionBackend(email, password).subscribe({
      next: (res: any) => {
        // Guardamos token y rol
        this.auth.login(res.accessToken);
        this.loginError = '';
        this.loginForm.reset();
      },
      error: (err) => {
        this.loginError = 'Email o contraseña incorrectos';
        console.error(err);
      }
    });
  }

  onLogout(): void {
    this.auth.logout();
  }
  //Función: trackBy para optimizar el ngFor
  trackById(_index: number, u: Usuario): string {
    return u._id;
  }

  //Función: obtener nombre de organización para mostrar en la tabla
  organizacionLabel(u: Usuario): string {
    const org = u.organizacion;
    if (!org) return '-';
    if (typeof org === 'string') return org; 
    return (org as Organizacion).name ?? '-';
  }

  //Función: mostrar formulario
   mostrarFormulario(): void {
  this.mostrarForm = true;
}

//Función: cargar organizaciones para el select del formulario
loadOrganizaciones(): void {
  this.api.getOrganizaciones().subscribe({
    next: (res) => {
      this.organizaciones = res;
      console.log('Organizaciones:', this.organizaciones);
    },
    error: (err) => console.error(err)
  });
}

//Función: mostrar más
  mostrarMas(): void {
  this.mostrarTodosUsuarios = true;
  } 

  get usuariosVisibles(): Usuario[] {
    if (this.mostrarTodosUsuarios) {
      return this.usuariosFiltrados;
    }
    return this.usuariosFiltrados.slice(0, this.limite);
  }
  
  //Función: guardar (tanto para crear como para actualizar)
guardar(): void {
  
  if (this.usuarioForm.invalid) return;

  const { name, email, password, organizacion, rol } = this.usuarioForm.value;

  if (this.editando && this.usuarioEditId) {
    // UPDATE: pasamos id, name, email, password, organizacion
    this.api.updateUsuario(this.usuarioEditId, name, email, password, organizacion, rol)
      .subscribe({
        next: () => {
          this.resetForm();
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se ha podido actualizar el usuario.';
        }
      });

  } else {

    // CREATE: pasamos name, email, password, organizacion, rol
    this.api.createUsuario(name, email, password, organizacion, rol)
      .subscribe({
        next: () => {
          this.resetForm();
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se ha podido crear el usuario.';
        }
      });
  }
}

//Función: expandir fila para mostrar detalles
toggleExpand(id: string): void {
  this.expanded[id] = !this.expanded[id];
}

//Función: confirmar eliminación de usuario
  confirmDelete(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete(id);
      }
    });
  }

  //Función: editar usuario (muestra el formulario con los datos cargados)
editar(user: Usuario): void {
  this.mostrarForm = true;
  this.editando = true;
  this.usuarioEditId = user._id;

  this.usuarioForm.patchValue({
    name: user.name,
    rol: user.rol,
    organizacion: typeof user.organizacion === 'string'
      ? user.organizacion
      : (user.organizacion as Organizacion)?._id
  });
}
//Función: resetear formulario
resetForm(): void {
  this.mostrarForm = false;
  this.editando = false;
  this.usuarioEditId = null;
  this.usuarioForm.reset();
}

//Función: eliminar usuario
  delete(id: string): void {
    this.errorMsg = '';
    this.loading = true;

    this.api.deleteUsuario(id).subscribe({
      next: () => {
        this.load();
      },
      error: () => {
        this.errorMsg = 'Error delete';
        this.loading = false;
      }
    });
  }
}
