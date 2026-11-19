import type { ReportView } from './api';
// Hand-off between the scan screen and the report page so the report renders instantly.
export const viewCache = new Map<string, ReportView>();
