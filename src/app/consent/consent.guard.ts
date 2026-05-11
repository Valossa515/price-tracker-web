import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConsentService } from './consent.service';

export const consentGuard: CanActivateFn = async () => {
  const consents = inject(ConsentService);
  const router = inject(Router);
  try {
    const pending = await firstValueFrom(consents.required());
    if (!pending || pending.length === 0) return true;
    router.navigate(['/consent']);
    return false;
  } catch {
    router.navigate(['/consent']);
    return false;
  }
};
