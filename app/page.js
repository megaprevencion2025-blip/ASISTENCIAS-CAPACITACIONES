'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'

const uid = ()=> crypto.randomUUID()

export default function Page(){
  const [tab,setTab]=useState('capacitaciones')
  const [events,setEvents]=useState([])
  const [attendees,setAttendees]=useState([])
  const [checkins,setCheckins]=useState([])
  const [brand,setBrand]=useState({ company: 'Mi Empresa', logo: '' })

  const loadAll = async()=>{
    const [e,a,c] = await Promise.all([fetch('/api/events').then(r=>r.json()), fetch('/api/attendees').then(r=>r.json()), fetch('/api/checkins').then(r=>r.json())])
    setEvents(e.events||[]); setAttendees(a.attendees||[]); setCheckins(c.checkins||[])
  }
  useEffect(()=>{ loadAll() }, [])

  return (<div className="container" style={{display:'grid',gap:16}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        {brand.logo? <img src={brand.logo} alt="logo" style={{height:36}}/>: null}
        <strong>{brand.company}</strong>
      </div>
      <nav className="nav">
        {['capacitaciones','registro','asistencia','reportes','config'].map(t=>(
          <button key={t} className={'btn ' + (tab===t?'active':'')} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>
        ))}
      </nav>
    </header>

    {tab==='capacitaciones' && <Capacitaciones events={events} reload={loadAll}/>}
    {tab==='registro' && <Registro events={events} reload={loadAll}/>}
    {tab==='asistencia' && <Asistencia attendees={attendees} events={events} checkins={checkins} reload={loadAll}/>}
    {tab==='reportes' && <Reportes events={events} attendees={attendees} checkins={checkins}/>}
    {tab==='config' && <Config brand={brand} setBrand={setBrand}/>}
  </div>)
}

function Capacitaciones({events,reload}){
  const [f,setF]=useState({title:'',date:'',time:'',location:'',instructor:'',hours:8,notes:''})
  const submit=async(e)=>{ e.preventDefault(); const body={...f,id:uid()}
    await fetch('/api/events', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
    setF({title:'',date:'',time:'',location:'',instructor:'',hours:8,notes:''})
    await reload()
  }
  return (<div className="card">
    <h2>Crear capacitación</h2>
    <form onSubmit={submit} style={{display:'grid',gap:8}}>
      <input className="input" placeholder="Título" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <input type="date" className="input" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>
        <input type="time" className="input" value={f.time} onChange={e=>setF({...f,time:e.target.value})}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <input className="input" placeholder="Lugar" value={f.location} onChange={e=>setF({...f,location:e.target.value})}/>
        <input className="input" placeholder="Instructor" value={f.instructor} onChange={e=>setF({...f,instructor:e.target.value})}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <input type="number" className="input" placeholder="Horas" value={f.hours} onChange={e=>setF({...f,hours:e.target.value})}/>
        <input className="input" placeholder="Notas" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
      </div>
      <button className="btn primary" type="submit">Crear</button>
    </form>
    <hr/>
    <h3>Listado</h3>
    <div style={{display:'grid',gap:8}}>
      {events.map(e=>(<div key={e.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
        <div>
          <div style={{fontWeight:600}}>{e.title}</div>
          <div style={{fontSize:12,color:'#64748b'}}>{e.date} {e.time} · {e.location} · {e.instructor} · {e.hours}h</div>
        </div>
      </div>))}
      {events.length===0 && <p style={{fontSize:13,color:'#64748b'}}>Aún no hay capacitaciones.</p>}
    </div>
  </div>)
}

function Registro({events,reload}){
  const [f,setF]=useState({eventId:'',fullName:'',idNumber:'',email:'',role:'',company:''})
  const [ticket,setTicket]=useState(null)
  const submit=async(e)=>{
    e.preventDefault(); const id=uid(); const code=JSON.stringify({type:'cap-reg',regId:id}); const reg={id, ...f, code}
    await fetch('/api/attendees',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(reg)})
    setTicket({id,code,fullName:f.fullName,qr: await QRCode.toDataURL(code)})
    setF({eventId:'',fullName:'',idNumber:'',email:'',role:'',company:''}); await reload()
  }
  return (<div className="card">
    <h2>Registro de asistentes</h2>
    <form onSubmit={submit} style={{display:'grid',gap:8}}>
      <select className="input" value={f.eventId} onChange={e=>setF({...f,eventId:e.target.value})}>
        <option value="">-- Selecciona capacitación --</option>
        {events.map(e=>(<option key={e.id} value={e.id}>{e.title} · {e.date}</option>))}
      </select>
      <input className="input" placeholder="Nombre completo" value={f.fullName} onChange={e=>setF({...f,fullName:e.target.value})}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <input className="input" placeholder="Documento" value={f.idNumber} onChange={e=>setF({...f,idNumber:e.target.value})}/>
        <input type="email" className="input" placeholder="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <input className="input" placeholder="Cargo" value={f.role} onChange={e=>setF({...f,role:e.target.value})}/>
        <input className="input" placeholder="Empresa" value={f.company} onChange={e=>setF({...f,company:e.target.value})}/>
      </div>
      <button className="btn primary" type="submit">Generar QR</button>
    </form>
    {ticket && <div className="card" style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:12,alignItems:'center',marginTop:12}}>
      <img src={ticket.qr} alt="QR" style={{width:180,height:180,objectFit:'contain'}}/>
      <div><div style={{fontWeight:600}}>{ticket.fullName}</div><div><code>{ticket.code}</code></div></div>
    </div>}
  </div>)
}

