import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="ft">
      <div class="ft-inner">
        <div class="ft-top">
          <div>
            <div class="ft-brand"><span class="material-symbols-outlined" style="color:var(--pitch-green)">sports_soccer</span><span class="font-geist" style="font-size:20px;font-weight:800">CamiFut</span></div>
            <p class="font-inter" style="color:var(--text-secondary);font-size:13px;line-height:1.6;max-width:360px;margin-top:10px">Marketplace especializado en camisetas de fútbol originales, réplicas de colección y archivos vintage. Transacciones seguras con custodia y verificación.</p>
          </div>
          <div>
            <h4 class="ft-col-title font-geist">Explorar</h4>
            <ul class="ft-list font-inter">
              <li><a routerLink="/catalogo">Todas las Camisetas</a></li>
              <li><a routerLink="/catalogo">Archivo Vintage 90s</a></li>
              <li><a routerLink="/catalogo">Era Galácticos 2000s</a></li>
            </ul>
          </div>
          <div>
            <h4 class="ft-col-title font-geist">Vendedores</h4>
            <ul class="ft-list font-inter">
              <li><a routerLink="/publicar">Publicar Camiseta</a></li>
              <li><a routerLink="/catalogo">Guía de Autenticación</a></li>
              <li><a routerLink="/catalogo">Puntos de Entrega</a></li>
            </ul>
          </div>
          <div>
            <h4 class="ft-col-title font-geist">Compradores</h4>
            <ul class="ft-list font-inter">
              <li><a routerLink="/catalogo">Explorar Catálogo</a></li>
              <li><a routerLink="/pedidos">Mis Pedidos</a></li>
              <li><a routerLink="/carrito">Mi Carrito</a></li>
            </ul>
          </div>
        </div>
        <div class="ft-bottom font-inter">© 2026 CamiFut. Todos los derechos reservados.</div>
      </div>
    </footer>
  `,
  styles: [`
    .ft { background:var(--bg-canvas); border-top:1px solid var(--border-default); margin-top:80px; padding:48px 0 28px; }
    .ft-inner { max-width:1440px; margin:0 auto; padding:0 24px; }
    .ft-top { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px; margin-bottom:40px; }
    @media(max-width:900px){.ft-top{grid-template-columns:1fr 1fr}}
    @media(max-width:560px){.ft-top{grid-template-columns:1fr}}
    .ft-brand { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .ft-col-title { font-size:12px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:.06em; margin-bottom:14px; }
    .ft-list { list-style:none; display:flex; flex-direction:column; gap:9px; }
    .ft-list a { color:var(--text-secondary); text-decoration:none; font-size:13px; transition:color .2s; }
    .ft-list a:hover { color:var(--pitch-green); }
    .ft-bottom { border-top:1px solid var(--border-subtle); padding-top:20px; text-align:center; color:var(--text-muted); font-size:12px; }
  `]
})
export class FooterComponent {}