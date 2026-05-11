import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  template: `
    <section class="logout-page">
      <h2>Você saiu</h2>
      <p>Sua sessão foi encerrada com sucesso.</p>
      <button type="button" (click)="login()">Entrar novamente</button>
    </section>
  `,
  styles: [`
    .logout-page {
      max-width: 480px;
      margin: 4rem auto;
      padding: 2rem;
      text-align: center;
    }
    .logout-page h2 { margin-bottom: 0.5rem; }
    .logout-page p { color: #555; margin-bottom: 1.5rem; }
    .logout-page button {
      padding: 0.6rem 1.4rem;
      cursor: pointer;
    }
  `],
})
export class Logout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  login(): void {
    this.auth.login();
  }
}
