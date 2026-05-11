import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from './alert.service';

@Component({
  selector: 'app-alert-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2>Novo alerta</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <label>
        URL do produto
        <input
          type="url"
          formControlName="productUrl"
          placeholder="https://www.mercadolivre.com.br/.../p/MLB...">
      </label>
      <label>
        Nome (opcional)
        <input type="text" formControlName="productName">
      </label>
      <label>
        Preço alvo (R$)
        <input
          type="text"
          inputmode="numeric"
          autocomplete="off"
          [value]="priceMasked()"
          (input)="onPriceInput($event)"
          placeholder="R$ 0,00">
      </label>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="actions">
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="form.invalid || submitting()">
          {{ submitting() ? 'Salvando...' : 'Criar' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    h2 { margin-bottom: 1rem; }
    .form { display: flex; flex-direction: column; gap: 1rem; max-width: 500px; }
    label { display: flex; flex-direction: column; gap: 0.25rem; font-weight: 500; }
    input { padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    .actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    button { padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer; }
    button.primary { background: #1976d2; color: white; border-color: #1976d2; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .error { color: #b00020; margin: 0; }
  `],
})
export class AlertCreate {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AlertService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly priceMasked = signal('');

  readonly form = this.fb.nonNullable.group({
    productUrl: ['', [Validators.required, Validators.pattern(/^https:\/\/.+/)]],
    productName: [''],
    targetPrice: [0, [Validators.required, Validators.min(0.01)]],
  });

  onPriceInput(ev: Event): void {
    const raw = (ev.target as HTMLInputElement).value;
    const digits = raw.replace(/\D/g, '');
    const cents = digits === '' ? 0 : parseInt(digits, 10);
    const value = cents / 100;
    this.form.controls.targetPrice.setValue(value);
    this.priceMasked.set(this.formatBRL(value));
  }

  private formatBRL(v: number): string {
    if (!v) return '';
    return v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);
    const payload = this.form.getRawValue();
    this.service.create({
      productUrl: payload.productUrl,
      productName: payload.productName || undefined,
      targetPrice: payload.targetPrice,
    }).subscribe({
      next: () => this.router.navigate(['/alerts']),
      error: err => {
        this.submitting.set(false);
        this.error.set(err?.error?.message || 'Falha ao criar alerta');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/alerts']);
  }
}
