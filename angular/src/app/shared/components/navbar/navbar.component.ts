import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  public carritoService = inject(CarritoService);
  public authService = inject(AuthService);
  private router = inject(Router);

  public menuUsuarioAbierto = signal<boolean>(false);
  public menuMobileAbierto = signal<boolean>(false);

  @HostListener('document:click')
  onDocumentClick() {
    this.menuUsuarioAbierto.set(false);
  }

  public toggleMenuUsuario(event: Event): void {
    event.stopPropagation();
    this.menuUsuarioAbierto.update(v => !v);
  }

  public cerrarMenuUsuario(): void {
    this.menuUsuarioAbierto.set(false);
  }

  public toggleMenuMobile(): void {
    this.menuMobileAbierto.update(v => !v);
  }

  public cerrarMenuMobile(): void {
    this.menuMobileAbierto.set(false);
  }

  public abrirLogin(tab: 'login' | 'registro' = 'login'): void {
    this.cerrarMenuUsuario();
    this.cerrarMenuMobile();
    this.authService.abrirModal(tab);
  }

  public logout(): void {
    this.cerrarMenuUsuario();
    this.cerrarMenuMobile();
    this.authService.logout();
    this.carritoService.cargarCarrito();
    this.router.navigate(['/catalogo']);
  }

  public filtrarPor(tipo: string): void {
    this.cerrarMenuMobile();
    this.router.navigate(['/catalogo'], { queryParams: { tipo } });
  }
}