function Asistencia({attendees,events,checkins,reload}){
  const [cameraOn,setCameraOn]=useState(false); const [manual,setManual]=useState(''); const [result,setResult]=useState(''); const [signature,setSignature]=useState(null)
  const readerRef=useRef(null)
  useEffect(()=>{ let scanner; async function start(){ try{ if(!document.getElementById('reader')) return; scanner = new Html5Qrcode('reader'); await scanner.start({facingMode:'environment'},{fps:10,qrbox:250},async(txt)=>{ await onCode(txt) },()=>{}); readerRef.current=scanner; }catch{ setResult('No se pudo iniciar la cámara'); } } if(cameraOn) start(); return ()=>{ if(readerRef.current){ readerRef.current.stop().catch(()=>{}).finally(()=>readerRef.current=null) } }; },[cameraOn])
  const onCode = async(txt)=>{
    try{ const p=JSON.parse(txt); if(p.type!=='cap-reg') throw new Error('formato'); const regId=p.regId; const a=attendees.find(x=>x.id===regId); if(!a){ setResult('❌ Registro no encontrado'); return; }
      await fetch('/api/checkins',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({regId, eventId:a.eventId, signatureDataUrl:signature})})
      setResult('✔️ Asistencia registrada'); await reload()
    }catch{ setResult('❌ Código inválido') }
  }
  const onManual = async()=> manual && onCode(manual)
  return (<div className="card">
    <h2>Asistencia</h2>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button className={'btn ' + (cameraOn?'primary':'')} onClick={()=>setCameraOn(v=>!v)}>{cameraOn?'Detener cámara':'Iniciar cámara'}</button>
    </div>
    <div id="reader" className="qrbox" style={{marginTop:8}}>{!cameraOn && <div style={{fontSize:13,color:'#64748b'}}>La cámara aparecerá aquí…</div>}</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,marginTop:8}}>
      <input className="input" placeholder="Pega código JSON" value={manual} onChange={e=>setManual(e.target.value)}/>
      <button className="btn" onClick={onManual}>Registrar manual</button>
    </div>
    <Signature onChange={setSignature}/>
    {result && <p style={{marginTop:8}}>{result}</p>}
  </div>)
}

