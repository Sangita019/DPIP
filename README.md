# DPIP Screening Angular integration reference

This repository contains the standalone DPIP Angular component/service/models for use in an existing application. The service calls the live backend through the host application's `BANK_ENDP` constants and `NriLeadPhase`; no mock-data dependency, tokens or real customer details are embedded.

## Rendering rules

| `dpipBypassed` from Get DPIP history | Existing Name Screening | DPIP Screening |
|---|---|---|
| `true` | Show | Show |
| `false` | Hide | Show |
| Missing/unknown | Hide | Show loading/error, block approval |

**Important:** The host application's `leadDetails?.dpipBypassed` was returning `undefined`. The DPIP child must therefore be mounted whenever lead details are available, without first checking the bypass flag. It emits the flag through `(dpipBypassedChange)` after its Get DPIP history call. The parent uses this to conditionally render only the existing Name Screening component. Never wrap the DPIP child in a bypass flag condition.

The component supports `leadId`, `leadPhase`, `isEditable`, `refreshHistoryVersion` (CBS refresh), `(dpipBypassedChange)` and `(valueChange)`. The bypass output emits `undefined` when history is reset/unavailable and accepts only a boolean from a valid response.

See [integration.md](integration.md) for exact Digital Verification and CBS Decision parent HTML/TS snippets, safe loading behavior, and approval caveats. Actual parent files are not stored here and must be integrated in the host application. Business approval conditions, backend status meaning, initial screening trigger and displaying/masking customer identifiers require confirmation. This reference has not been compiled against the host application.
