import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PublicacionService } from '../../core/services/publicacion.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-publicar-camiseta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './publicar-camiseta.component.html',
  styleUrls: ['./publicar-camiseta.component.css']
})
export class PublicarCamisetaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private publicacionService = inject(PublicacionService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  public form!: FormGroup;
  public guardando: boolean = false;
  public cargandoEdicion: boolean = false;
  public esEdicion: boolean = false;
  public publicacionId: string | null = null;
  public varianteId: string | null = null;
  public errorMensaje: string = '';
  public exitoMensaje: string = '';

  // Control de Imagen (URL vs Archivo Local + Preview)
  public modoImagen: 'url' | 'archivo' = 'url';
  public previewUrl: string = 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=900&q=80';
  public nombreArchivoLocal: string = '';
  public errorCargaImagen: boolean = false;

  ngOnInit(): void {
    this.initForm();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.esEdicion = true;
      this.publicacionId = idParam;
      this.cargarPublicacionParaEditar(idParam);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Datos de la Camiseta / Equipo
      equipo_nombre: ['', [Validators.required, Validators.minLength(2)]],
      pais: ['Internacional', Validators.required],
      marca: ['Adidas', Validators.required],
      anio_temporada: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
      tipo_indumentaria: ['local', Validators.required],

      // Detalles de la publicación
      titulo: ['', [Validators.required, Validators.minLength(4)]],
      descripcion: ['', [Validators.required, Validators.minLength(8)]],
      tipo_edicion: ['jugador_version_profesional', Validators.required],
      autenticidad: ['original_oficial', Validators.required],
      estado_prenda: ['nueva_con_etiqueta', Validators.required],
      imagen_url: [this.previewUrl],
      genero: ['hombre'],
      cantidad_usos: [0],
      detalles_defectos: [''],
      estado: ['activa'],

      // Variante inicial (Talla, Precio, Stock)
      talla: ['M', Validators.required],
      precio: [280000, [Validators.required, Validators.min(1000)]],
      stock: [1, [Validators.required, Validators.min(1)]],
      nombre_estampado: [''],
      numero_estampado: [null],

      // Opciones de entrega
      permite_envio_transportadora: [true],
      permite_entrega_en_persona: [true],
      ciudad_entrega_persona: ['Medellín'],
      zona_entrega_persona: ['Estación Poblado / CC Mayorca']
    });

    this.form.get('imagen_url')?.valueChanges.subscribe(val => {
      if (this.modoImagen === 'url') {
        this.previewUrl = val || '';
        this.errorCargaImagen = false;
      }
    });
  }

  private cargarPublicacionParaEditar(id: string): void {
    this.cargandoEdicion = true;
    this.publicacionService.getPublicacionPorId(id).subscribe({
      next: (res: any) => {
        this.cargandoEdicion = false;
        const p = res.data || res;
        if (!p) return;

        const primeraVar = p.variantes && p.variantes.length > 0 ? p.variantes[0] : null;
        if (primeraVar) {
          this.varianteId = primeraVar.id;
        }

        const imagenCargada = p.imagen_portada || (p.imagenes && p.imagenes[0]?.imagen_url) || p.imagen_url || this.previewUrl;
        this.previewUrl = imagenCargada;

        const normTipo = p.tipo_indumentaria === 'portero' ? 'arquero' : (p.tipo_indumentaria || 'local');
        const normEdicion = p.tipo_edicion === 'hincha_replica' ? 'aficionado_estadio' : (p.tipo_edicion || 'jugador_version_profesional');
        let normEstado = p.estado_prenda || 'nueva_con_etiqueta';
        if (normEstado === 'como_nueva') normEstado = 'usada_como_nueva';
        if (normEstado === 'buen_estado') normEstado = 'usada_buen_estado';
        if (normEstado === 'uso_visible') normEstado = 'usada_estado_aceptable';
        const normTalla = (primeraVar?.talla || 'M').toUpperCase() === 'XXL' ? '2XL' : (primeraVar?.talla || 'M');

        this.form.patchValue({
          equipo_nombre: p.equipo_nombre || '',
          pais: p.equipo_pais || p.pais || 'Internacional',
          marca: p.marca_nombre || p.marca || 'Adidas',
          anio_temporada: p.anio_inicio_temporada || p.anio_temporada || 2024,
          tipo_indumentaria: normTipo,
          titulo: p.titulo || '',
          descripcion: p.descripcion || '',
          tipo_edicion: normEdicion,
          autenticidad: p.autenticidad === 'copia_no_oficial' ? 'replica_no_oficial' : (p.autenticidad || 'original_oficial'),
          estado_prenda: normEstado,
          imagen_url: imagenCargada,
          genero: p.genero || 'hombre',
          cantidad_usos: p.cantidad_usos || 0,
          detalles_defectos: p.detalles_defectos || '',
          estado: p.estado || 'activa',
          talla: normTalla,
          precio: primeraVar?.precio || 280000,
          stock: primeraVar?.stock || 1,
          nombre_estampado: primeraVar?.nombre_estampado || '',
          numero_estampado: primeraVar?.numero_estampado || null,
          permite_envio_transportadora: p.permite_envio_transportadora !== false,
          permite_entrega_en_persona: !!p.permite_entrega_en_persona,
          ciudad_entrega_persona: p.ciudad_entrega_persona || 'Medellín',
          zona_entrega_persona: p.zona_entrega_persona || ''
        });
      },
      error: () => {
        this.cargandoEdicion = false;
        this.toastService.error('No se pudo cargar la camiseta para editar.');
      }
    });
  }

  public setModoImagen(modo: 'url' | 'archivo'): void {
    this.modoImagen = modo;
    this.errorCargaImagen = false;
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.errorMensaje = 'Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).';
        return;
      }
      this.nombreArchivoLocal = file.name;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const base64 = e.target?.result as string;
        this.previewUrl = base64;
        this.errorCargaImagen = false;
        this.form.patchValue({ imagen_url: base64 });
      };
      reader.readAsDataURL(file);
    }
  }

  public onImageError(): void {
    this.errorCargaImagen = true;
  }

  public onImageLoad(): void {
    this.errorCargaImagen = false;
  }

  public sugerirTitulo(): void {
    const eq = this.form.get('equipo_nombre')?.value || '';
    const anio = this.form.get('anio_temporada')?.value || '';
    const tipo = this.form.get('tipo_indumentaria')?.value || 'local';
    const marca = this.form.get('marca')?.value || '';
    const tipoStr = tipo === 'local' ? 'Local' : tipo === 'visitante' ? 'Visitante' : tipo === 'tercera' ? 'Tercera Equipación' : 'Especial';
    if (eq && anio) {
      this.form.patchValue({
        titulo: `Camiseta ${eq} ${anio} ${tipoStr} - ${marca}`.trim()
      });
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMensaje = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    this.guardando = true;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    const raw = this.form.value;

    const publicacionDTO: any = {
      equipo_nombre: raw.equipo_nombre.trim(),
      pais: raw.pais.trim(),
      marca: raw.marca.trim(),
      anio_temporada: Number(raw.anio_temporada),
      tipo_indumentaria: raw.tipo_indumentaria,
      modelo_nombre: `${raw.equipo_nombre.trim()} ${raw.anio_temporada} ${raw.tipo_indumentaria}`,
      titulo: raw.titulo.trim(),
      descripcion: raw.descripcion.trim(),
      tipo_edicion: raw.tipo_edicion,
      autenticidad: raw.autenticidad,
      estado_prenda: raw.estado_prenda,
      genero: raw.genero || 'hombre',
      cantidad_usos: Number(raw.cantidad_usos) || 0,
      detalles_defectos: raw.detalles_defectos || null,
      permite_envio_transportadora: raw.permite_envio_transportadora !== false,
      permite_entrega_en_persona: raw.permite_entrega_en_persona || false,
      ciudad_entrega_persona: raw.permite_entrega_en_persona ? (raw.ciudad_entrega_persona || null) : null,
      zona_entrega_persona: raw.permite_entrega_en_persona ? (raw.zona_entrega_persona || null) : null,
      imagen_url: raw.imagen_url || this.previewUrl || null,
      imagen_portada: raw.imagen_url || this.previewUrl || null,
      estado: raw.estado || 'activa',
      // Datos de variante
      talla: raw.talla,
      precio: Number(raw.precio),
      stock: Number(raw.stock),
      nombre_estampado: raw.nombre_estampado || null,
      numero_estampado: raw.numero_estampado ? Number(raw.numero_estampado) : null
    };

    if (this.esEdicion && this.publicacionId) {
      // Modo Edición Integral
      this.publicacionService.actualizarPublicacion(this.publicacionId, publicacionDTO).subscribe({
        next: () => {
          this.guardando = false;
          this.exitoMensaje = '¡Camiseta actualizada exitosamente con todos sus detalles!';
          this.toastService.success('¡Publicación y detalles de camiseta actualizados exitosamente!');
          setTimeout(() => {
            this.router.navigate(['/vendedor']);
          }, 1000);
        },
        error: (err: any) => {
          this.guardando = false;
          this.errorMensaje = err?.error?.message || 'Error al actualizar la publicación.';
          this.toastService.error(this.errorMensaje);
        }
      });
    } else {
      // Modo Creacin
      this.publicacionService.crearPublicacion(publicacionDTO).subscribe({
        next: (resp: any) => {
          const pubId = resp?.data?.id || resp?.publicacion?.id;
          if (pubId) {
            const varianteDTO = {
              publicacion_id: pubId,
              sku: `SKU-${raw.talla}-${Date.now().toString().slice(-4)}`,
              talla: raw.talla,
              precio: Number(raw.precio),
              stock: Number(raw.stock),
              nombre_estampado: raw.nombre_estampado || null,
              numero_estampado: raw.numero_estampado ? Number(raw.numero_estampado) : null
            };
            this.publicacionService.agregarVariante(varianteDTO).subscribe({
              next: () => {
                this.guardando = false;
                this.toastService.success('¡Camiseta publicada exitosamente!');
                this.router.navigate(['/camiseta', pubId]);
              },
              error: () => {
                this.guardando = false;
                this.router.navigate(['/camiseta', pubId]);
              }
            });
          } else {
            this.guardando = false;
            this.router.navigate(['/catalogo']);
          }
        },
        error: (err: any) => {
          this.guardando = false;
          this.errorMensaje = err?.error?.message || 'Error al guardar la publicación.';
          this.toastService.error(this.errorMensaje);
        }
      });
    }
  }
}