function Signature({onChange}){
  const ref=useRef(null); const [drawing,setDrawing]=useState(false)
  useEffect(()=>{ const c=ref.current; const ctx=c.getContext('2d'); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#0f172a' },[])
  const pos=(e)=>{ const r=ref.current.getBoundingClientRect(); const t=e.touches?e.touches[0]:e; return {x:t.clientX-r.left,y:t.clientY-r.top} }
  const start=(e)=>{ e.preventDefault(); const ctx=ref.current.getContext('2d'); const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); setDrawing(true) }
  const move=(e)=>{ if(!drawing) return; const ctx=ref.current.getContext('2d'); const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke() }
  const end=()=>{ if(!drawing) return; setDrawing(false); onChange?.(ref.current.toDataURL('image/png')) }
  const clear=()=>{ const c=ref.current, ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); onChange?.(null) }
  return (<div style={{marginTop:8}}>
    <h4>Firma del asistente</h4>
    <canvas ref={ref} width={600} height={200} className="card"
      onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
      onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
    <button className="btn" onClick={clear} style={{marginTop:8}}>Limpiar firma</button>
  </div>)
}

function Reportes({events,attendees,checkins}){
  const toCSV=(rows)=>{
    if(!rows.length) return ''; const headers=Object.keys(rows[0]); const esc=s=>{const x=s==null?'':String(s); return (x.includes(',')||x.includes('\n')||x.includes('"'))?`"${x.replaceAll('"','""')}"`:x}
    return [headers.join(','), ...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n')
  }
  const download=(name,content,mime='text/plain;charset=utf-8')=>{ const blob=new Blob([content],{type:mime}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url) }
  const cert=(regId)=>{
    const a=attendees.find(x=>x.id===regId); const ev=events.find(e=>e.id===a?.eventId); const c=checkins.find(k=>k.regId===regId);
    if(!a) return; const doc=new jsPDF({unit:'pt',format:'a4'}); let y=60;
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.text('Constancia de Asistencia', 60,y);
    doc.setFont('helvetica','normal'); doc.setFontSize(12); y+=30;
    doc.text('Se certifica que: ' + a.fullName, 60,y); y+=18;
    if(a.idNumber) { doc.text('Documento: ' + a.idNumber, 60,y); y+=18; }
    if(a.company) { doc.text('Empresa: ' + a.company, 60,y); y+=18; }
    doc.text('Asistió a la capacitación:', 60,y); y+=18;
    doc.setFont('helvetica','bold'); doc.text(ev? ev.title: a.eventId, 60,y); y+=18;
    doc.setFont('helvetica','normal');
    if(ev){ doc.text(`Fecha/Hora: ${ev.date} ${ev.time}`, 60,y); y+=18; if(ev.instructor){ doc.text(`Instructor: ${ev.instructor}`, 60,y); y+=18; } if(ev.hours){ doc.text(`Duración: ${ev.hours} horas`, 60,y); y+=18; } }
    if(c?.signatureDataUrl){ try{ doc.text('Firma del asistente:', 60,y); y+=10; doc.addImage(c.signatureDataUrl,'PNG',60,y,220,80); y+=90; }catch{} } else { doc.text('(Sin firma registrada)', 60,y); y+=18; }
    doc.text('Código de registro: ' + regId, 60,y+20);
    doc.save('certificado_'+regId+'.pdf');
  }
  const rowsInscritos = attendees.map(a=>({registro_id:a.id,evento_id:a.eventId,nombre:a.fullName,documento:a.idNumber,email:a.email,cargo:a.role,empresa:a.company,creado:a.createdAt}))
  return (<div className="card">
    <h2>Reportes</h2>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
      <button className="btn" onClick={()=>download('inscritos.csv', toCSV(rowsInscritos),'text/csv')}>Inscritos CSV</button>
      <button className="btn" onClick={()=>download('asistencias.csv', toCSV(checkins),'text/csv')}>Asistencias CSV</button>
    </div>
    <div style={{display:'grid',gap:8,maxHeight:360,overflow:'auto'}}>
      {attendees.map(a=>(<div key={a.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
        <div>
          <div style={{fontWeight:600}}>{a.fullName}</div>
          <div style={{fontSize:12,color:'#64748b'}}>Reg #{a.id}</div>
        </div>
        <button className="btn" onClick={()=>cert(a.id)}>PDF</button>
      </div>))}
      {attendees.length===0 && <p style={{fontSize:13,color:'#64748b'}}>No hay registros.</p>}
    </div>
  </div>)
}
