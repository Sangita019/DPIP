# DPIP Screening Angular integration sample

The component and service follow Steps 6 and 7 of the Angular implementation. Copy the six dpip-screening files into the existing Angular application's steps-shared folder and use the application's BANK_ENDP and NriLeadPhase definitions. The service calls the live backend with HttpClient; mock data is optional and not referenced by the component.

Use existing Name Screening when dpipBypassed is true; use DPIP when false. Unknown flag must block approval. See integration.md for parent integration and pending checks. No credentials or real customer data included. This reference requires the host Angular application and has not been compiled against it.
