import { NriLeadPhase } from
  'src/app/nri/workflow/constants/lead.constants';

export interface IDpipScreeningResponse {
  // The history endpoint may omit body when no screening history exists.
  body?: ILeadDpipDto | null;
  messages: string[];
  success: boolean;
}

export interface ILeadDpipDto {
  dpipBypassed: boolean;
  errorDescription: string | null;
  leadId: string;
  leadPhase: NriLeadPhase;
  matchedParameters: unknown[] | null;
  request: string | null;
  response: string | null;
  retriggerAllowed: boolean;
  status: string;
  statusTimestamp: string | null;
}

export interface IDpipIdentifier {
  type: string;
  value: string;
  role?: string;
}

export interface IDpipRequest {
  EIS_PAYLOAD?: {
    PAYLOAD?: {
      identifiers?: IDpipIdentifier[];
    };
  };
}

export interface IDpipBlockValidity {
  valid: boolean;
}
