import type { Row, Worksheet } from 'exceljs'
import { displayDate, displayTime, type summarize } from './incident-data'
import type { Report } from './export-report'

const GREEN='FF00704F',LIGHT='FFE8F3EE',GREY='FFD9E2DD'
type Sum=ReturnType<typeof summarize>
type Point={name:string;count:number}

function barChart(title:string,values:Point[],color='#00704F'){
 const W=1200,H=520,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d')!
 x.fillStyle='#ffffff';x.fillRect(0,0,W,H);x.fillStyle='#1f2a24';x.font='bold 26px Arial';x.fillText(title,40,48)
 const L=80,B=H-110,T=90,R=W-40,max=Math.max(1,...values.map(v=>v.count)),step=Math.max(1,Math.ceil(max/5)),top=step*Math.ceil(max/step)
 x.font='16px Arial';x.textAlign='right';x.strokeStyle='#e3e8e5';x.lineWidth=1
 for(let v=0;v<=top;v+=step){const y=B-(v/top)*(B-T);x.beginPath();x.moveTo(L,y);x.lineTo(R,y);x.stroke();x.fillStyle='#6b7a72';x.fillText(String(v),L-10,y+5)}
 const n=Math.max(1,values.length),w=(R-L)/n,bw=Math.min(70,w*0.65)
 values.forEach((v,i)=>{const h=(v.count/top)*(B-T),cx=L+w*i+w/2;x.fillStyle=color;x.fillRect(cx-bw/2,B-h,bw,h);x.textAlign='center';if(v.count){x.fillStyle='#1f2a24';x.font='bold 15px Arial';x.fillText(String(v.count),cx,B-h-8)}
  if(n<=31||i%Math.ceil(n/31)===0){x.save();x.translate(cx,B+14);x.rotate(n>8?-Math.PI/4:0);x.textAlign=n>8?'right':'center';x.fillStyle='#4b5a52';x.font='14px Arial';const t=v.name.length>22?v.name.slice(0,21)+'…':v.name;x.fillText(t,0,n>8?0:10);x.restore()}})
 x.strokeStyle='#9aa8a0';x.beginPath();x.moveTo(L,T-10);x.lineTo(L,B);x.lineTo(R,B);x.stroke()
 return c.toDataURL('image/png')
}

 export async function excelReport(report:Report,{summary,other,delta,metadata,details,breakdown}:{summary:Sum;other:Sum;delta:number|null;metadata:(string|number)[][];details:Record<string,string>[];breakdown:{employee:string;total:number;types:{name:string;count:number}[]}[]}){
 const ExcelJS=(await import('exceljs')).default,wb=new ExcelJS.Workbook();wb.creator='Incidentes Profamilia'
 const side={style:'thin' as const,color:{argb:GREY}},border={top:side,bottom:side,left:side,right:side}
 const header=(row:Row)=>row.eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'},name:'Arial'};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:GREEN}};c.border=border})
 const body=(row:Row,i:number)=>row.eachCell(c=>{c.font={name:'Arial',size:10,bold:Boolean(c.font?.bold)};c.border=border;if(i%2)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:LIGHT}}})
 const title=(ws:Worksheet,text:string,cols:number)=>{ws.mergeCells(1,1,1,cols);const t=ws.getCell(1,1);t.value=text;t.font={name:'Arial',size:18,bold:true,color:{argb:'FFFFFFFF'}};t.fill={type:'pattern',pattern:'solid',fgColor:{argb:GREEN}};t.alignment={vertical:'middle',indent:1};ws.getRow(1).height=34
  ws.mergeCells(2,1,2,cols);const s=ws.getCell(2,1);s.value=`Generado: ${displayDate(new Date().toISOString())} ${displayTime(new Date().toISOString())} (hora de Colombia)`;s.font={name:'Arial',size:9,italic:true,color:{argb:'FF6B7A72'}}}
 const table=(ws:Worksheet,start:number,head:string[],rows:(string|number)[][],pctCol?:number)=>{ws.getRow(start).values=head;header(ws.getRow(start));rows.forEach((r,i)=>{const row=ws.getRow(start+1+i);row.values=r;body(row,i);if(pctCol)row.getCell(pctCol).numFmt='0.0"%"'});if(!rows.length){const c=ws.getCell(start+1,1);c.value='Sin datos para el período seleccionado';c.font={italic:true,name:'Arial',size:10}}return start+Math.max(1,rows.length)+3}

 const rs=wb.addWorksheet('Resumen',{views:[{showGridLines:false}]});rs.columns=[{width:34},{width:46},{width:16}];title(rs,'Incidentes Profamilia · Resumen',3)
 let r=table(rs,4,['Indicador','Valor'],metadata.map(m=>[m[0]??'',typeof m[1]==='number'&&!Number.isInteger(m[1])?Number(m[1].toFixed(2)):m[1]??'']))
 r=table(rs,r,['Empleado','Cantidad'],summary.employees.map(e=>[e.name,e.count]))
 r=table(rs,r,['Tipo de incidente','Cantidad','Porcentaje'],summary.types.map(t=>[t.name,t.count,Number(t.percent.toFixed(1))]),3)
 if(report.comparing){const c=rs.getCell(r,1);c.value='Segundo período';c.font={name:'Arial',bold:true,size:13,color:{argb:GREEN}};r=table(rs,r+1,['Empleado','Cantidad'],other.employees.map(e=>[e.name,e.count]));table(rs,r,['Tipo de incidente','Cantidad','Porcentaje'],other.types.map(t=>[t.name,t.count,Number(t.percent.toFixed(1))]),3)}
 rs.getColumn(2).alignment={horizontal:'left'}

 const gs=wb.addWorksheet('Gráficas',{views:[{showGridLines:false}]});gs.columns=Array.from({length:12},()=>({width:11}));title(gs,'Incidentes Profamilia · Gráficas',12)
 const charts:[string,Point[],string?][]=[['Evolución de incidentes',report.series],['Incidentes por empleado',summary.employees,'#2E86AB'],['Incidentes por tipo',summary.types,'#D9A21B']]
 if(report.comparing)charts.push([`Comparación de períodos${delta===null?'':` · variación ${delta.toFixed(1)}%`}`,[{name:'Período inicial',count:summary.total},{name:'Segundo período',count:other.total}],'#C8553D'])
 charts.forEach(([t,v,c],i)=>{const id=wb.addImage({base64:barChart(t,v,c),extension:'png'});gs.addImage(id,{tl:{col:0,row:3+i*17},ext:{width:720,height:312}})})

 const ds=wb.addWorksheet('Registros',{views:[{state:'frozen',ySplit:3,showGridLines:false}]});ds.columns=[{width:14},{width:16},{width:10},{width:30},{width:50}];title(ds,'Incidentes Profamilia · Registros',5)
 table(ds,3,['Período','Fecha','Hora','Empleado','Incidente'],details.map(d=>Object.values(d)));ds.autoFilter={from:'A3',to:'E3'}
 const bs=wb.addWorksheet('Detalle por empleado',{views:[{showGridLines:false}]});bs.columns=[{width:30},{width:12},{width:80}];title(bs,'Incidentes Profamilia · Detalle por empleado',3)
 table(bs,3,['Empleado','Total','Detalle por tipo'],breakdown.map(r=>[r.employee,r.total,r.types.map(t=>`${t.name}: ${t.count}`).join(' · ')]))

 const buf=await wb.xlsx.writeBuffer(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.download='incidentes-profamilia.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
