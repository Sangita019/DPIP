# Digital Verification and CBS Decision

Import DpipScreeningComponent in both parent components. Configure DPIP_ENDPOINTS using approved API constants: provide history(id, phase) and trigger(id) URL functions. Use existing authentication interceptor.

Read the bypass flag from the confirmed DTO or approved read-only configuration source, even when no history exists. Do not use a screening trigger merely to discover this flag.

```html
@if (dpipBypassed === true) {
  <!-- Keep existing Name Screening markup and all bindings here. -->
} @else if (dpipBypassed === false) {
  <app-dpip-screening [leadId]="leadId" [phase]="phase"
    [isEditable]="isEditable" (valueChange)="onDpipValidityChange($event)" />
} @else {
  <p>Screening configuration unavailable.</p>
}
```
Adapt properties to actual parent models. In CBS also bind refreshHistory to the existing refresh signal (ensure a changed value each time refresh is needed). Keep separate validity for each mode and reset on lead/phase/mode changes. Require active mode validity in existing approval conditions; unknown flag or error must block approval. Backend must independently enforce approval.

Initial screening automation is not implemented in this reference: confirm the approved maker/checker trigger and no-history contract. Only NO_MATCH permits validity in this provisional version. Confirm CLEARED and other status rules, actual request path, matched identifiers, freshness and retrigger rules. The table displays submitted identifiers, not confirmed matches. Apply approved masking before using live data. No live API or Angular compilation tested.
