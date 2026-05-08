import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `<p style="padding:2rem">Autenticando...</p>`,
})
export class Callback {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.authenticated()) {
        this.router.navigate(['/alerts']);
      }
    });
  }
}
