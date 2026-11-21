# Digital Verification and CBS Decision integration

## Correct screening visibility matrix

- dpipBypassed === true: show **both** existing Name Screening **and** new DPIP Screening
- dpipBypassed === false: show **DPIP Screening only**
- dpipBypassed is undefined or null: show neither, pending flag resolution; block approval

The DPIP component must not reject a successful DPIP response based on dpipBypassed being true: it is used in both cases.

Use the existing `BANK_ENDP.GET_DPIP` and `BANK_ENDP.TRIGGER_DPIP` constants with your API URL conventions. The service uses the live API with the existing auth interceptor. No mock data or new provider is required.

## In BOTH parent .ts files

Import `DpipScreeningComponent` and `IDpipBlockValidity` and register the component in the existing Angular standalone `imports` array (or in your module if using NgModules).

```ts
dpipScreeningValidity: IDpipBlockValidity = { valid: false };

get dpipBypassed(): boolean | undefined {
  return this.leadDetails?.dpipBypassed;
}

onDpipScreeningValidityChange(value: IDpipBlockValidity): void {
  this.dpipScreeningValidity = value;
}
```

The getter assumes the flag is directly present on leadDetails. Verify the real DTO path. The property in the API response does not automatically populate the parent lead DTO; resolve it before deciding which component(s) to render.

## Digital Verification HTML

Retain the existing Name Screening expansion panel and **all** its bindings; wrap that entire panel in `@if (dpipBypassed === true)`. Add a separate expansion panel (following the existing panel styles and structure) for the DPIP component whenever the flag is known:

```html
@if (dpipBypassed === true) {
  <!-- EXISTING entire Name Screening expansion panel, unchanged -->
}

@if (dpipBypassed === true || dpipBypassed === false) {
  <mat-expansion-panel>
    <mat-expansion-panel-header>
      <mat-panel-title>DPIP Screening</mat-panel-title>
    </mat-expansion-panel-header>
    <app-dpip-screening
      [leadId]="leadDetails.leadId"
      [leadPhase]="dpipLeadPhase"
      [isEditable]="isDpipEditable"
      (valueChange)="onDpipScreeningValidityChange($event)">
    </app-dpip-screening>
  </mat-expansion-panel>
}
```

Declare `readonly dpipLeadPhase = NriLeadPhase.DIGITAL_VERIFICATION;`. Use the actual Digital Verification editability condition for `isDpipEditable`.

## CBS Decision HTML

Keep the existing Name Screening mat-card and its `[shouldGetNameScreeningHistory]` and `(valueChange)` bindings, but show it only for true. Add an independent DPIP mat-card for both booleans:

```html
@if (dpipBypassed === true) {
  <!-- EXISTING Name Screening mat-card, unchanged -->
}

@if (dpipBypassed === true || dpipBypassed === false) {
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
        (valueChange)="onDpipScreeningValidityChange($event)">
      </app-dpip-screening>
    </mat-card-content>
  </mat-card>
}
```

Declare `readonly dpipLeadPhase = NriLeadPhase.CBS_IMPLEMENTATION;` and `dpipHistoryRefreshVersion = 0;`. When your existing CBS logic refreshes screening, refresh both when true and only DPIP when false:

```ts
checkForNameScreeningHistory(): void {
  if (!this.leadDetails) return;
  if (this.dpipBypassed === true) {
    this.shouldGetNameScreeningHistory = true;
  }
  if (this.dpipBypassed === true || this.dpipBypassed === false) {
    this.dpipScreeningValidity = { valid: false };
    this.dpipHistoryRefreshVersion++;
  }
}
```

The extra `refreshHistoryVersion` input is supported by the DPIP component, which reloads history on a changed number. This is independent of the existing Name Screening boolean refresh.

## Approval behavior is separate from visibility

**Do not assume** that displaying both means both are mandatory approval gates. Confirm the business requirement before changing existing approval or CIF/account creation logic. Keep separate validity values, reset them on lead/mode changes and block approval for unavailable configuration. A provisional conservative gate if both are required for true is:

```ts
get isScreeningValid(): boolean {
  if (this.dpipBypassed === true)
    return this.nameScreeningValidity.valid && this.dpipScreeningValidity.valid;
  if (this.dpipBypassed === false)
    return this.dpipScreeningValidity.valid;
  return false;
}
```

If DPIP is informational when bypassed, the true-case gate may instead use only legacy Name Screening validity. Confirm this with the workflow owner. Do not loosen server-side screening requirements.

The DPIP result check is provisionally NO_MATCH only; confirm other statuses, match handling, initial trigger behavior and treatment of bypassed responses. ID Type and Value are parsed from the serialized request and may need masking/access controls. No live API or Angular compilation was performed in this reference repository.
