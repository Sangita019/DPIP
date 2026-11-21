export interface DpipIdentifier { type: string; value: string; role?: string; }
export interface DpipResult {
 leadId: string; leadPhase: string;
 dpipBypassed: boolean; status: string;
 request: string | null; response: string | null;
 matchedParameters: unknown[] | null;
 retriggerAllowed: boolean; errorDescription: string | null;
 statusTimestamp: string | null;
}
export interface DpipResponse { success: boolean; body: DpipResult | null; messages: string[]; }
export function readIdentifiers(request: string | null): DpipIdentifier[] {
 if (!request) throw new Error('Missing request');
 const rows: unknown = JSON.parse(request)?.EIS_PAYLOAD?.PAYLOAD?.identifiers;
 if (!Array.isArray(rows) || !rows.length || !rows.every(r => r && typeof r.type === 'string' && typeof r.value === 'string')) throw new Error('Invalid identifiers');
 return rows;
}
