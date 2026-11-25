import { NriLeadPhase } from
  'src/app/nri/workflow/constants/lead.constants';

export interface IDpipScreeningResponse {
  // A successful history response can omit body when no history exists.
  body?: ILeadDpipDto | null;
  messages?: string[];
  success: boolean;
}

export interface IDpipIdentifier {
  type: string;
  value: string;
  role?: string;
}

export interface IDpipRequest {
  DESTINATION?: string;
  EIS_PAYLOAD?: {
    PAYLOAD?: {
      identifiers?: IDpipIdentifier[];
    };
  };
}

export interface IDpipEisResponse {
  EIS_RESPONSE?: {
    payload?: {
      status?: string | null; // EIS processing status, e.g. SUCCESS
      payload?: {
        status?: string | null; // Screening outcome, e.g. NO_MATCH
        match?: boolean | null;
        notAMatch?: boolean | null;
        matched_identifiers?: unknown[] | null;
        dpip_cluster_details?: unknown[] | null;
      };
    };
    ERROR_CODE?: string | null;
    ERROR_DESCRIPTION?: string | null;
    RESPONSE_STATUS?: string | null;
  } | null;
}

export interface ILeadDpipDto {
  dpipBypassed: boolean;
  errorDescription: string | null;
  leadId: string;
  leadPhase: NriLeadPhase;
  matchedParameters: unknown[] | null;
  // Backend may return parsed JSON objects OR serialized JSON strings.
  request: IDpipRequest | string | null;
  response: IDpipEisResponse | string | null;
  retriggerAllowed: boolean;
  status: string | null;
  statusTimestamp: string | null;
}

export interface IDpipBlockValidity {
  valid: boolean;
}
