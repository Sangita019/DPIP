# DPIP integration in Digital Verification and CBS Decision

These instructions are for the host DAS Angular application. This repository contains the **reusable DPIP component only**; it does not contain `digital-verification.component.ts/html` or `cbs-decision.component.ts/html`. Preserve all existing Name Screening files and API calls.

## Final display and approval rules

| `dpipBypassed` | Name Screening | DPIP Screening | Provisional screening approval gate |
| --- | --- | --- | --- |
| `true` | Show | Hide | Name Screening validity |
| `false` | Show | Show | Both Name Screening and DPIP validity |
| `undefined` | Show | Await configuration / load history | Block approval |

The approval gate is **provisional** until confirmed by the workflow owner. Do not change backend authorization or legacy CIF/account-status checks based only on UI visibility.

### Avoid circular rendering dependency

`dpipBypassed` currently comes from the DPIP history/trigger response's `body.dpipBypassed`. If the DPIP child is wrapped in `@if (dpipBypassed === false)`, it will not mount while the flag is undefined, so the GET request will never execute.

Until the backend exposes the bypass flag through an independent lead-details/configuration API, keep the DPIP child mounted and use `[style.display]="dpipBypassed === true ? 'none' : null"` on its **parent panel/card**. This allows the history call to run. It means the panel may be briefly visible while the flag is unknown; for a strictly enforced bypass before any DPIP action, the backend must provide the flag independently and the UI must gate the trigger accordingly. A bypassed case should not automatically trigger DPIP.

Never put `<app-dpip-screening>` inside `<mat-expansion-panel-header>` or inside another expansion panel. The header must contain only its title; the child belongs in the panel body.

## Common parent .ts integration

Import `DpipScreeningComponent` and `IDpipBlockValidity` as appropriate for your existing standalone component/module. Keep `NameScreeningComponent` and its validity handling unchanged.

```ts
dpipBypassed: boolean | undefined = undefined;
dpipScreeningValidity: IDpipBlockValidity = { valid: false };

onDpipBypassedChange(value: boolean | undefined): void {
  this.dpipBypassed = value;
}

onDpipScreeningValidityChange(value: IDpipBlockValidity): void {
  this.dpipScreeningValidity = value;
}

get isScreeningValid(): boolean {
  if (this.dpipBypassed === true) {
    return this.nameScreeningValidity.valid;
  }
  if (this.dpipBypassed === false) {
    return this.nameScreeningValidity.valid &&
      this.dpipScreeningValidity.valid;
  }
  return false;
}
```

Reset bypass and both validity values **when the active lead changes**, not on every change-detection cycle. Name Screening is always rendered and should **not** lose its validity merely because DPIP history emits `undefined` during a reload.

The DPIP child emits `undefined` when history is reset or unavailable. It emits true/false only after a valid response with matching lead and phase. The output is asynchronous.

## Digital Verification HTML

Within the existing `mat-accordion` and existing `@if (leadDetails)` guard, retain the complete original Name Screening panel with its bindings **without a bypass condition**, followed by a sibling DPIP panel:

```html
<!-- EXISTING full Name Screening expansion panel: always visible -->

<mat-expansion-panel
  class="mat-elevation-z0 top-expansion-panel"
  [expanded]="true"
  [style.display]="dpipBypassed === true ? 'none' : null">

  <mat-expansion-panel-header class="top-expansion-panel-header">
    <mat-panel-title class="top-expansion-panel-title">
      DPIP Screening
    </mat-panel-title>
  </mat-expansion-panel-header>

  <div class="container">
    <app-dpip-screening
      [leadId]="leadDetails.leadId"
      [leadPhase]="dpipLeadPhase"
      [isEditable]="isDpipEditable"
      (dpipBypassedChange)="onDpipBypassedChange($event)"
      (valueChange)="onDpipScreeningValidityChange($event)">
    </app-dpip-screening>
  </div>
</mat-expansion-panel>
```

Declare `readonly dpipLeadPhase = NriLeadPhase.DIGITAL_VERIFICATION;`. Bind `isDpipEditable` to the actual Digital Verification step editability and user authorization; avoid hardcoding true. Do not add `[refreshHistoryVersion]` to Digital Verification unless that parent has a defined refresh counter.

### First-time manual trigger

On GET history response with `success:true`, no `body`, and a matching no-history message (either **"No DPIP history found..."** or **"No DPIP screening history found..."**), DPIP displays a manual **Trigger DPIP** action in an **editable Digital Verification or CBS Implementation** step. An unrelated successful response without a body is not automatically treated as missing history, to avoid duplicate screening requests. Clicking it calls the existing trigger API by lead ID. It does **not** trigger automatically. When the trigger response contains a complete DPIP body with a matching lead ID and phase, it is processed directly (like Name Screening). If the trigger response returns `success:true` but no `body` (acknowledgement only), the component calls the phase-specific **Get DPIP History** API once to load the new record. If the record is not yet ready, the UI displays no history and does **not** automatically retry or re-trigger. Confirm that the backend trigger endpoint chooses `CBS_IMPLEMENTATION` when called from CBS. If a trigger fails or times out, inspect history before trying again to avoid duplicate screening attempts.

