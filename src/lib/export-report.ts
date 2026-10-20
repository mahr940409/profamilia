import { displayDate, displayTime, summarize, variation, type Incident, type Filters, type Catalog } from './incident-data'
export type Report = { rows:Incident[]; comparison:Incident[]; filters:Filters; second:{start:string;end:string}; comparing:boolean; employees:Catalog[];types:Catalog[]; series:{name:string;count:number}[] }
export async function exportReport(format:'excel'|'pdf',report:Report){
 const {rows,comparison,filters,second,comparing}=report
 const summary=summarize(rows,filters.start,filters.end), other=summarize(comparison,second.start,second.end)
 const delta=variation(summary.total,other.total)
 const filtersText=`Empleado: ${report.employees.find(e=>e.id===filters.employee)?.name??'Todos'} · Incidente: ${report.types.find(t=>t.id===filters.type)?.name??'Todos'}`
 const metadata=[['Período inicial',`${filters.start} a ${filters.end}`],['Filtros',filtersText],['Total de incidentes',summary.total],['Promedio diario',summary.daily],...(comparing?[['Segundo período',`${second.start} a ${second.end}`],['Total segundo período',other.total],['Promedio diario segundo período',other.daily],['Diferencia',other.total-summary.total],['Variación porcentual',delta===null?'No calculable: período inicial sin incidentes':delta+'%']]:[])]
 const records=(rs:Incident[],period:string)=>rs.map(r=>({Período:period,Fecha:displayDate(r.created_at),Hora:displayTime(r.created_at),Empleado:r.employees?.name??'',Incidente:r.incident_types?.name??''}))
 const details=[...records(rows,'Inicial'),...(comparing?records(comparison,'Segundo'):[])]
  if(format==='excel'){const {excelReport}=await import('./excel-report');await excelReport(report,{summary,other,delta,metadata,details});return}
 const {jsPDF}=await import('jspdf');const {default:autoTable}=await import('jspdf-autotable');const doc=new jsPDF();doc.setFontSize(20);doc.text('Incidentes Profamilia',14,22);doc.setFontSize(9);doc.text(`Generado: ${displayDate(new Date().toISOString())} ${displayTime(new Date().toISOString())} (Colombia)`,14,30)
 autoTable(doc,{startY:36,body:metadata.map(r=>r.map(String)),styles:{fontSize:9},theme:'grid'})
 let y=(doc as unknown as {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+12
 doc.text(rows.length?`Se registraron ${rows.length} incidentes en el período inicial. Los promedios incluyen días sin registros.`:'Sin datos para el período seleccionado',14,y,{maxWidth:180});y+=18
 autoTable(doc,{startY:y,head:[['Empleado','Cantidad']],body:summary.employees.map(e=>[e.name,e.count]),styles:{fontSize:9}})
 y=(doc as unknown as {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+10
 autoTable(doc,{startY:y,head:[['Tipo de incidente','Cantidad','Porcentaje']],body:summary.types.map(t=>[t.name,t.count,t.percent.toFixed(1)+'%']),styles:{fontSize:9}})
 if(comparing){doc.addPage();doc.setFontSize(14);doc.text(`Segundo período: ${second.start} a ${second.end}`,14,20);autoTable(doc,{startY:28,head:[['Empleado','Cantidad']],body:other.employees.map(e=>[e.name,e.count]),styles:{fontSize:9}});autoTable(doc,{startY:(doc as unknown as {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+12,head:[['Tipo de incidente','Cantidad','Porcentaje']],body:other.types.map(t=>[t.name,t.count,t.percent.toFixed(1)+'%']),styles:{fontSize:9}})}
 doc.addPage();doc.setFontSize(14);doc.text('Evolución del período inicial',14,22)
 const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=450;const ctx=canvas.getContext('2d');if(ctx){const theme=getComputedStyle(document.documentElement);ctx.fillStyle=theme.getPropertyValue('--card').trim();ctx.fillRect(0,0,1400,450);ctx.fillStyle=theme.getPropertyValue('--primary').trim();const max=Math.max(1,...report.series.map(s=>s.count)),w=1300/Math.max(1,report.series.length);report.series.forEach((s,i)=>{const h=s.count/max*330;ctx.fillRect(50+i*w,380-h,Math.max(1,w-3),h)});doc.addImage(canvas.toDataURL('image/png'),'PNG',14,30,180,58)}
 autoTable(doc,{startY:98,head:[['Fecha de agrupación','Incidentes']],body:report.series.map(s=>[s.name,s.count]),styles:{fontSize:9}})
 doc.addPage();doc.setFontSize(14);doc.text('Registros detallados',14,20);autoTable(doc,{startY:28,head:[['Período','Fecha','Hora','Empleado','Incidente']],body:details.map(r=>Object.values(r)),styles:{fontSize:8}});doc.save('incidentes-profamilia.pdf')
}