import type { Strings } from '@/i18n/strings';
import { ApiError } from './api';

export function errorText(e: unknown, t: Strings): string {
  const code = e instanceof ApiError ? e.code : '';
  switch (code) {
    case 'invalid_address': return t.errInvalid;
    case 'busy': return t.errBusy;
    case 'daily_limit': return t.errDaily;
    case 'scan_failed': return t.errFailed;
    case 'not_configured': return t.errNotConfigured;
    case 'not_found': return t.errNotFound;
    case 'limit_anon': return t.errLimitAnon;
    case 'limit_user': return t.errLimitUser;
    case 'limit_homes': return t.errLimitHomes;
    case 'captcha': return t.errCaptcha;
    case 'payment_required': return t.errPayment;
    case 'promo_over': return t.errPromoOver;
    case 'promo_used': return t.errPromoUsed;
    case 'invalid_review': return t.errReview;
    case 'forbidden': return e instanceof ApiError && e.detail === 'sign_in_required' ? t.errSignIn : t.errGeneric;
    default: return t.errGeneric;
  }
}
