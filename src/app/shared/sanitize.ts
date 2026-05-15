import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Hardening utilities for user-supplied input.
 *
 * Angular já faz auto-escape de interpolações ({{ }}) e sanitiza bindings
 * de [href]/[src], mas qualquer dado enviado ao backend ainda precisa ser
 * normalizado/validado no cliente para reduzir superfície de ataque
 * (defense-in-depth — o backend continua sendo a fonte da verdade).
 */

/** Tamanho máx. razoável para nome de produto. */
export const PRODUCT_NAME_MAX_LEN = 200;

/** Tamanho máx. razoável para URL de produto. */
export const PRODUCT_URL_MAX_LEN = 2048;

/** Hosts (e subdomínios) permitidos como URL de produto. */
const ALLOWED_PRODUCT_HOST_SUFFIXES: readonly string[] = [
  'mercadolivre.com.br',
  'mercadolibre.com', // redirecionamentos de afiliado eventuais
  'shopee.com.br',
];

/**
 * Remove caracteres de controle, tags HTML e normaliza espaços.
 * Retorna `undefined` se o resultado ficar vazio (para enviar `undefined`
 * ao backend em campos opcionais).
 */
export function sanitizePlainText(
  input: string | null | undefined,
  maxLen: number,
): string | undefined {
  if (input == null) return undefined;
  let s = String(input);
  // Remove caracteres de controle (exceto \t e quebras já viram espaço abaixo).
  s = s.replace(/[\u0000-\u001F\u007F\u2028\u2029]/g, ' ');
  // Strip qualquer coisa parecida com tag HTML.
  s = s.replace(/<[^>]*>/g, '');
  // Normaliza espaços em branco.
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length === 0) return undefined;
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

export interface ParsedProductUrl {
  /** URL canônica (sem credenciais, sem fragmento). */
  href: string;
  host: string;
}

/**
 * Valida e canonicaliza uma URL de produto:
 *  - exige scheme `https:` (rejeita `javascript:`, `data:`, `http:`);
 *  - rejeita credenciais embutidas (`https://user:pass@...`);
 *  - exige host em allow-list de marketplaces;
 *  - remove o fragmento (#...) — não é enviado ao servidor de origem mesmo,
 *    e evita ruído.
 *
 * Retorna `null` se inválida.
 */
export function parseProductUrl(input: string | null | undefined): ParsedProductUrl | null {
  if (input == null) return null;
  const raw = String(input).trim();
  if (raw.length === 0 || raw.length > PRODUCT_URL_MAX_LEN) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.username !== '' || url.password !== '') return null;

  const host = url.hostname.toLowerCase();
  const allowed = ALLOWED_PRODUCT_HOST_SUFFIXES.some(
    suffix => host === suffix || host.endsWith(`.${suffix}`),
  );
  if (!allowed) return null;

  url.hash = '';
  url.username = '';
  url.password = '';

  return { href: url.toString(), host };
}

/** Validator reativo para URL de produto. */
export function productUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null || v === '') return null; // `required` cuida disso à parte.
    return parseProductUrl(v) ? null : { productUrl: true };
  };
}
