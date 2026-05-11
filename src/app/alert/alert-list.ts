import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlertService } from './alert.service';
import { Alert } from './alert.model';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="header">
      <h2>Meus alertas</h2>
      <div class="actions">
        <button (click)="checkNow()" [disabled]="checking()">
          {{ checking() ? 'Verificando...' : 'Verificar agora' }}
        </button>
        <a routerLink="/alerts/new" class="btn-primary">+ Novo alerta</a>
        <a routerLink="/account/delete" class="btn-link-danger" title="Excluir minha conta">Excluir conta</a>
      </div>
    </div>

    @if (loading()) {
      <p>Carregando...</p>
    } @else if (alerts().length === 0) {
      <p class="empty">Nenhum alerta cadastrado.</p>
    } @else {
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Alvo</th>
            <th>Preço atual</th>
            <th>Status</th>
            <th>Última verificação</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (a of alerts(); track a.id) {
            <tr>
              <td>
                <a [href]="a.productUrl" target="_blank" rel="noopener noreferrer">
                  {{ a.productName || '(sem nome)' }}
                </a>
              </td>
              <td>{{ a.targetPrice | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                {{ a.lastObservedPrice
                    ? (a.lastObservedPrice | currency:'BRL':'symbol':'1.2-2')
                    : '—' }}
              </td>
              <td><span [class]="'status status-' + a.status.toLowerCase()">{{ a.status }}</span></td>
              <td>{{ a.lastCheckedAt ? (a.lastCheckedAt | date:'short') : '—' }}</td>
              <td><button class="btn-danger" (click)="remove(a.id)">excluir</button></td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .actions { display: flex; gap: 0.5rem; align-items: center; }
    .empty { color: #666; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; border-bottom: 1px solid #e0e0e0; text-align: left; }
    th { font-weight: 600; color: #555; }
    .status { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85em; font-weight: 600; }
    .status-active { background: #e3f2fd; color: #1976d2; }
    .status-triggered { background: #fff3cd; color: #856404; }
    .status-paused { background: #eee; color: #666; }
    button, a.btn-primary { padding: 0.4rem 0.9rem; border-radius: 4px; border: 1px solid #ccc; cursor: pointer; background: white; text-decoration: none; color: inherit; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    a.btn-primary { background: #1976d2; color: white; bor
    .btn-link-danger { color: #b00020; font-size: 0.85em; text-decoration: underline; border: none; padding: 0.4rem; background: transparent; }der-color: #1976d2; }
    .btn-danger { color: #b00020; border-color: #b00020; }
  `],
})
export class AlertList implements OnInit {
  private readonly service = inject(AlertService);
  readonly alerts = signal<Alert[]>([]);
  readonly loading = signal(true);
  readonly checking = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: data => {
        this.alerts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(id: string): void {
    if (!confirm('Excluir este alerta?')) return;
    this.service.delete(id).subscribe(() => this.reload());
  }

  checkNow(): void {
    this.checking.set(true);
    this.service.triggerCheck().subscribe({
      next: () => {
        this.checking.set(false);
        this.reload();
      },
      error: () => this.checking.set(false),
    });
  }
}
