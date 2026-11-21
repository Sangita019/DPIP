import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { DpipScreeningService } from './dpip-screening.service';
import { DpipIdentifier, DpipResponse, readIdentifiers } from './dpip-screening.model';
import { DpipStatus } from './dpip-screening.constants';
@Component({selector:'app-dpip-screening', standalone:true, imports:[DatePipe], templateUrl:'./dpip-screening.component.html', styleUrls:['./dpip-screening.component.scss']})
export class DpipScreeningComponent implements OnChanges, OnDestroy {
 @Input() leadId = '';
 @Input() phase = '';
 @Input() isEditable = false;
 @Input() refreshHistory: unknown;
 @Output() valueChange = new EventEmitter<{valid:boolean}>();
 private service = inject(DpipScreeningService);
 private pending?: Subscription;
 rows: DpipIdentifier[] = [];
 status = '';
 timestamp: string | null = null;
 error = '';
 loading = false;
 retriggerAllowed = false;
 ngOnChanges(changes: SimpleChanges) { if(changes['leadId'] || changes['phase'] || changes['refreshHistory']) this.load(false); }
 ngOnDestroy() { this.pending?.unsubscribe(); }
 reload() { if(!this.loading) this.load(false); }
 retry() { if(this.isEditable && this.retriggerAllowed && !this.loading) this.load(true); }
 private load(trigger: boolean) {
  this.pending?.unsubscribe();
  this.rows=[]; this.status=''; this.timestamp=null; this.error=''; this.retriggerAllowed=false; this.loading=false;
  this.valueChange.emit({valid:false});
  if(!this.leadId || !this.phase) return;
  this.loading=true;
  this.pending=(trigger ? this.service.trigger(this.leadId) : this.service.history(this.leadId,this.phase)).subscribe({
   next: (res: DpipResponse) => {
    this.loading=false;
    if(!res.success || !res.body || res.body.dpipBypassed !== false || res.body.leadId !== this.leadId || res.body.leadPhase !== this.phase) { this.error='Screening unavailable for this lead and phase'; return; }
    this.status=res.body.status;
    this.timestamp=res.body.statusTimestamp;
    this.retriggerAllowed=res.body.retriggerAllowed === true;
    if(res.body.errorDescription) { this.error='Screening returned an error'; return; }
    try { this.rows=readIdentifiers(res.body.request); } catch { this.error='Screening request unavailable or invalid'; return; }
    // Provisional approval rule; confirm with workflow owner.
    this.valueChange.emit({valid:this.status === DpipStatus.NO_MATCH});
   },
   error: () => { this.loading=false; this.error='Unable to retrieve screening'; }
  });
 }
}
