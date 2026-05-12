import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AlertService } from './alert.service';
import {
  Alert,
  ALERT_TYPE_LABEL,
  AlertAnalytics,
  PriceHistoryPoint,
  ProductComparison,
  Trend,
} from './alert.model';

interface SparklinePoint {
  x: number;
  y: number;
  price: number;
  observedAt: string;
}

@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <a routerLink="/alerts" class="back">← Voltar</a>

    @if (loading()) {
      <p>Carregando...</p>
    } @else if (alert(); as a) {
      <h2>
        <a [href]="a.productUrl" target="_blank" rel="noopener noreferrer">
          {{ a.productName || '(sem nome)' }}
        </a>
      </h2>
      <p class="meta">
        <span class="type">{{ typeLabel(a) }}</span>
        ·
        <span [class]="'status status-' + a.status.toLowerCase()">{{ a.status }}</span>
        @if (a.lastObservedAvailable === false) {
          · <span class="badge badge-warn">indisponível</span>
        }
      </p>

      @if (analytics(); as an) {
        <section class="card">
          <h3>Analytics ({{ an.periodDays }} dias · {{ an.samples }} amostras)</h3>
          <div class="grid">
            <div><span class="lbl">Atual</span> <span class="val">{{ fmt(an.currentPrice) }}</span></div>
            <div><span class="lbl">Mínimo</span> <span class="val">{{ fmt(an.minPrice) }}</span></div>
            <div><span class="lbl">Máximo</span> <span class="val">{{ fmt(an.maxPrice) }}</span></div>
            <div><span class="lbl">Média</span> <span class="val">{{ fmt(an.avgPrice) }}</span></div>
            <div><span class="lbl">Tendência</span> <span class="val trend">{{ trendIcon(an.trend) }} {{ an.trend }}</span></div>
            <div>
              <span class="lbl">Sinais</span>
              <span class="val">
                @if (an.isLowestInPeriod) { <span class="badge badge-good">menor do período</span> }
                @if (an.isRealDiscount) { <span class="badge badge-good">desconto real</span> }
                @if (!an.isLowestInPeriod && !an.isRealDiscount) { — }
              </span>
            </div>
          </div>
        </section>

        @if (sparkPoints().length >= 2) {
          <section class="card">
            <h3>Histórico de preço</h3>
            <svg [attr.viewBox]="sparkViewBox()" class="spark" preserveAspectRatio="none">
              <polyline
                [attr.points]="sparkPath()"
                fill="none"
                stroke="#1976d2"
                stroke-width="1.5"
                vector-effect="non-scaling-stroke" />
              @if (an.minPrice != null) {
                <line
                  [attr.x1]="0" [attr.x2]="100"
                  [attr.y1]="yFor(an.minPrice)" [attr.y2]="yFor(an.minPrice)"
                  stroke="#155724" stroke-dasharray="2 2" stroke-width="0.5"
                  vector-effect="non-scaling-stroke" />
              }
              @if (an.avgPrice != null) {
                <line
                  [attr.x1]="0" [attr.x2]="100"
                  [attr.y1]="yFor(an.avgPrice)" [attr.y2]="yFor(an.avgPrice)"
                  stroke="#856404" stroke-dasharray="2 2" stroke-width="0.5"
                  vector-effect="non-scaling-stroke" />
              }
            </svg>
            <div class="legend">
              <span><span class="dot" style="background:#1976d2"></span> preço</span>
              <span><span class="dot" style="background:#155724"></span> mínimo</span>
              <span><span class="dot" style="background:#856404"></span> média</span>
            </div>
          </section>
        }
      }

      @if (history().length > 0) {
        <section class="card">
          <h3>Últimas verificações</h3>
          <table class="hist">
            <thead><tr><th>Quando</th><th>Preço</th></tr></thead>
            <tbody>
              @for (p of history().slice(0, 20); track p.observedAt) {
                <tr>
                  <td>{{ p.observedAt | date:'short' }}</td>
                  <td>{{ p.price | currency:'BRL':'symbol':'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      <section class="card">
        <div class="card-head">
          <h3>Mesmo produto em outros marketplaces</h3>
          <button (click)="loadComparisons()" [disabled]="loadingComp()">
            {{ loadingComp() ? 'Buscando...' : (comparisons() ? 'Atualizar' : 'Buscar') }}
          </button>
        </div>
        @if (comparisons(); as cmp) {
          @if (cmp.length === 0) {
            <p class="empty">Nenhum match encontrado.</p>
          } @else {
            <table>
              <thead>
                <tr><th>Marketplace</th><th>Produto</th><th>Preço</th><th>vs atual</th><th>Match</th><th></th></tr>
              </thead>
              <tbody>
                @for (c of cmp; track c.url) {
                  <tr>
                    <td>{{ c.marketplace }}</td>
                    <td>{{ c.name }}</td>
                    <td>{{ c.price | currency:'BRL':'symbol':'1.2-2' }}</td>
                    <td [class]="diffClass(c.priceDiffPercent)">
                      {{ c.priceDiffPercent != null ? (c.priceDiffPercent | number:'1.1-1') + '%' : '—' }}
                    </td>
                    <td>{{ (c.matchScore * 100) | number:'1.0-0' }}%</td>
                    <td><a [href]="c.url" target="_blank" rel="noopener noreferrer">abrir</a></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        }
      </section>
    } @else {
      <p>Alerta não encontrado.</p>
    }
  `,
  styles: [`
    .back { display: inline-block; margin-bottom: 1rem; color: #1976d2; text-decoration: none; }
    h2 { margin: 0 0 0.25rem 0; }
    h2 a { color: inherit; text-decoration: none; }
    .meta { color: #666; margin: 0 0 1.5rem 0; }
    .type { color: #444; font-weight: 500; }
    .status { padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.85em; font-weight: 600; }
    .status-active { background: #e3f2fd; color: #1976d2; }
    .status-triggered { background: #fff3cd; color: #856404; }
    .status-paused { background: #eee; color: #666; }
    .badge { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.7em; font-weight: 600; text-transform: uppercase; margin-right: 0.25rem; }
    .badge-warn { background: #fde2e2; color: #b00020; }
    .badge-good { background: #d4edda; color: #155724; }
    .card { border: 1px solid #e0e0e0; border-radius: 6px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; background: white; }
    .card h3 { margin: 0 0 0.75rem 0; font-size: 1rem; color: #444; }
    .card-head { display: flex; justify-content: space-between; align-items: center; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem 1.5rem; }
    .grid > div { display: flex; flex-direction: column; gap: 0.15rem; }
    .lbl { font-size: 0.75em; color: #888; text-transform: uppercase; }
    .val { font-weight: 600; }
    .trend { font-family: monospace; }
    .spark { width: 100%; height: 120px; background: #fafafa; border-radius: 4px; }
    .legend { display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.8em; color: #666; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.3rem; vertical-align: middle; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #eee; text-align: left; font-size: 0.92em; }
    th { font-weight: 600; color: #555; font-size: 0.8em; text-transform: uppercase; }
    .hist td:nth-child(2) { font-variant-numeric: tabular-nums; }
    .diff-up { color: #b00020; }
    .diff-down { color: #155724; }
    .empty { color: #888; }
    button { padding: 0.4rem 0.9rem; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class AlertDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(AlertService);

  readonly loading = signal(true);
  readonly alert = signal<Alert | null>(null);
  readonly analytics = signal<AlertAnalytics | null>(null);
  readonly history = signal<PriceHistoryPoint[]>([]);
  readonly comparisons = signal<ProductComparison[] | null>(null);
  readonly loadingComp = signal(false);

  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) {
      this.loading.set(false);
      return;
    }
    forkJoin({
      alert: this.service.get(this.id),
      analytics: this.service.analytics(this.id, 30),
      history: this.service.history(this.id, 30, 200),
    }).subscribe({
      next: ({ alert, analytics, history }) => {
        this.alert.set(alert);
        this.analytics.set(analytics);
        this.history.set(history);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadComparisons(): void {
    this.loadingComp.set(true);
    this.service.comparisons(this.id, 0.55, 5).subscribe({
      next: data => {
        this.comparisons.set(data);
        this.loadingComp.set(false);
      },
      error: () => {
        this.comparisons.set([]);
        this.loadingComp.set(false);
      },
    });
  }

  typeLabel(a: Alert): string {
    return ALERT_TYPE_LABEL[a.alertType] ?? a.alertType;
  }

  fmt(v: number | null): string {
    if (v == null) return '—';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  trendIcon(t: Trend): string {
    return t === 'UP' ? '↑' : t === 'DOWN' ? '↓' : t === 'STABLE' ? '→' : '?';
  }

  diffClass(pct: number | null): string {
    if (pct == null) return '';
    return pct > 0 ? 'diff-up' : pct < 0 ? 'diff-down' : '';
  }

  /** Sparkline points normalized to a 100x40 viewBox, oldest -> newest. */
  readonly sparkPoints = computed<SparklinePoint[]>(() => {
    const h = [...this.history()].sort(
      (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
    );
    if (h.length === 0) return [];
    const prices = h.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;
    return h.map((p, i) => ({
      x: (i / Math.max(1, h.length - 1)) * 100,
      y: 40 - ((p.price - min) / span) * 40,
      price: p.price,
      observedAt: p.observedAt,
    }));
  });

  sparkViewBox(): string {
    return '0 0 100 40';
  }

  sparkPath(): string {
    return this.sparkPoints()
      .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
  }

  /** Map a price to the same sparkline Y axis (0..40). */
  yFor(price: number): number {
    const pts = this.sparkPoints();
    if (pts.length === 0) return 20;
    const prices = this.history().map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;
    return 40 - ((price - min) / span) * 40;
  }
}
