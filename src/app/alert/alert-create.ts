import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from './alert.service';
import { ALERT_TYPE_LABEL, AlertType } from './alert.model';
import {
  PRODUCT_NAME_MAX_LEN,
  PRODUCT_URL_MAX_LEN,
  parseProductUrl,
  productUrlValidator,
  sanitizePlainText,
} from '../shared/sanitize';

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
          [maxlength]="productUrlMaxLen"
          autocomplete="off"
          spellcheck="false"
          placeholder="https://www.mercadolivre.com.br/... ou https://shopee.com.br/...">
        <small class="hint">
          Marketplaces suportados: <strong>Mercado Livre</strong> e <strong>Shopee</strong>.
          Cole o link da página do produto (ex.: <code>mercadolivre.com.br/.../p/MLB...</code>
          ou <code>shopee.com.br/...-i.&lt;loja&gt;.&lt;item&gt;</code>).
        </small>
        @if (form.controls.productUrl.touched && form.controls.productUrl.errors?.['productUrl']) {
          <small class="error">URL inválida. Use https:// de Mercado Livre ou Shopee.</small>
        }
      </label>
      <label>
        Nome (opcional)
        <input
          type="text"
          formControlName="productName"
          [maxlength]="productNameMaxLen"
          autocomplete="off">
      </label>

      <label>
        Tipo de alerta
        <select formControlName="alertType">
          @for (t of types; track t.value) {
            <option [value]="t.value">{{ t.label }}</option>
          }
        </select>
        <small class="hint">{{ typeHint() }}</small>
      </label>

      @if (alertType() === 'PRICE_BELOW_TARGET') {
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
      }

      @if (alertType() === 'PERCENT_DISCOUNT') {
        <label>
          % de desconto vs média 30d
          <input type="number" min="1" max="99" step="1" formControlName="discountPercent" placeholder="ex: 20">
        </label>
      }

      @if (alertType() === 'PRICE_DROP') {
        <label>
          % de queda
          <input type="number" min="1" max="99" step="1" formControlName="dropPercent" placeholder="ex: 15">
        </label>
        <label>
          Janela (dias)
          <input type="number" min="1" max="365" step="1" formControlName="dropWindowDays" placeholder="ex: 7">
        </label>
      }

      @if (alertType() === 'BACK_IN_STOCK') {
        <p class="hint">Sem parâmetros: dispara assim que o produto voltar a ficar disponível.</p>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="actions">
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="!canSubmit() || submitting()">
          {{ submitting() ? 'Salvando...' : 'Criar' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    h2 { margin-bottom: 1rem; }
    .form { display: flex; flex-direction: column; gap: 1rem; max-width: 500px; }
    label { display: flex; flex-direction: column; gap: 0.25rem; font-weight: 500; }
    input, select { padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    .hint { font-weight: 400; font-size: 0.85em; color: #666; }
    .hint code { background: #f3f3f3; padding: 0 0.25rem; border-radius: 3px; font-size: 0.95em; }
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

  readonly types: { value: AlertType; label: string }[] = (
    ['PRICE_BELOW_TARGET', 'PERCENT_DISCOUNT', 'PRICE_DROP', 'BACK_IN_STOCK'] as AlertType[]
  ).map(v => ({ value: v, label: ALERT_TYPE_LABEL[v] }));

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly priceMasked = signal('');

  readonly productUrlMaxLen = PRODUCT_URL_MAX_LEN;
  readonly productNameMaxLen = PRODUCT_NAME_MAX_LEN;

  readonly form = this.fb.nonNullable.group({
    productUrl: ['', [Validators.required, productUrlValidator()]],
    productName: ['', [Validators.maxLength(PRODUCT_NAME_MAX_LEN)]],
    alertType: ['PRICE_BELOW_TARGET' as AlertType, [Validators.required]],
    targetPrice: [0],
    discountPercent: [20],
    dropPercent: [15],
    dropWindowDays: [7],
  });

  readonly alertType = signal<AlertType>('PRICE_BELOW_TARGET');
  /** Bump signal para forçar reavaliação de `canSubmit` quando o form muda. */
  private readonly formTick = signal(0);

  constructor() {
    this.form.controls.alertType.valueChanges.subscribe(v => this.alertType.set(v));
    // FormGroup.valueChanges/statusChanges não são signals; precisamos
    // notificar manualmente o `computed` abaixo a cada alteração.
    this.form.valueChanges.subscribe(() => this.formTick.update(n => n + 1));
    this.form.statusChanges.subscribe(() => this.formTick.update(n => n + 1));
  }

  readonly canSubmit = computed(() => {
    this.formTick(); // dependência para reavaliar quando o form muda
    if (this.form.controls.productUrl.invalid) return false;
    switch (this.alertType()) {
      case 'PRICE_BELOW_TARGET':
        return (this.form.controls.targetPrice.value ?? 0) >= 0.01;
      case 'PERCENT_DISCOUNT': {
        const v = this.form.controls.discountPercent.value;
        return v != null && v >= 1 && v <= 99;
      }
      case 'PRICE_DROP': {
        const p = this.form.controls.dropPercent.value;
        const d = this.form.controls.dropWindowDays.value;
        return p != null && p >= 1 && p <= 99 && d != null && d >= 1 && d <= 365;
      }
      case 'BACK_IN_STOCK':
        return true;
    }
  });

  typeHint(): string {
    switch (this.alertType()) {
      case 'PRICE_BELOW_TARGET':
        return 'Dispara quando o preço atual ≤ alvo.';
      case 'PERCENT_DISCOUNT':
        return 'Dispara quando o preço atual está pelo menos X% abaixo da média dos últimos 30 dias.';
      case 'PRICE_DROP':
        return 'Dispara quando o preço cair X% comparado ao preço de N dias atrás.';
      case 'BACK_IN_STOCK':
        return 'Dispara quando o produto sai de "indisponível" para "disponível".';
    }
  }

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
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const type = v.alertType;
    const parsedUrl = parseProductUrl(v.productUrl);
    if (!parsedUrl) {
      this.submitting.set(false);
      this.error.set('URL inválida. Use https:// de Mercado Livre ou Shopee.');
      return;
    }
    const payload = {
      productUrl: parsedUrl.href,
      productName: sanitizePlainText(v.productName, PRODUCT_NAME_MAX_LEN),
      alertType: type,
      targetPrice: type === 'PRICE_BELOW_TARGET' ? v.targetPrice : null,
      discountPercent: type === 'PERCENT_DISCOUNT' ? v.discountPercent : null,
      dropPercent: type === 'PRICE_DROP' ? v.dropPercent : null,
      dropWindowDays: type === 'PRICE_DROP' ? v.dropWindowDays : null,
    };
    this.service.create(payload).subscribe({
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
