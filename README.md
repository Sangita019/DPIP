# DPIP Screening Angular integration sample

Standalone implementation files for integration into an existing Angular application. Service uses live backend endpoints through the host application's `BANK_ENDP` and `NriLeadPhase` definitions. No mock dependency; no credentials or customer data.

**Screen display rule:** if `dpipBypassed === true`, display both existing Name Screening and DPIP Screening; if `false`, display DPIP only. Unknown flag means configuration unavailable. Existing Name Screening code should remain unchanged.

The DPIP component accepts `leadId`, `leadPhase`, `isEditable`, and optional `refreshHistoryVersion` (CBS refresh). See [integration.md](integration.md) for parent component HTML/TS and approval caveats. Actual parent files are not present in this sample repository and are not modified. Backend status/approval semantics require confirmation; this reference has not been built against the host application.
