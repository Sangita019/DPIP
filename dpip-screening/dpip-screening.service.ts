import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DpipResponse } from './dpip-screening.model';
export const DPIP_ENDPOINTS = new InjectionToken<{ history: (id: string, phase: string) => string; trigger: (id: string) => string }>('DPIP_ENDPOINTS');
@Injectable({providedIn: 'root'})
export class DpipScreeningService {
 private http = inject(HttpClient);
 private endpoints = inject(DPIP_ENDPOINTS);
 history(id: string, phase: string) { return this.http.get<DpipResponse>(this.endpoints.history(id, phase)); }
 trigger(id: string) { return this.http.get<DpipResponse>(this.endpoints.trigger(id)); }
}
