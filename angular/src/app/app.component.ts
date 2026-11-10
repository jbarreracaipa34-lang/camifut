import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AuthModalComponent } from './shared/components/auth-modal/auth-modal.component';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, AuthModalComponent],
  template: `
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-auth-modal></app-auth-modal>

    <!-- TOAST NOTIFICATIONS CONTAINER -->
    <div class="toast-container font-inter">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast-card font-mono" [attr.data-type]="t.type">
          <span class="material-symbols-outlined toast-icon">{{ t.icon }}</span>
          <span class="toast-message">{{ t.message }}</span>
          <button type="button" class="toast-close" (click)="toastService.remove(t.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 420px;
    }
    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: var(--radius-sm);
      background: rgba(18, 18, 18, 0.95);
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      font-size: 12px;
      border: 1px solid var(--border-default);
      color: #fff;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.2s ease;
    }
    .toast-card[data-type="success"] {
      border-color: var(--pitch-green);
      background: rgba(16, 185, 129, 0.12);
      color: var(--pitch-green);
    }
    .toast-card[data-type="error"] {
      border-color: var(--signal-red);
      background: rgba(239, 68, 68, 0.12);
      color: var(--signal-red);
    }
    .toast-card[data-type="info"] {
      border-color: var(--circuit-cyan);
      background: rgba(6, 182, 212, 0.12);
      color: var(--circuit-cyan);
    }
    .toast-icon {
      font-size: 18px;
      flex-shrink: 0;
    }
    .toast-message {
      flex: 1;
      line-height: 1.4;
    }
    .toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.7;
      font-size: 12px;
      padding: 2px 4px;
    }
    .toast-close:hover {
      opacity: 1;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class AppComponent {
  public toastService = inject(ToastService);
}
