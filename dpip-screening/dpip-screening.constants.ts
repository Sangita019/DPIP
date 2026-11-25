// DPIP status strings are not identical to legacy Name Screening decisions.
// NO_MATCH is confirmed by the sample backend response. Confirm the exact
// MATCH/API_ERROR spellings with the backend team before final UAT.
export enum DpipScreeningStatusEnum {
  MATCH = 'MATCH',
  NO_MATCH = 'NO_MATCH',
  API_ERROR = 'API_ERROR'
}

export const DpipIdentifierDisplayRecord:
  Record<string, string> = {
    PAN: 'PAN',
    MOBILE: 'Mobile Number',
    EMAIL: 'Email ID',
    PASSPORT: 'Passport'
};
