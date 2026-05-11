import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AccountService } from './account.service';

@Component({
  selector: 'app-account-delete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="account-page">
      <h1>Minha conta</h1>

      <section class="danger-zone">
        <h2>Excluir minha conta</h2>
        <p class="warning">
          Esta ação é <strong>irreversível</strong>. Todos os seus alertas,
          consentimentos e seu usuário no provedor de autenticação serão
          apagados permanentemente, conforme a LGPD.
        </p>

        <label>
          Digite <strong>EXCLUIR</strong> para confirmar:
          <input
            type="text"
            [(ngModel)]="typed"
            [disabled]="loading()"
            autocomplete="off"
          />
        </label>

        <div class="error" *ngIf="error()">{{ error() }}</div>

        <div class="actions">
          <button type="button" (click)="cancel()" [disabled]="loading()">
            Voltar
          </button>
          <button
            type="button"
            class="danger"
            [disabled]="typed !== 'EXCLUIR' || loading()"
            (click)="confirm()"
          >
            {{ loading() ? 'Excluindo…' : 'Excluir permanentemente' }}
          </button>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .account-page {
        max-width: 640px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
      .danger-zone {
        border: 1px solid #f3c1c1;
        background: #fff7f7;
        border-radius: 10px;
        padding: 1.25rem;
      }
      .danger-zone h2 {
        margin-top: 0;
        color: #b00020;
      }
      .warning {
        color: #5a1f1f;
      }
      label {
        display: block;
        margin: 1rem 0;
      }
      input[type='text'] {
        display: block;
        width: 100%;
        padding: 0.5rem;
        font-size: 1rem;
        margin-top: 0.25rem;
        border: 1px solid #d0d0d0;
        border-radius: 6px;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      button {
        padding: 0.55rem 1rem;
        border-radius: 6px;
        border: 1px solid #d0d0d0;
        background: #fff;
        cursor: pointer;
        font-size: 0.95rem;
      }
      button.danger {
        background: #b00020;
        border-color: #b00020;
        color: #fff;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        color: #b00020;
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class AccountDeleteComponent {
  private readonly account = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  typed = '';
  loading = signal(false);
  error = signal<string | null>(null);

  cancel(): void {
    this.router.navigate(['/alerts']);
  }

  async confirm(): Promise<void> {
    if (this.typed !== 'EXCLUIR' || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.account.deleteAccount());
      this.auth.logout();
    } catch (e) {
      this.error.set('Não foi possível excluir a conta agora. Tente novamente.');
      this.loading.set(false);
    }
  }
}
