import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit {
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  public tab: 'login' | 'registro' = 'login';
  public loginForm!: FormGroup;
  public registroForm!: FormGroup;
  public cargando = false;
  public errorMensaje = '';
  public exitoMensaje = '';

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.registroForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['+573001234567'],
      es_vendedor: [false],
      nombre_tienda: ['']
    });
  }

  public cerrarAlFondo(event: MouseEvent): void {
    this.authService.cerrarModal();
  }

  public toggleVendedor(event: any): void {
    const tiendaCtrl = this.registroForm.get('nombre_tienda');
    if (event.target.checked) {
      tiendaCtrl?.setValidators([Validators.required, Validators.minLength(3)]);
    } else {
      tiendaCtrl?.clearValidators();
    }
    tiendaCtrl?.updateValueAndValidity();
  }

  public submitLogin(): void {
    if (this.loginForm.invalid) return;

    this.cargando = true;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (resp) => {
        this.cargando = false;
        const rol = resp.data?.roles.rol_principal.toUpperCase() || 'USUARIO';
        this.exitoMensaje = `¡Bienvenido! Sesión iniciada con perfil: ${rol}`;
        setTimeout(() => {
          this.authService.cerrarModal();
          this.loginForm.reset();
        }, 1000);
      },
      error: (msg) => {
        this.cargando = false;
        this.errorMensaje = msg || 'Credenciales inválidas o correo no registrado.';
      }
    });
  }

  public submitRegistro(): void {
    if (this.registroForm.invalid) return;

    this.cargando = true;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    const raw = this.registroForm.value;
    const dto = {
      nombres: raw.nombres,
      apellidos: raw.apellidos,
      email: raw.email,
      password: raw.password,
      telefono: raw.telefono,
      nombre_tienda: raw.es_vendedor ? raw.nombre_tienda : undefined
    };

    this.authService.registro(dto).subscribe({
      next: () => {
        this.cargando = false;
        this.exitoMensaje = '¡Cuenta registrada con éxito! Iniciando sesión...';
        // Iniciar sesión automáticamente
        this.authService.login({ email: dto.email, password: dto.password }).subscribe({
          next: () => {
            setTimeout(() => {
              this.authService.cerrarModal();
              this.registroForm.reset();
            }, 1000);
          }
        });
      },
      error: (msg) => {
        this.cargando = false;
        this.errorMensaje = msg || 'Error al crear la cuenta.';
      }
    });
  }
}