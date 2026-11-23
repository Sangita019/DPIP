# DPIP integration: Digital Verification and CBS Decision

This repository contains the reusable DPIP child component, not the application's parent component source files. Apply the following changes in the host DAS Angular application. Keep all existing Name Screening service, components, bindings and APIs unchanged.

## Confirmed display rule

| API body.dpipBypassed | Name Screening | DPIP Screening |
| --- | --- | --- |
| `true` | Show | Show |
| `false` | Hide | Show |
| `undefined` or invalid/missing history | Hide | Show DPIP loading/error state; block approval |

### Why the previous conditional approach hid Name Screening

`leadDetails?.dpipBypassed` returned `undefined` in Digital Verification, even though `dpipBypassed` was present in the **Get DPIP history API** body. In addition, conditionally rendering DPIP only after checking the flag creates a deadlock: the child cannot call the API that supplies the flag until it is rendered.

Therefore **render DPIP unconditionally whenever `leadDetails` exists**, and emit `dpipBypassed` from its API response. Only the existing Name Screening panel/card is gated on `dpipBypassed === true`.

## Common changes in BOTH parent .ts files

Import `DpipScreeningComponent` in the parent component/module as needed, and `IDpipBlockValidity` from `dpip-screening.model`. Remove the old getter that reads `this.leadDetails?.dpipBypassed`.

```ts
dpipBypassed: boolean | undefined = undefined;
dpipScreeningValidity: IDpipBlockValidity = { valid: false };

onDpipBypassedChange(value: boolean | undefined): void {
  // Name Screening becomes a fresh component whenever the flag changes.
  if (this.dpipBypassed !== value) {
    this.nameScreeningValidity = { valid: false };
  }
  this.dpipBypassed = value;
}

onDpipScreeningValidityChange(value: IDpipBlockValidity): void {
  this.dpipScreeningValidity = value;
}
```

Whenever the active lead ID or workflow context changes, reset `dpipBypassed = undefined`, `dpipScreeningValidity = { valid: false }`, and `nameScreeningValidity = { valid: false }` in the **existing parent lead-change handler**. Avoid resetting on unrelated change-detection cycles. The child also emits `undefined` while loading or when the history response is unavailable, so stale flags are not trusted during refresh/errors.

The child event `dpipBypassedChange` is asynchronous to avoid changing parent-bound values during Angular's child `ngOnChanges` check. A boolean is emitted only when the response is successful, corresponds to the current lead and phase, and contains a boolean bypass flag.

## Digital Verification: .html

Keep the original complete Name Screening expansion panel (including its current CSS classes and event bindings), but wrap it in a conditional. Then render DPIP as an **independent** expansion panel. Place both within your existing `@if (leadDetails) { ... }` guard.

```html
@if (leadDetails) {
  @if (dpipBypassed === true) {
    <!-- Existing complete Name Screening expansion panel, unchanged. -->
  }

  <mat-expansion-panel class="mat-elevation-z0 top-expansion-panel" [expanded]="true">
    <mat-expansion-panel-header class="top-expansion-panel-header">
      <mat-panel-title class="top-expansion-panel-title">DPIP Screening</mat-panel-title>
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
}
```

Declare `readonly dpipLeadPhase = NriLeadPhase.DIGITAL_VERIFICATION;`. Use the existing permission / editability rule for `isDpipEditable`; `false` disables retriggering until that rule is confirmed. Do not replace this panel with an `@else` branch.

## CBS Decision: .html and history refresh

Inside the existing `leadDetails` guard, retain the original Name Screening mat-card, including `[shouldGetNameScreeningHistory]` and `(valueChange)`, but wrap the **entire card** in `@if (dpipBypassed === true)`.

Render DPIP as a separate card regardless of the flag:

```html
@if (leadDetails) {
  @if (dpipBypassed === true) {
    <!-- Existing complete Name Screening mat-card, unchanged. -->
  }

  <mat-card class="my-2">
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
}
```

Declare `readonly dpipLeadPhase = NriLeadPhase.CBS_IMPLEMENTATION;` and `dpipHistoryRefreshVersion = 0;`. Modify the existing CBS refresh logic only as follows:

```ts
checkForNameScreeningHistory(): void {
  if (!this.leadDetails) return;

  if (this.dpipBypassed === true) {
    this.shouldGetNameScreeningHistory = true;
  }

  // DPIP is always present; a refresh can also recover a missing bypass flag.
  this.dpipScreeningValidity = { valid: false };
  this.dpipHistoryRefreshVersion++;
}
```

If the existing flow refreshes Name Screening before the DPIP flag becomes available, confirm the timing with the backend/workflow owner. `refreshHistoryVersion` is a changed numeric input supported by the child, which re-fetches DPIP history.

## Validation, error and production caveats

**Visibility and approval are separate business rules.** Keep the existing approval check until the owner confirms whether both screenings must be valid when `dpipBypassed === true`. Do not permit approval while the flag is unknown or the required screening is invalid. If both must pass when true, this is a *provisional* gate:

```ts
get isScreeningValid(): boolean {
  if (this.dpipBypassed === true)
    return this.nameScreeningValidity.valid && this.dpipScreeningValidity.valid;
  if (this.dpipBypassed === false)
    return this.dpipScreeningValidity.valid;
  return false;
}
```

DPIP validity currently treats `NO_MATCH` as cleared provisionally; verify other statuses, error handling, match presentation, initial screening trigger and retrigger permissions. When the Get DPIP history API returns no body, the flag cannot be inferred: DPIP shows its error/loading state and Name Screening remains hidden. For that case a dedicated configuration field in the lead-details API is the long-term alternative.

Identifiers in the DPIP table come from `body.request` and are **request identifiers**, not match results. Apply bank-approved masking and access restrictions before displaying live customer data. The sample repository contains no actual parent source or credentials and has not been compiled against the host Angular project.
