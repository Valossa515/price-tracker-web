import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PendingConsent } from './consent.model';
import { ConsentService } from './consent.service';

@Component({
  selector: 'app-consent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="consent-overlay">
      <div class="consent-card">
        <h2>Antes de continuar</h2>
        <p>
          Para usar o Little Price Tracker você precisa concordar com os
          documentos abaixo. Eles descrevem como tratamos seus dados conforme a
          LGPD.
        </p>

        <div class="loading" *ngIf="loading()">Carregando…</div>

        <ul class="docs" *ngIf="!loading() && pending().length > 0">
          <li *ngFor="let doc of pending(); let i = index">
            <a [href]="doc.url" target="_blank" rel="noopener noreferrer">
              {{ doc.title }} <span class="version">({{ doc.version }})</span>
            </a>
            <label>
              <input
                type="checkbox"
                [(ngModel)]="accepted[i]"
                [disabled]="submitting()"
              />
              Li e aceito o documento acima
            </label>
          </li>
        </ul>

        <div class="error" *ngIf="error()">{{ error() }}</div>

        <div class="actions">
          <button
            type="button"
            class="primary"
            [disabled]="!allAccepted() || submitting()"
            (click)="confirm()"
          >
            {{ submitting() ? 'Salvando…' : 'Continuar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .consent-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 9999;
      }
      .consent-card {
        background: #fff;
        max-width: 520px;
        width: 100%;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
      }
      h2 {
        margin-top: 0;
      }
      .docs {
        list-style: none;
        padding: 0;
        margin: 1rem 0;
      }
      .docs li {
        border: 1px solid #e3e3e3;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
      }
      .docs a {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #0a66c2;
      }
      .docs .version {
        color: #666;
        font-weight: 400;
        font-size: 0.85em;
      }
      .docs label {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.95em;
        cursor: pointer;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 1rem;
      }
      .primary {
        background: #0a66c2;
        color: #fff;
        border: none;
        padding: 0.6rem 1.25rem;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
      }
      .primary:disabled {
        background: #b0b0b0;
        cursor: not-allowed;
      }
      .error {
        color: #b00020;
        margin-top: 0.5rem;
        font-size: 0.9em;
      }
      .loading {
        text-align: center;
        padding: 1rem;
        color: #666;
      }
    `,
  ],
})
export class ConsentComponent implements OnInit {
  private readonly consents = inject(ConsentService);
  private readonly router = inject(Router);

  pending = signal<PendingConsent[]>([]);
  accepted: boolean[] = [];
  loading = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const docs = await this.consents.getRequired();
      this.pending.set(docs);
      this.accepted = docs.map(() => false);
      if (docs.length === 0) {
        this.router.navigate(['/alerts']);
        return;
      }
    } catch (e) {
      this.error.set('Não foi possível carregar os documentos.');
    } finally {
      this.loading.set(false);
    }
  }

  allAccepted(): boolean {
    return (
      this.pending().length > 0 &&
      this.accepted.length === this.pending().length &&
      this.accepted.every((v) => v)
    );
  }

  async confirm(): Promise<void> {
    if (!this.allAccepted() || this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    try {
      for (const doc of this.pending()) {
        await firstValueFrom(
          this.consents.accept({
            documentType: doc.documentType,
            version: doc.version,
          }),
        );
      }
      this.router.navigate(['/alerts']);
    } catch (e) {
      this.error.set('Falha ao registrar o aceite. Tente novamente.');
      this.submitting.set(false);
    }
  }
}
