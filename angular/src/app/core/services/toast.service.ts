import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  public toasts = signal<Toast[]>([]);

  public show(message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 3500): void {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    const toast: Toast = { id, message, type, icon };

    this.toasts.update(current => [...current, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  public success(message: string): void {
    this.show(message, 'success');
  }

  public error(message: string): void {
    this.show(message, 'error', 4500);
  }

  public info(message: string): void {
    this.show(message, 'info');
  }

  public remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
