# Digital Verification and CBS Decision

The service now follows the Step 6 pattern: HttpClient, BANK_ENDP.GET_DPIP and BANK_ENDP.TRIGGER_DPIP. Add these endpoint builders to your existing API constants, using your approved base URL convention. It uses the live API and existing authentication interceptor; no DPIP_ENDPOINTS injection token or mock response is required. The sample assumes the existing application's BANK_ENDP and NriLeadPhase imports.

Import DpipScreeningComponent in both parents. Read the bypass flag from the confirmed DTO or approved read-only configuration source, even when no history exists. Do not trigger screening merely to discover this flag.

```html
@if (dpipBypassed === true) {
  <!-- Keep existing Name Screening markup and all bindings here. -->
} @else if (dpipBypassed === false) {
  <app-dpip-screening [leadId]="leadId" [leadPhase]="leadPhase"
    [isEditable]="isEditable" (valueChange)="onDpipValidityChange($event)" />
} @else {
  <p>Screening configuration unavailable.</p>
}
```

Adapt these properties to the actual parent models. CBS Decision's additional history-refresh mechanism still needs to be wired to getDpipScreeningHistory(); the Step 7 component currently loads history on leadId or leadPhase changes. Keep separate validity for each mode and reset on lead/phase/mode changes. Require active mode validity in existing approval conditions; unknown flag or error must block approval. Backend must independently enforce approval.

Only NO_MATCH is included in the confirmed status enum. Treat the provisional validity rule as pending business approval, including the expected treatment of missing identifiers. Confirm remaining statuses, matched identifiers, freshness, initial screening and retrigger rules. The table displays submitted identifiers, not confirmed matches. Apply approved masking and access control before displaying live values. No live API or Angular compilation tested.
