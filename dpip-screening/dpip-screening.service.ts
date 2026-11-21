import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BANK_ENDP } from
  'src/app/constants/api.constants';

import { NriLeadPhase } from
  'src/app/nri/workflow/constants/lead.constants';

import { IDpipScreeningResponse } from
  './dpip-screening.model';

@Injectable({
  providedIn: 'root'
})
export class DpipScreeningService {

  constructor(private http: HttpClient) {}

  getDpipScreeningHistory(
    leadId: string,
    leadPhase: NriLeadPhase
  ): Observable<IDpipScreeningResponse> {

    return this.http.get<IDpipScreeningResponse>(
      BANK_ENDP.GET_DPIP(leadId, leadPhase)
    );
  }

  triggerDpipScreening(
    leadId: string
  ): Observable<IDpipScreeningResponse> {

    return this.http.get<IDpipScreeningResponse>(
      BANK_ENDP.TRIGGER_DPIP(leadId)
    );
  }
}
