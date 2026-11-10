import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CarritoService } from "../../core/services/carrito.service";
import { AuthService } from "../../core/services/auth.service";
import { PedidoService } from "../../core/services/pedido.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-carrito",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="carrito-container">
      <div class="carrito-header">
        <div>
          <h1 class="font-geist">Tu Carrito y Proceso de Compra</h1>
          <p class="font-mono" style="font-size:12px;color:var(--text-secondary)">
            PROTEGIDO POR EL PROTOCOLO CAMIFUT ESCROW (CUSTODIA 100% SEGURA)
          </p>
        </div>
        @if (authService.isLoggedIn()) {
          <div class="user-tag font-mono">
            <span class="material-symbols-outlined" style="font-size:14px;color:var(--circuit-cyan)">verified_user</span>
            <span>{{ authService.nombreCompleto() }}</span>
          </div>
        }
      </div>

      <!-- ESTADO: NO AUTENTICADO -->
      @if (!authService.isLoggedIn()) {
        <div class="empty-card panel-card">
          <span class="material-symbols-outlined" style="font-size:48px;color:var(--text-muted)">lock</span>
          <p class="font-inter" style="margin-top:12px">Debes iniciar sesión para gestionar tu carrito y comprar con garantía.</p>
          <button (click)="authService.abrirModal('login')" class="btn-primary font-geist" style="margin-top:16px;padding:10px 24px">
            Iniciar Sesión
          </button>
        </div>
      }

      <!-- ESTADO: CARGANDO -->
      @else if (carritoService.cargando()) {
        <div class="cart-layout">
          <div class="cart-items">
            @for (i of [1,2]; track i) {
              <div class="cart-item panel-card shimmer" style="height:110px"></div>
            }
          </div>
          <div class="cart-summary panel-card shimmer" style="height:320px"></div>
        </div>
      }

      <!-- ESTADO: CARRITO VACÍO (SIN PEDIDO RECIENTE) -->
      @else if (carritoService.items().length === 0 && !pedidoCompletado()) {
        <div class="empty-card panel-card">
          <span class="material-symbols-outlined" style="font-size:48px;color:var(--text-muted)">shopping_bag</span>
          <h3 class="font-geist" style="font-size:18px;margin:12px 0 4px">Tu carrito está vacío</h3>
          <p class="font-inter" style="color:var(--text-muted);font-size:13px">Explora nuestro archivo de camisetas auténticas y agrega tus piezas favoritas.</p>
          <a routerLink="/catalogo" class="btn-primary font-geist" style="display:inline-block;margin-top:16px;padding:10px 24px">
            Explorar Catálogo
          </a>
        </div>
      }

      <!-- ESTADO: PEDIDO COMPLETADO CON ÉXITO -->
      @else if (pedidoCompletado()) {
        <div class="pedido-exito-card panel-card">
          <div class="exito-icon-box">
            <span class="material-symbols-outlined" style="font-size:44px;color:var(--pitch-green)">verified</span>
          </div>
          <h2 class="font-geist" style="font-size:24px;margin:12px 0 6px">¡Compra Realizada con Éxito!</h2>
          <div class="font-mono" style="font-size:14px;color:var(--pitch-green);font-weight:700">
            NÚMERO DE ORDEN: {{ pedidoCompletado().numero_pedido }}
          </div>
          <p class="font-inter text-secondary" style="font-size:13px;max-width:540px;margin:10px auto 20px;line-height:1.6">
            Tu pago está bajo custodia del <strong>Protocolo Escrow de CamiFut</strong>. El vendedor ha sido notificado para despachar tu camiseta. El dinero solo se liberará cuando confirmes la recepción conforme.
          </p>
          <div class="exito-actions">
            <a routerLink="/pedidos" class="btn-primary font-geist" style="padding:12px 26px">
              <span class="material-symbols-outlined">local_shipping</span>
              Seguimiento en Vivo del Pedido
            </a>
            <a routerLink="/catalogo" class="btn-secondary font-geist" style="padding:12px 20px">
              Volver al Catálogo
            </a>
          </div>
        </div>
      }

      <!-- ESTADO: CARRITO CON ITEMS Y PASARELA DE CHECKOUT -->
      @else {
        <div class="cart-layout">
          <!-- LISTA DE PRENDAS -->
          <div class="cart-items">
            <h2 class="font-geist" style="font-size:16px;margin:0 0 12px">Prendas en tu Orden ({{ carritoService.totalItems() }})</h2>
            @for (item of carritoService.items(); track item.item_id) {
              <div class="cart-item">
                <div class="item-img">
                  <span class="material-symbols-outlined" style="font-size:30px;color:var(--pitch-green)">checkroom</span>
                </div>
                <div class="item-info">
                  <h3 class="font-geist item-title">{{ item.publicacion_titulo }}</h3>
                  <div class="item-meta font-mono">
                    <span class="meta-badge">TALLA: {{ item.talla }}</span>
                    <span class="meta-badge">CANTIDAD: {{ item.cantidad }}</span>
                    <span class="text-muted">TIENDA: {{ item.nombre_tienda || 'Oficial' }}</span>
                  </div>
                  <button (click)="eliminarItem(item.item_id)" class="btn-remove font-mono">
                    <span class="material-symbols-outlined" style="font-size:14px">delete</span> Eliminar
                  </button>
                </div>
                <div class="item-price">
                  <span class="font-geist price-value">{{ item.subtotal_item | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              </div>
            }

            <!-- OPCIONES DE ENTREGA LOGÍSTICA (PASO 1) -->
            <div class="panel-card delivery-options-panel">
              <div class="section-title-row">
                <span class="material-symbols-outlined" style="color:var(--pitch-green)">local_shipping</span>
                <h3 class="font-geist" style="font-size:15px;margin:0">Selecciona el Método de Entrega</h3>
              </div>

              <div class="delivery-methods-grid font-inter">
                <label class="delivery-radio-card" [class.selected]="metodoEntrega === 'envio_transportadora'">
                  <input type="radio" name="metodo" value="envio_transportadora" [(ngModel)]="metodoEntrega" />
                  <div class="radio-content">
                    <div class="radio-header">
                      <strong>Envío Nacional Asegurado</strong>
                      <span class="tag-free font-mono">ESTÁNDAR</span>
                    </div>
                    <small>Despacho con transportadora certificada y número de guía rastreable en tiempo real.</small>
                  </div>
                </label>

                <label class="delivery-radio-card" [class.selected]="metodoEntrega === 'entrega_en_persona'">
                  <input type="radio" name="metodo" value="entrega_en_persona" [(ngModel)]="metodoEntrega" />
                  <div class="radio-content">
                    <div class="radio-header">
                      <strong>Entrega Presencial Segura (Pop-Up)</strong>
                      <span class="tag-otp font-mono">CÓDIGO OTP</span>
                    </div>
                    <small>Punto acordado o estación. Se valida la prenda físicamente y se autoriza con código de 6 dígitos.</small>
                  </div>
                </label>
              </div>

              <div class="delivery-fields-grid" style="margin-top:16px">
                <div class="form-group" style="margin-bottom:0">
                  <label class="font-mono form-label">CIUDAD DE DESTINO *</label>
                  <input type="text" [(ngModel)]="ciudadEnvio" class="form-input" placeholder="Ej: Medellín, Bogotá, Cali..." />
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label class="font-mono form-label">
                    {{ metodoEntrega === 'envio_transportadora' ? 'DIRECCIÓN O BARRIO *' : 'ZONA / PUNTO DE ENCUENTRO *' }}
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="direccionEnvio"
                    class="form-input"
                    [placeholder]="metodoEntrega === 'envio_transportadora' ? 'Ej: Cra 43A # 1-50 Apto 402' : 'Ej: Estación Metro Poblado / CC Mayorca'"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- RESUMEN DEL PEDIDO & ACCIÓN DE PAGO (PASO 2) -->
          <div class="cart-summary panel-card">
            <h3 class="font-geist" style="margin-bottom:14px;font-size:16px">Resumen del Pedido</h3>
            <div class="summary-row">
              <span class="font-inter text-secondary">Subtotal ({{ carritoService.totalItems() }} prendas)</span>
              <span class="font-geist">{{ carritoService.subtotalEstimado() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
            </div>
            <div class="summary-row">
              <span class="font-inter text-secondary">Costo de Entrega</span>
              <span class="font-mono" style="color:var(--pitch-green);font-size:11px">INCLUIDO / CUSTODIA</span>
            </div>
            <div class="summary-row">
              <span class="font-inter text-secondary">Garantía Escrow</span>
              <span class="font-mono" style="color:var(--circuit-cyan);font-size:11px">ACTIVA (0% RIESGO)</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row summary-total">
              <span class="font-mono">TOTAL FINAL</span>
              <span class="font-geist total-price">{{ carritoService.subtotalEstimado() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
            </div>

            @if (errorCheckout) {
              <div class="mensaje-error font-mono">{{ errorCheckout }}</div>
            }

            <button
              class="btn-checkout font-geist"
              [disabled]="procesando || !ciudadEnvio.trim() || !direccionEnvio.trim()"
              (click)="confirmarCheckout()">
              @if (procesando) {
                <span class="spinner-sm"></span>
              } @else {
                <span class="material-symbols-outlined">lock</span>
              }
              {{ procesando ? 'PROCESANDO TRANSACCIÓN...' : 'CONFIRMAR Y PAGAR (ESCROW)' }}
            </button>

            @if (!ciudadEnvio.trim() || !direccionEnvio.trim()) {
              <span class="font-mono text-muted" style="font-size:10px;text-align:center">
                * Por favor completa la ciudad y dirección de entrega para habilitar el pago.
              </span>
            }

            <a routerLink="/catalogo" class="btn-seguir font-geist">
              <span class="material-symbols-outlined">arrow_back</span> Seguir Explorando
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .carrito-container{max-width:1140px;margin:40px auto;padding:0 24px;min-height:60vh}
    .carrito-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;flex-wrap:wrap;gap:12px}
    h1{margin:0;font-size:28px}
    .user-tag{background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.3);color:var(--circuit-cyan);padding:6px 12px;border-radius:var(--radius-xs);display:flex;align-items:center;gap:6px;font-size:11px}
    .empty-card{padding:54px 32px;text-align:center;background:var(--bg-surface-1);border:1px solid var(--border-default);border-radius:var(--radius-sm)}
    .cart-layout{display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start}
    @media(max-width:860px){.cart-layout{grid-template-columns:1fr}}
    .cart-items{display:flex;flex-direction:column;gap:14px}
    .cart-item{display:grid;grid-template-columns:56px 1fr auto;gap:16px;align-items:center;padding:16px 18px;background:var(--bg-surface-2);border:1px solid var(--border-subtle);border-radius:var(--radius-sm)}
    .item-img{width:56px;height:56px;background:var(--bg-surface-1);border-radius:var(--radius-xs);display:flex;align-items:center;justify-content:center}
    .item-title{font-size:14px;font-weight:700;margin:0 0 6px 0}
    .item-meta{display:flex;gap:8px;font-size:10px;margin-bottom:6px;flex-wrap:wrap;align-items:center}
    .meta-badge{background:var(--bg-surface-3);border:1px solid var(--border-subtle);padding:2px 6px;border-radius:3px}
    .btn-remove{background:none;border:none;color:#f43f5e;font-size:10px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:0}
    .btn-remove:hover{text-decoration:underline}
    .item-price{text-align:right}
    .price-value{font-size:16px;font-weight:700;color:var(--pitch-green)}

    /* OPCIONES DE ENTREGA */
    .delivery-options-panel{padding:20px;margin-top:10px}
    .section-title-row{display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border-subtle)}
    .delivery-methods-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:600px){.delivery-methods-grid{grid-template-columns:1fr}}
    .delivery-radio-card{display:flex;align-items:flex-start;gap:10px;padding:12px;background:var(--bg-surface-2);border:1px solid var(--border-subtle);border-radius:var(--radius-xs);cursor:pointer;transition:all .2s}
    .delivery-radio-card:hover{border-color:var(--border-highlight)}
    .delivery-radio-card.selected{border-color:var(--pitch-green);background:rgba(16,185,129,.05)}
    .delivery-radio-card input{accent-color:var(--pitch-green);margin-top:3px}
    .radio-content{display:flex;flex-direction:column;gap:3px}
    .radio-header{display:flex;justify-content:space-between;align-items:center;font-size:12px;gap:6px}
    .tag-free{font-size:9px;background:rgba(16,185,129,.15);color:var(--pitch-green);padding:2px 5px;border-radius:2px}
    .tag-otp{font-size:9px;background:rgba(6,182,212,.15);color:var(--circuit-cyan);padding:2px 5px;border-radius:2px}
    .radio-content small{font-size:11px;color:var(--text-muted);line-height:1.35}
    .delivery-fields-grid{display:grid;grid-template-columns:1fr 1.5fr;gap:12px}
    @media(max-width:600px){.delivery-fields-grid{grid-template-columns:1fr}}

    /* RESUMEN LATERAL */
    .cart-summary{padding:22px;display:flex;flex-direction:column;gap:12px}
    .summary-row{display:flex;justify-content:space-between;align-items:center;font-size:13px}
    .summary-divider{border:none;border-top:1px solid var(--border-default);margin:4px 0}
    .summary-total{padding-top:6px}
    .total-price{font-size:22px;font-weight:800;color:var(--pitch-green)}
    .btn-checkout{width:100%;padding:14px;background:var(--pitch-green);color:#000;border:none;border-radius:var(--radius-xs);font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;transition:opacity .2s}
    .btn-checkout:disabled{opacity:.5;cursor:not-allowed}
    .btn-checkout:not(:disabled):hover{opacity:.9}
    .btn-seguir{display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;color:var(--text-secondary);font-size:12px;margin-top:8px;transition:color .2s}
    .btn-seguir:hover{color:var(--pitch-green)}
    .mensaje-error{background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.3);color:#f43f5e;padding:10px;border-radius:var(--radius-xs);font-size:11px;text-align:center}
    .spinner-sm{width:16px;height:16px;border:2px solid rgba(0,0,0,.3);border-top-color:#000;border-radius:50%;animation:spin .8s linear infinite;display:inline-block}

    /* ÉXITO DE COMPRA */
    .pedido-exito-card{padding:54px 32px;text-align:center;max-width:680px;margin:20px auto}
    .exito-icon-box{width:72px;height:72px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto}
    .exito-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:16px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.02) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.02) 100%);background-size:200% 100%;animation:shimmer 1.5s infinite}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  `]
})
export class CarritoComponent {
  public carritoService = inject(CarritoService);
  public authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public metodoEntrega: "envio_transportadora" | "entrega_en_persona" = "envio_transportadora";
  public ciudadEnvio: string = "Medellín";
  public direccionEnvio: string = "Envío estándar nacional";
  public procesando: boolean = false;
  public errorCheckout: string = "";
  public pedidoCompletado = signal<any | null>(null);

  public eliminarItem(id: string): void {
    this.carritoService.eliminarItem(id).subscribe();
  }

  public confirmarCheckout(): void {
    if (!this.authService.isLoggedIn()) {
      this.authService.abrirModal("login");
      return;
    }

    if (!this.ciudadEnvio.trim() || !this.direccionEnvio.trim()) {
      this.errorCheckout = "Por favor indica la ciudad y dirección o punto de entrega.";
      return;
    }

    this.procesando = true;
    this.errorCheckout = "";

    const datosEnvio = {
      metodo_entrega: this.metodoEntrega,
      ciudad: this.ciudadEnvio.trim(),
      direccion: this.direccionEnvio.trim(),
    };

    this.pedidoService.checkout(datosEnvio).subscribe({
      next: (resp: any) => {
        this.procesando = false;
        if (resp.success && resp.pedido) {
          this.pedidoCompletado.set(resp.pedido);
          this.toastService.success(`¡Pedido ${resp.pedido.numero_pedido} generado con éxito bajo custodia Escrow!`);
          this.carritoService.items.set([]);
          this.carritoService.totalItems.set(0);
          this.carritoService.subtotalEstimado.set(0);
        } else {
          this.errorCheckout = resp.message || "Error al procesar el pedido.";
          this.toastService.error(this.errorCheckout);
        }
      },
      error: (err: any) => {
        this.procesando = false;
        this.errorCheckout = err?.error?.message || "Error al conectar con la pasarela de pedidos.";
        this.toastService.error(this.errorCheckout);
      }
    });
  }
}
