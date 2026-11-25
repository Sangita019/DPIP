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
- Shows a manual **Trigger DPIP** button for no-history, editable Digital Verification.
- Shows status, timestamp, request identifiers, EIS processing status and EIS screening result when available.
- Accepts both parsed JSON objects and serialized JSON strings in `body.request` and `body.response` (the actual API screenshots show objects).
- Displays submitted ID Type/Value in a responsive, horizontally scrollable table.
- Shows **Re-Trigger DPIP** with an inactive state when `retriggerAllowed:false`. The button becomes active only with workflow permission, `dpipBypassed:false`, and backend `retriggerAllowed:true`.
- Keeps DPIP validity conservative: body.status `NO_MATCH` and no error description (provisional pending business confirmation). A nested EIS outcome is shown for reference, not automatically treated as an approval decision.
- Uses a responsive template and SCSS for proper status, table and button spacing.

Actual `digital-verification.component.*` and `cbs-decision.component.*` files are **not in this repository**; follow [integration.md](integration.md) to update them in your DAS Angular application, including closing the Material expansion-panel header **before** inserting the DPIP child.

Backend requirements and permissions (including re-trigger policy and bypass configuration), customer identifier masking, complete EIS match details, and final approval criteria must be validated with the backend/workflow owners. This reference has not been compiled against the host Angular application.
