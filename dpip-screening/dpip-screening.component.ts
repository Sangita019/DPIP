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
  IDpipEisResponse,
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

  // Async output avoids changing the parent flag during Angular input checking.
  // Undefined means the flag is still unavailable or the history request failed.
  @Output() dpipBypassedChange =
    new EventEmitter<boolean | undefined>(true);

  dpipDetails?: ILeadDpipDto;
  eisResponse: IDpipEisResponse | null = null;

  identifiers: IDpipIdentifier[] = [];

  displayedColumns: string[] = [
    'serialNo',
    'type',
    'value'
  ];

  isLoading = false;
  errorMessage = '';
  // A missing-history response is not an HTTP error. Initial screening
  // can be manually triggered in either editable workflow phase.
  noHistoryFound = false;
  isInitialTriggerAvailable = false;

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

    if (
      changes['leadId'] ||
      changes['leadPhase'] ||
      changes['refreshHistoryVersion']
    ) {
      if (this.leadId && this.leadPhase) {
        this.getDpipScreeningHistory();
      } else {
        this.activeRequest?.unsubscribe();
        this.resetScreeningData();
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
          const noHistory =
            res.success === true &&
            !res.body &&
            res.messages?.some(
              message => typeof message === 'string' &&
                message.toLowerCase().includes('no dpip history found')
            );

          if (noHistory) {
            this.isLoading = false;
            this.noHistoryFound = true;
            this.isInitialTriggerAvailable = this.isScreeningPhase;
            // No bypass flag can be inferred until a screening response exists.
            // resetScreeningData() has already emitted undefined to the parent.
            return;
          }

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

    if (
      !this.leadId ||
      !this.leadPhase ||
      (!this.canTriggerInitially && !this.canRetrigger)
    ) {
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

    if (typeof res.body.dpipBypassed !== 'boolean') {
      this.handleApiError('DPIP bypass configuration is unavailable.');
      return;
    }

    this.dpipDetails = res.body;

    // The parent decides whether to display legacy Name Screening.
    // DPIP is always rendered when lead details are available.
    this.dpipBypassedChange.emit(this.dpipDetails.dpipBypassed);

    this.identifiers = this.parseIdentifiers(
      this.dpipDetails.request
    );
    this.eisResponse = this.readJsonObject(
      this.dpipDetails.response
    );

    this.emitScreeningValidity();
  }

  // The backend returns request/response either as JSON objects or strings.
  // JSON.parse must only run on strings; never on an already parsed object.
  private readJsonObject<T extends object>(
    raw: T | string | null
  ): T | null {
    if (!raw) {
      return null;
    }

    try {
      const value: unknown =
        typeof raw === 'string' ? JSON.parse(raw) : raw;

      return value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
        ? value as T
        : null;
    } catch {
      return null;
    }
  }

  private parseIdentifiers(
    request: IDpipRequest | string | null
  ): IDpipIdentifier[] {
    const parsed = this.readJsonObject<IDpipRequest>(request);
    const identifiers =
      parsed?.EIS_PAYLOAD?.PAYLOAD?.identifiers;

    if (!Array.isArray(identifiers)) {
      return [];
    }

    return identifiers.filter(
      item =>
        item !== null &&
        typeof item === 'object' &&
        typeof item.type === 'string' &&
        typeof item.value === 'string'
    );
  }

  get isNoMatch(): boolean {
    return (
      this.dpipDetails?.status === DpipScreeningStatusEnum.NO_MATCH &&
      !this.dpipDetails?.errorDescription
    );
  }

  // EIS status is informative; approval still uses body.status only.
  get eisScreeningStatus(): string | null {
    return this.eisResponse?.EIS_RESPONSE?.payload?.payload?.status
      ?? null;
  }

  get eisProcessingStatus(): string | null {
    return this.eisResponse?.EIS_RESPONSE?.payload?.status
      ?? null;
  }

  get matchedIdentifierCount(): number | null {
    const matches =
      this.eisResponse?.EIS_RESPONSE?.payload?.payload
        ?.matched_identifiers;

    return Array.isArray(matches) ? matches.length : null;
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
    this.eisResponse = null;
    this.identifiers = [];
    this.errorMessage = '';
    this.isLoading = false;
    this.noHistoryFound = false;
    this.isInitialTriggerAvailable = false;

    this.valueChange.emit({
      valid: false
    });
    this.dpipBypassedChange.emit(undefined);
  }

  private handleApiError(message: string): void {

    this.resetScreeningData();
    this.errorMessage = message;
  }

  get canTriggerInitially(): boolean {
    return (
      this.isInitialTriggerAvailable &&
      this.noHistoryFound &&
      this.isEditable &&
      !this.isLoading &&
      !!this.leadId &&
      this.isScreeningPhase
    );
  }

  // The workflow team confirmed that re-trigger does not depend on the
  // backend's retriggerAllowed flag. Step permission is still required.
  get canRetrigger(): boolean {
    return (
      this.isEditable &&
      !this.isLoading &&
      !!this.leadId &&
      this.isScreeningPhase &&
      this.dpipDetails?.dpipBypassed === false
    );
  }

  private get isScreeningPhase(): boolean {
    return (
      this.leadPhase === NriLeadPhase.DIGITAL_VERIFICATION ||
      this.leadPhase === NriLeadPhase.CBS_IMPLEMENTATION
    );
  }

}
