import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from
  '@angular/material/progress-spinner';

import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from
  '@angular/core/rxjs-interop';

import { NriLeadPhase } from
  'src/app/nri/workflow/constants/lead.constants';

import {
  IDpipScreeningResponse,
  ILeadDpipDto,
  IDpipIdentifier,
  IDpipRequest,
  IDpipBlockValidity
} from './dpip-screening.model';

import {
  DpipScreeningStatusEnum,
  DpipIdentifierDisplayRecord
} from './dpip-screening.constants';

import { DpipScreeningService } from
  './dpip-screening.service';

@Component({
  selector: 'app-dpip-screening',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dpip-screening.component.html',
  styleUrl: './dpip-screening.component.scss'
})
export class DpipScreeningComponent implements OnChanges {

  @Input() leadId?: string;
  @Input() leadPhase?: NriLeadPhase;
  @Input() isEditable = false;
  @Input() refreshHistoryVersion = 0;

  @Output() valueChange =
    new EventEmitter<IDpipBlockValidity>();

  dpipDetails?: ILeadDpipDto;

  identifiers: IDpipIdentifier[] = [];

  displayedColumns: string[] = [
    'serialNo',
    'type',
    'value'
  ];

  isLoading = false;
  errorMessage = '';

  readonly identifierDisplayRecord =
    DpipIdentifierDisplayRecord;

  readonly dpipStatusEnum =
    DpipScreeningStatusEnum;

  private destroyRef = inject(DestroyRef);
  private activeRequest?: Subscription;

  constructor(
    private dpipScreeningService: DpipScreeningService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['leadId'] || changes['leadPhase'] || changes['refreshHistoryVersion']) {

      this.activeRequest?.unsubscribe();
      this.resetScreeningData();

      if (this.leadId && this.leadPhase) {
        this.getDpipScreeningHistory();
      }
    }
  }

  getDpipScreeningHistory(): void {

    if (!this.leadId || !this.leadPhase) {
      return;
    }

    this.activeRequest?.unsubscribe();
    this.resetScreeningData();
    this.isLoading = true;

    this.activeRequest = this.dpipScreeningService
      .getDpipScreeningHistory(
        this.leadId,
        this.leadPhase
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: IDpipScreeningResponse) => {
          this.processDpipResponse(res);
        },
        error: () => {
          this.handleApiError(
            'Unable to fetch DPIP screening history.'
          );
        }
      });
  }

  triggerDpipScreening(): void {

    if (!this.leadId || !this.canRetrigger) {
      return;
    }

    this.activeRequest?.unsubscribe();
    this.resetScreeningData();
    this.isLoading = true;

    this.activeRequest = this.dpipScreeningService
      .triggerDpipScreening(this.leadId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: IDpipScreeningResponse) => {
          this.processDpipResponse(res);
        },
        error: () => {
          this.handleApiError(
            'Unable to trigger DPIP screening.'
          );
        }
      });
  }

  private processDpipResponse(
    res: IDpipScreeningResponse
  ): void {

    this.isLoading = false;

    if (!res.success || !res.body) {
      this.handleApiError(
        res.messages?.join(', ') ||
        'DPIP screening details are unavailable.'
      );
      return;
    }

    if (
      res.body.leadId !== this.leadId ||
      res.body.leadPhase !== this.leadPhase
    ) {
      this.handleApiError(
        'DPIP screening details do not match the current lead and phase.'
      );
      return;
    }

    this.dpipDetails = res.body;

    this.identifiers = this.parseIdentifiers(
      this.dpipDetails.request
    );

    this.emitScreeningValidity();
  }

  private parseIdentifiers(
    request: string | null
  ): IDpipIdentifier[] {

    if (!request) {
      return [];
    }

    try {

      const parsedRequest: IDpipRequest =
        JSON.parse(request);

      const identifiers =
        parsedRequest?.EIS_PAYLOAD?.PAYLOAD?.identifiers;

      if (!Array.isArray(identifiers)) {
        return [];
      }

      return identifiers.filter(
        item =>
          item &&
          typeof item.type === 'string' &&
          typeof item.value === 'string'
      );

    } catch {
      return [];
    }
  }

  private emitScreeningValidity(): void {

    // Provisional rule: confirm approval policy with the workflow owner.
    const isValid =
      this.dpipDetails?.status ===
        DpipScreeningStatusEnum.NO_MATCH &&
      !this.dpipDetails?.errorDescription;

    this.valueChange.emit({
      valid: isValid
    });
  }

  private resetScreeningData(): void {

    this.dpipDetails = undefined;
    this.identifiers = [];
    this.errorMessage = '';
    this.isLoading = false;

    this.valueChange.emit({
      valid: false
    });
  }

  private handleApiError(message: string): void {

    this.resetScreeningData();
    this.errorMessage = message;
  }

  get canRetrigger(): boolean {

    return (
      this.isEditable &&
      !this.isLoading &&
      this.dpipDetails?.retriggerAllowed === true
    );
  }

}
