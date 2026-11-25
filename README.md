# DPIP Screening Angular integration reference

This repository contains a reusable Angular DPIP component/service/model for an existing banking workflow application. It calls the host application's real `BANK_ENDP` APIs; no mock API, credentials, or real customer data are stored here.

## Final workflow display rules

| `dpipBypassed` | Existing Name Screening | DPIP Screening |
|---|---|---|
| `true` | Show | Hide |
| `false` | Show | Show |
| `undefined` | Show | Resolve flag from backend; approval blocked |

**Existing Name Screening always remains visible.** The parent must not conditionally destroy the DPIP child based on a bypass value that the child is responsible for fetching. See [integration.md](integration.md) for the current non-destructive display workaround, its limitation while the flag is unknown, and the preferred independent backend bypass flag.

## Latest DPIP UI and response handling

- Reads DPIP history automatically for the selected lead/phase; new screening is **never triggered automatically**.
- Shows a manual **Trigger DPIP** button for no-history in **editable Digital Verification and CBS Implementation**. It calls the real trigger API; it never triggers automatically.
- Shows status, timestamp, request identifiers, EIS processing status and EIS screening result when available.
- Accepts both parsed JSON objects and serialized JSON strings in `body.request` and `body.response` (the actual API screenshots show objects).
- Displays submitted ID Type/Value in a responsive, horizontally scrollable table.
- Shows **Re-Trigger DPIP** at top-right once history exists, enabled for editable, non-bypassed leads independently of the response's `retriggerAllowed` field, per the backend team's confirmed requirement. Server-side authorization and duplicate request protection remain essential.
- Handles three DPIP decision categories in the shared component: **MATCH** (including `MATCH_FOUND`), **NO_MATCH** (including `NO_MATCH_FOUND`), and **API_ERROR** (including explicit error/failure variants). Only an uncontradicted `NO_MATCH` with no API/EIS error passes validity. Missing/unknown status remains invalid. Exact backend string values for match/error still need confirmation; sample data only verifies `NO_MATCH`. A nested EIS outcome alone does not clear a missing body.status.
- Uses a responsive template and SCSS for proper status, table and button spacing.

Actual `digital-verification.component.*` and `cbs-decision.component.*` files are **not in this repository**; follow [integration.md](integration.md) to update them in your DAS Angular application, including closing the Material expansion-panel header **before** inserting the DPIP child.

Backend requirements and permissions (including re-trigger policy and bypass configuration), customer identifier masking, complete EIS match details, and final approval criteria must be validated with the backend/workflow owners. This reference has not been compiled against the host Angular application.