## CBS Decision HTML

Within the existing `leadDetails` guard, retain the full original Name Screening mat-card **unconditionally** with its existing `[shouldGetNameScreeningHistory]` and `(valueChange)` bindings.

Render DPIP as an independent card, not nested in the Name Screening card:

```html
<mat-card class="my-2" [style.display]="dpipBypassed === true ? 'none' : null">
  <mat-card-header class="name-screen-header">
    <mat-card-title class="name-screen-title">DPIP Screening</mat-card-title>
  </mat-card-header>

  <mat-card-content class="name-screen-content">
    <app-dpip-screening
      [leadId]="leadDetails.leadId"
      [leadPhase]="dpipLeadPhase"
      [isEditable]="isDpipEditable"
      [refreshHistoryVersion]="dpipHistoryRefreshVersion"
      (dpipBypassedChange)="onDpipBypassedChange($event)"
      (valueChange)="onDpipScreeningValidityChange($event)">
    </app-dpip-screening>
  </mat-card-content>
</mat-card>
```

Declare `readonly dpipLeadPhase = NriLeadPhase.CBS_IMPLEMENTATION;` and `dpipHistoryRefreshVersion = 0;` if not already present. To refresh both screening histories, preserve the original Name Screening refresh **for either flag value**, and additionally refresh DPIP:

```ts
checkForNameScreeningHistory(): void {
  if (!this.leadDetails) return;
  this.shouldGetNameScreeningHistory = true;
  this.dpipScreeningValidity = { valid: false };
  this.dpipHistoryRefreshVersion++;
}
```

The DPIP child displays **Trigger DPIP** when no CBS-specific history exists and the phase is `CBS_IMPLEMENTATION`; the button is enabled only for editable steps. After history exists, **Re-Trigger DPIP** appears in the top-right of the DPIP content, aligned like Name Screening. Following backend team confirmation, the frontend no longer gates this action on `retriggerAllowed`; it still checks step editability, loading state, supported phase, and that `dpipBypassed` is false. Backend authorization and duplicate-request controls must remain enforced on the server. The separate **Reload history** button has been removed; **Retry** is retained only for an API error.

## Data handling changes included in this repository

The backend samples returned **objects** for `body.request` and `body.response`; earlier responses sometimes used JSON strings. The component now supports both types.

- `request.EIS_PAYLOAD.PAYLOAD.identifiers`: displays the request identifier type and value.
- `response.EIS_RESPONSE.payload.status`: displays EIS processing status, e.g. SUCCESS.
- `response.EIS_RESPONSE.payload.payload.status`: displays the EIS screening result, e.g. NO_MATCH.
- `response.EIS_RESPONSE.payload.payload.matched_identifiers`: displays the count only; match-detail layout needs the actual non-empty response schema.
- `body.status`: controls the DPIP decision display and **provisional** approval validity. The backend sample confirms `NO_MATCH`; the UI also recognizes `MATCH`/`MATCH_FOUND` and `API_ERROR`/`ERROR`/`FAILED` (the exact error and match strings must be confirmed with the backend team). No Match is the **only** value that can emit `valid: true`.
- If `errorDescription`, an EIS error code/description, or an EIS failure is present, the UI displays API Error and emits invalid screening. A contradictory EIS match response prevents `NO_MATCH` from being accepted as valid.
- Missing/unrecognized status shows Pending / unavailable and emits `valid: false`; a nested EIS `NO_MATCH` alone does not override a missing `body.status`.
- Match Found shows a warning; No Match shows success; API Error shows an explicit error. Full matched-record details still require a non-empty backend EIS sample.
- `body.retriggerAllowed`: still part of the response model, but **not used for frontend re-trigger eligibility** per backend team's confirmed workflow; server-side authorization still applies.

The component layout now uses wrapping controls and an overflow-safe identifier table. **It cannot repair a parent template that nests DPIP content inside a Material expansion-panel header**; fix the parent as shown above.

## Verification checklist

1. History GET executes for Digital Verification and CBS Implementation with the correct lead and phase.
2. A completed response with a `body` shows Type and Value from request identifiers, DPIP status, EIS processing/result and timestamp.
3. When the bypass flag is true, Name Screening remains visible but DPIP is hidden. When false, both are visible.
4. For a lead with no history in either Digital Verification or CBS Implementation, **Trigger DPIP** appears and is enabled only for an editable step.
5. After history exists, **Re-Trigger DPIP** is enabled for editable, non-bypassed leads even when `retriggerAllowed:false` in the response. The server must still authorize the actual action.
6. Match Found, API Error, unknown/pending status, or contradictory EIS results do not enable approval.
7. A small viewport shows scrolling/wrapping rather than overlapping content.
8. Sensitive identifiers are displayed only according to bank-approved masking and user access rules.

Neither compilation nor real backend testing can be performed from this reference repository alone.
