# DPIP integration: Digital Verification and CBS Decision

This repository contains the reusable DPIP child component, not the application's parent component source files. Apply the following changes in the host DAS Angular application. Keep all existing Name Screening service, components, bindings and APIs unchanged.

## Confirmed display rule

| API body.dpipBypassed | Name Screening | DPIP Screening |
| --- | --- | --- |
| `true` | Show | Show |
| `false` | Hide | Show |
| `undefined` while history is missing | Hide until a trigger returns the flag | Show manual Trigger DPIP button in editable Digital Verification; otherwise show missing-history state; block approval |

### Why the previous conditional approach hid Name Screening

`leadDetails?.dpipBypassed` returned `undefined` in Digital Verification, even though `dpipBypassed` was present in the **Get DPIP history API** body. In addition, conditionally rendering DPIP only after checking the flag creates a deadlock: the child cannot call the API that supplies the flag until it is rendered.

Therefore **render DPIP unconditionally whenever `leadDetails` exists**, and emit `dpipBypassed` from its API response. Only the existing Name Screening panel/card is gated on `dpipBypassed === true`.

## First-time manual DPIP screening (Digital Verification)

When Get DPIP History returns HTTP 200 with `success: true`, no `body`, and a message containing `No DPIP history found`, the component treats this as a **normal missing-history state**, rather than a generic API error. No trigger request is made automatically.

In **editable** Digital Verification, the component shows **Trigger DPIP**. The user must click it to call the existing `GET /api/bo/lead/dpip/{leadId}` trigger endpoint. Successful trigger responses are processed with the same `processDpipResponse` method, updating the screening table, validity event and `dpipBypassedChange` event.

The initial Trigger DPIP button is shown only for the Digital Verification phase, and is enabled only if `[isEditable]` is true. In CBS Decision, missing history is displayed without an initial trigger option; its existing history refresh path is retained. `retriggerAllowed` applies only to the existing retrigger control, not to the first-time trigger.

**Important:** the parent templates must mount the DPIP child even when `dpipBypassed` is undefined, otherwise the history request and first-time trigger UI cannot run. The absence of a history body means the bypass flag remains unknown until a successful trigger response or another approved backend source supplies it. Therefore the existing Name Screening card stays hidden until then. Keep approval gated.

To enable the first-time button, replace the temporary `isDpipEditable = false` from earlier setup with the application's real Digital Verification permission/editability rule. Never set it globally true without authorization. A network error after attempting trigger should be resolved by checking history first; the UI's history reload avoids blindly resubmitting a potentially completed trigger.

### Manual trigger test

1. Open an editable Digital Verification lead with no DPIP history. Check the Get DPIP history response in the Network tab; the Trigger DPIP button should appear **enabled**.
2. Click **Trigger DPIP** once, verify that the trigger endpoint is called and that status, ID Type/Value and bypass flag populate from its response.
3. Verify `dpipBypassed === true` shows both screens, while `false` shows DPIP only.
4. Verify that a read-only Digital Verification lead disables Trigger DPIP; CBS Decision never offers the initial Trigger DPIP button.
5. Verify a 401/403/500 or invalid response keeps approval blocked and does not silently retry the trigger.

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

DPIP validity currently treats `NO_MATCH` as cleared provisionally; verify other statuses, error handling, match presentation, and backend permission rules for manual initial screening and retrigger. When Get DPIP history returns no body with the confirmed no-history message, the flag cannot yet be inferred: DPIP shows the manual first-time trigger option in editable Digital Verification, while Name Screening stays hidden. A dedicated configuration field in the lead-details API would allow independent visibility before first screening.

Identifiers in the DPIP table come from `body.request` and are **request identifiers**, not match results. Apply bank-approved masking and access restrictions before displaying live customer data. The sample repository contains no actual parent source or credentials and has not been compiled against the host Angular project.
