import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const supabase = createClient(
  "https://xzvlzdqwgqdqvxyrykmi.supabase.co",
  "sb_publishable_bxWuH-i8Xb6lIA7ZpdK7dg_OIeLV3SW"
);

const uid = () => `${Date.now()}${Math.floor(Math.random() * 9999)}`;
const today = () => new Date().toISOString().split("T")[0];
const fmt = d => { if (!d) return "—"; try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; } };
const daysTo = d => { if (!d) return null; return Math.ceil((new Date(d + "T00:00:00") - new Date(today() + "T00:00:00")) / 86400000); };
const activeMRR = c => {
  const vs = c.value_schedule || [];
  if (!vs.length) return 0;
  const t = today(), a = vs.filter(p => p.from <= t).sort((a, b) => b.from.localeCompare(a.from));
  return a.length ? Number(a[0].value) : Number(vs[0]?.value || 0);
};
function addMonths(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split("T")[0];
}

const TH = {
  dark:  { bg:"#07091a",surface:"#0f1524",card:"#141b2d",border:"#1e293b",accent:"#6c63ff",accentDim:"#6c63ff18",text:"#cbd5e1",strong:"#f1f5f9",muted:"#4b5a72",inputBg:"#0b0f1f",danger:"#f43f5e",warning:"#fb923c",success:"#34d399",blue:"#60a5fa",purple:"#c084fc",stripe:"#ffffff04",shadow:"0 4px 24px #00000055",sidebar:"#080c1c",sidebarBorder:"#1a2235" },
  light: { bg:"#f0f4ff",surface:"#ffffff",card:"#ffffff",border:"#d0d8e8",accent:"#5b50ef",accentDim:"#5b50ef14",text:"#3d4f63",strong:"#0a0f1e",muted:"#6b7a94",inputBg:"#f8f9ff",danger:"#d91e45",warning:"#d97706",success:"#0f7938",blue:"#1d4ed8",purple:"#7c3aed",stripe:"#f0f2f9",shadow:"0 2px 12px #00000010",sidebar:"#0f1b3a",sidebarBorder:"#1a2d4a" },
};
const ALL_PAGES = ["Dashboard","Clientes","Funil","Atendimentos","Tarefas","Financeiro","Usuários"];

function Badge({s,C}){
  const m={Ativo:{bg:C.success+"22",c:C.success},Inadimplente:{bg:C.warning+"22",c:C.warning},Churn:{bg:C.danger+"22",c:C.danger},Pago:{bg:C.success+"22",c:C.success},Atrasado:{bg:C.danger+"22",c:C.danger},Pendente:{bg:C.warning+"22",c:C.warning},Cancelado:{bg:C.muted+"22",c:C.muted},Alta:{bg:C.danger+"22",c:C.danger},Média:{bg:C.warning+"22",c:C.warning},Baixa:{bg:C.success+"22",c:C.success},admin:{bg:C.accent+"22",c:C.accent},user:{bg:C.muted+"22",c:C.muted}};
  const st=m[s]||{bg:C.muted+"22",c:C.muted};
  return <span style={{background:st.bg,color:st.c,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{s}</span>;
}
function Stat({label,value,sub,color,C}){
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px",flex:1,minWidth:150,boxShadow:C.shadow}}>
    <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
    <div style={{fontSize:24,fontFamily:"Syne",fontWeight:800,color:color||C.accent}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{sub}</div>}
  </div>;
}
const iS=(C,ex={})=>({width:"100%",background:C.inputBg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.strong,fontSize:13,outline:"none",fontFamily:"DM Sans,sans-serif",boxSizing:"border-box",...ex});
function Inp({value,onChange,placeholder,type="text",min,max,C}){return <input type={type} value={value||""} min={min} max={max} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={iS(C)}/>;}
function Sel({value,onChange,options,C}){return <select value={value||""} onChange={e=>onChange(e.target.value)} style={iS(C)}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;}
function FRow({label,children,C}){return <div style={{marginBottom:11}}><label style={{fontSize:10,color:C.muted,display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:.7,fontWeight:700}}>{label}</label>{children}</div>;}
function Btn({children,onClick,C,sm,ghost,danger,disabled,full}){
  const bg=ghost?(danger?C.danger+"18":"transparent"):danger?C.danger:C.accent;
  const col=ghost?(danger?C.danger:C.muted):"#fff";
  const brd=ghost?`1px solid ${danger?C.danger+"55":C.border}`:"none";
  return <button onClick={onClick} disabled={disabled} style={{background:bg,color:col,border:brd,borderRadius:sm?7:9,padding:sm?"5px 12px":"9px 18px",fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontSize:sm?12:13.5,opacity:disabled?.4:1,fontFamily:"DM Sans",whiteSpace:"nowrap",width:full?"100%":"auto"}}>{children}</button>;
}
function Modal({title,onClose,children,C,wide,xlarge}){
  const w=xlarge?720:wide?560:440;
  return <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:12}} onClick={onClose}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:24,width:w,maxWidth:"97vw",maxHeight:"92vh",overflowY:"auto",boxShadow:C.shadow}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:C.strong}}>{title}</h3>
        <button onClick={onClose} style={{background:C.border,border:"none",color:C.muted,cursor:"pointer",borderRadius:6,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}
function Confirm({msg,onYes,onNo,C}){
  return <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:360,boxShadow:C.shadow}}>
      <div style={{fontSize:15,color:C.strong,marginBottom:20,lineHeight:1.5}}>{msg}</div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn C={C} ghost onClick={onNo}>Cancelar</Btn><Btn C={C} danger onClick={onYes}>Excluir</Btn></div>
    </div>
  </div>;
}
function MFoot({onClose,onSave,C,disabled,label="Salvar"}){return <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}><Btn C={C} ghost onClick={onClose}>Cancelar</Btn><Btn C={C} onClick={onSave} disabled={disabled}>{label}</Btn></div>;}
function ListEditor({title,items,setItems,C,onClose}){
  const [draft,setDraft]=useState("");
  return <Modal C={C} title={`Editar: ${title}`} onClose={onClose}>
    <div style={{display:"flex",gap:7,marginBottom:12}}><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&draft.trim()){setItems([...items,draft.trim()]);setDraft("");}}} placeholder="Novo item..." style={{...iS(C),flex:1}}/><Btn C={C} sm onClick={()=>{if(!draft.trim())return;setItems([...items,draft.trim()]);setDraft("");}}>Add</Btn></div>
    {items.map((it,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 11px",background:C.bg,borderRadius:8,marginBottom:6}}>
      <span style={{fontSize:13,color:C.strong}}>{it}</span>
      <button onClick={()=>setItems(items.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:14}}>✕</button>
    </div>)}
    <div style={{textAlign:"right",marginTop:10}}><Btn C={C} ghost onClick={onClose}>Fechar</Btn></div>
  </Modal>;
}
function Confetti({onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2600);return()=>clearTimeout(t);},[]);
  const items=Array.from({length:28},(_,i)=>({id:i,e:["🎉","🎊","✨","⭐","💰","🏆","🥳"][i%7],l:2+Math.random()*96,dl:Math.random()*.8,dur:1.5+Math.random()}));
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1000,overflow:"hidden"}}>{items.map(it=><div key={it.id} style={{position:"absolute",left:`${it.l}%`,top:-30,fontSize:22,animation:`cfDrop ${it.dur}s ${it.dl}s ease-in forwards`}}>{it.e}</div>)}</div>;
}
function Spinner({C}){return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,flexDirection:"column",gap:14}}><div style={{width:36,height:36,border:`3px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/><div style={{color:C.accent,fontFamily:"Syne",fontWeight:700,fontSize:13}}>Carregando...</div></div>;}

// ── Login ────────────────────────────────────────────────
function Login({onLogin,theme,toggleTheme,C}){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  async function attempt(){
    setLoading(true);setErr("");
    const {data,error}=await supabase.from("nd_users").select("*").eq("email",email).eq("password",pass).single();
    setLoading(false);
    if(error||!data){setErr("E-mail ou senha incorretos.");return;}
    onLogin(data);
  }
  return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Sans,sans-serif",padding:"20px"}}>
    <div style={{width:"100%",maxWidth:420,padding:"40px 20px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:24,boxShadow:C.shadow}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:52,height:52,borderRadius:14,background:"#6c63ff22",border:"2px solid #6c63ff44",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:22,color:C.strong}}>Natividade</div>
        <div style={{fontFamily:"Syne",fontWeight:700,fontSize:11,color:"#6c63ff",letterSpacing:2,marginTop:2}}>DIGITAL</div>
        <div style={{color:C.muted,fontSize:13,marginTop:10}}>Acesse o sistema</div>
      </div>
      {err&&<div style={{background:C.danger+"18",border:`1px solid ${C.danger}44`,color:C.danger,borderRadius:9,padding:"10px 14px",fontSize:13,marginBottom:16,textAlign:"center"}}>{err}</div>}
      <FRow C={C} label="E-mail"><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="email@empresa.com" style={iS(C)} onKeyDown={e=>e.key==="Enter"&&attempt()}/></FRow>
      <FRow C={C} label="Senha">
        <div style={{position:"relative"}}><input value={pass} onChange={e=>setPass(e.target.value)} type={show?"text":"password"} placeholder="••••••••" style={iS(C)} onKeyDown={e=>e.key==="Enter"&&attempt()}/>
          <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>{show?"🙈":"👁"}</button></div>
      </FRow>
      <div style={{marginTop:6,marginBottom:20}}/>
      <button onClick={attempt} disabled={loading} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"12px",fontWeight:700,cursor:"pointer",fontSize:15,fontFamily:"Syne",opacity:loading?.6:1}}>
        {loading?"Entrando...":"Entrar"}
      </button>
      <div style={{textAlign:"center",marginTop:20}}><button onClick={toggleTheme} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,fontFamily:"DM Sans"}}>{theme==="dark"?"☀️ Modo Claro":"🌙 Modo Escuro"}</button></div>
    </div>
  </div>;
}

// ── Dashboard ────────────────────────────────────────────
function Dashboard({clients,tasks,history,rec,pay,C}){
  const mrr=clients.filter(c=>c.status==="Ativo").reduce((a,c)=>a+activeMRR(c),0);
  const lateRec=rec.filter(f=>f.status==="Atrasado").reduce((a,f)=>a+Number(f.value),0);
  const pendPay=pay.filter(p=>p.status!=="Pago"&&p.status!=="Cancelado").reduce((a,p)=>a+Number(p.value),0);
  
  // Dados para gráfico mês a mês
  const monthMap={};
  rec.forEach(r=>{
    if(r.due){
      const month=r.due.slice(0,7);
      if(!monthMap[month]) monthMap[month]={receita:0,despesa:0};
      monthMap[month].receita+=Number(r.value);
    }
  });
  pay.forEach(p=>{
    if(p.due){
      const month=p.due.slice(0,7);
      if(!monthMap[month]) monthMap[month]={receita:0,despesa:0};
      monthMap[month].despesa+=Number(p.value);
    }
  });
  
  const months=Object.keys(monthMap).sort().slice(-12);
  const chartData={
    labels:months.map(m=>{const [y,mo]=m.split("-");return `${mo}/${y.slice(-2)}`;}),
    datasets:[
      {label:"Receita",data:months.map(m=>monthMap[m].receita),backgroundColor:C.blue+"40",borderColor:C.blue,borderWidth:2},
      {label:"Despesa",data:months.map(m=>monthMap[m].despesa),backgroundColor:C.warning+"40",borderColor:C.warning,borderWidth:2}
    ]
  };
  
  return <div>
    <h1 style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:C.strong,marginBottom:4}}>Dashboard</h1>
    <p style={{color:C.muted,fontSize:13,marginBottom:22}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:22}}>
      <Stat C={C} label="MRR" value={`R$ ${mrr.toLocaleString()}`} color={C.accent}/>
      <Stat C={C} label="Clientes Ativos" value={clients.filter(c=>c.status==="Ativo").length} color={C.blue}/>
      <Stat C={C} label="A Receber Atrasado" value={`R$ ${lateRec.toLocaleString()}`} color={C.danger}/>
      <Stat C={C} label="Contas a Pagar" value={`R$ ${pendPay.toLocaleString()}`} color={C.warning}/>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:22,boxShadow:C.shadow}}>
      <h3 style={{fontFamily:"Syne",fontWeight:700,fontSize:15,marginBottom:14,color:C.strong}}>Receita vs Despesa (últimos 12 meses)</h3>
      <div style={{height:300}}>
        <Bar data={chartData} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{y:{beginAtZero:true}}}} />
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,boxShadow:C.shadow}}>
        <h3 style={{fontFamily:"Syne",fontWeight:700,fontSize:15,marginBottom:14,color:C.strong}}>Tarefas Pendentes</h3>
        {tasks.filter(t=>!t.done).slice(0,5).map(t=>{const d=daysTo(t.due);return <div key={t.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:t.priority==="Alta"?C.danger:C.warning,flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.strong}}>{t.title}</div><div style={{fontSize:11,color:C.muted,marginTop:1}}>{t.client}</div></div>
          {d!==null&&<span style={{fontSize:11,fontWeight:700,color:d<0?C.danger:d<=2?C.warning:C.muted,background:(d<0?C.danger:d<=2?C.warning:C.muted)+"15",padding:"2px 8px",borderRadius:20}}>{d<0?`${Math.abs(d)}d atraso`:d===0?"Hoje":`${d}d`}</span>}
        </div>;})}
        {!tasks.filter(t=>!t.done).length&&<p style={{color:C.muted,fontSize:13}}>Sem pendências 🎉</p>}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,boxShadow:C.shadow}}>
        <h3 style={{fontFamily:"Syne",fontWeight:700,fontSize:15,marginBottom:14,color:C.strong}}>Últimos Atendimentos</h3>
        {history.slice(0,4).map(h=><div key={h.id} style={{padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:13,fontWeight:600,color:C.strong}}>{h.client}</span><span style={{fontSize:11,color:C.muted}}>{fmt(h.date)}</span></div>
          <div style={{fontSize:11,color:C.muted}}>{h.type} · {h.user_name} — {h.note?.slice(0,55)}...</div>
        </div>)}
        {!history.length&&<p style={{color:C.muted,fontSize:13}}>Sem atendimentos.</p>}
      </div>
    </div>
  </div>;
}

// ── Clientes ─────────────────────────────────────────────
const EMPTY_C=()=>({name:"",plan:"",status:"Ativo",since:"",contract_start:"",contract_end:"",value_schedule:[{from:"",value:"",tipo:"recorrente",parcelas:""}],recurring_day:"",tags:[],contact:"",phone:"",tagsStr:""});
function Clientes({clients,setClients,history,plans,setPlans,setRec,C}){
  const [sel,setSel]=useState(null);
  const [modal,setModal]=useState(null);
  const [planEd,setPlanEd]=useState(false);
  const [search,setSearch]=useState("");
  const [confirm,setConfirm]=useState(null);
  const [form,setForm]=useState(EMPTY_C());
  const ff=v=>setForm(p=>({...p,...v}));
  const updVS=(i,fk,v)=>ff({value_schedule:form.value_schedule.map((p,j)=>j===i?{...p,[fk]:v}:p)});

  function openNew(){setForm({...EMPTY_C(),plan:plans[0]||""});setModal("new");}
  function openEdit(c){setForm({...c,tagsStr:(c.tags||[]).join(", "),value_schedule:c.value_schedule?.length?c.value_schedule:[{from:"",value:"",tipo:"recorrente",parcelas:""}]});setModal("edit");}

  async function save(){
    const tags=form.tagsStr?form.tagsStr.split(",").map(t=>t.trim()).filter(Boolean):[];
    const vs=form.value_schedule.filter(p=>p.from&&p.value);
    const obj={id:modal==="new"?uid():form.id,name:form.name,plan:form.plan,status:form.status,since:form.since,contract_start:form.contract_start,contract_end:form.contract_end,value_schedule:vs,recurring_day:form.recurring_day,tags,contact:form.contact,phone:form.phone};
    if(modal==="new"){
      await supabase.from("nd_clients").insert(obj);
      setClients(p=>[...p,obj]);
      const rows=[];
      vs.forEach(p=>{
        const val=Number(p.value);
        if(p.tipo==="parcelado"&&p.parcelas>0){
          for(let i=0;i<Number(p.parcelas);i++){const due=addMonths(p.from,i);rows.push({id:uid(),client:form.name,value:val,status:"Pendente",due,paid:"",description:`Parcela ${i+1}/${p.parcelas}`});}
        } else {
          for(let i=0;i<12;i++){const due=addMonths(p.from,i);rows.push({id:uid(),client:form.name,value:val,status:"Pendente",due,paid:"",description:`Mensalidade ${new Date(due+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}`});}
        }
      });
      if(rows.length){await supabase.from("nd_rec").insert(rows);setRec(p=>[...p,...rows]);}
    } else {
      await supabase.from("nd_clients").update(obj).eq("id",obj.id);
      setClients(p=>p.map(c=>c.id===obj.id?obj:c));
      if(sel?.id===obj.id) setSel(obj);
    }
    setModal(null);
  }

  async function del(id){
    await supabase.from("nd_clients").delete().eq("id",id);
    setClients(p=>p.filter(c=>c.id!==id));
    setSel(null);setConfirm(null);
  }

  const list=clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));

  if(sel) return <div>
    <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",marginBottom:16,fontSize:13,display:"flex",alignItems:"center",gap:5}}>← Voltar</button>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22,boxShadow:C.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{width:48,height:48,borderRadius:12,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:18,color:C.accent,flexShrink:0}}>{sel.name[0]}</div>
          <div style={{flex:1}}><h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:C.strong}}>{sel.name}</h2>
            <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>{(sel.tags||[]).map(t=><span key={t} style={{background:C.border,color:C.muted,padding:"2px 8px",borderRadius:20,fontSize:11}}>{t}</span>)}</div>
          </div>
          <Badge s={sel.status} C={C}/>
          <Btn C={C} sm ghost onClick={()=>openEdit(sel)}>✏️ Editar</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["Plano",sel.plan],["MRR Atual",`R$ ${activeMRR(sel).toLocaleString()}`],["Contrato",`${fmt(sel.contract_start)} – ${fmt(sel.contract_end)}`],["Contato",sel.contact],["Telefone",sel.phone],["Cliente desde",fmt(sel.since)]].map(([k,v])=>
            <div key={k} style={{background:C.bg,borderRadius:9,padding:"10px 13px"}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:.7,marginBottom:2}}>{k}</div><div style={{fontSize:13,fontWeight:500,color:C.strong}}>{v||"—"}</div></div>
          )}
        </div>
        <div style={{marginTop:14}}><Btn C={C} sm ghost danger onClick={()=>setConfirm(sel.id)}>🗑 Excluir</Btn></div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22,boxShadow:C.shadow}}>
        <h3 style={{fontFamily:"Syne",fontWeight:700,marginBottom:14,color:C.strong,fontSize:14}}>Histórico</h3>
        {history.filter(h=>h.client===sel.name).map(h=><div key={h.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:600,color:C.accent}}>{h.type}</span><span style={{fontSize:11,color:C.muted}}>{fmt(h.date)}</span></div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{h.note}</div>
        </div>)}
        {!history.filter(h=>h.client===sel.name).length&&<p style={{color:C.muted,fontSize:13}}>Sem histórico.</p>}
      </div>
    </div>
    {modal&&<ClienteFormModal C={C} form={form} ff={ff} updVS={updVS} plans={plans} modal={modal} onClose={()=>setModal(null)} onSave={save}/>}
    {confirm&&<Confirm C={C} msg="Deseja realmente excluir este cliente?" onNo={()=>setConfirm(null)} onYes={()=>del(confirm)}/>}
  </div>;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h1 style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:C.strong}}>Clientes</h1><p style={{color:C.muted,fontSize:13,marginTop:3}}>{clients.length} cadastrados</p></div>
      <div style={{display:"flex",gap:8}}><Btn C={C} ghost sm onClick={()=>setPlanEd(true)}>✏️ Planos</Btn><Btn C={C} onClick={openNew}>+ Novo Cliente</Btn></div>
    </div>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente..." style={{...iS(C),marginBottom:14}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {list.map(c=><div key={c.id} onClick={()=>setSel(c)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"border-color .15s",boxShadow:C.shadow}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
        <div style={{width:40,height:40,borderRadius:10,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:15,color:C.accent,flexShrink:0}}>{c.name[0]}</div>
        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:C.strong}}>{c.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{c.contact}</div></div>
        <div style={{textAlign:"right",marginRight:8}}><div style={{fontFamily:"Syne",fontWeight:700,color:C.accent,fontSize:14,marginBottom:4}}>R$ {activeMRR(c).toLocaleString()}/mês</div><Badge s={c.status} C={C}/></div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",maxWidth:120,justifyContent:"flex-end"}}>{(c.tags||[]).map(t=><span key={t} style={{background:C.border,color:C.muted,padding:"2px 7px",borderRadius:20,fontSize:10}}>{t}</span>)}</div>
      </div>)}
    </div>
    {modal&&<ClienteFormModal C={C} form={form} ff={ff} updVS={updVS} plans={plans} modal={modal} onClose={()=>setModal(null)} onSave={save}/>}
    {planEd&&<ListEditor C={C} title="Planos" items={plans} setItems={async v=>{setPlans(v);await supabase.from("nd_config").upsert({key:"plans",value:v});}} onClose={()=>setPlanEd(false)}/>}
  </div>;
}
function ClienteFormModal({C,form,ff,updVS,plans,modal,onClose,onSave}){
  return <Modal C={C} title={modal==="new"?"Novo Cliente":"Editar Cliente"} onClose={onClose} xlarge>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={{gridColumn:"span 2"}}><FRow C={C} label="Nome da Empresa"><Inp C={C} value={form.name} onChange={v=>ff({name:v})} placeholder="Ex: Clínica ABC"/></FRow></div>
      <FRow C={C} label="Plano"><Sel C={C} value={form.plan} onChange={v=>ff({plan:v})} options={plans}/></FRow>
      <FRow C={C} label="Status"><Sel C={C} value={form.status} onChange={v=>ff({status:v})} options={["Ativo","Inadimplente","Churn"]}/></FRow>
      <FRow C={C} label="Cliente Desde"><Inp C={C} type="date" value={form.since} onChange={v=>ff({since:v})}/></FRow>
      <FRow C={C} label="Dia Venc. Recorrente"><Inp C={C} type="number" value={form.recurring_day} onChange={v=>ff({recurring_day:v})} placeholder="5" min="1" max="31"/></FRow>
      <FRow C={C} label="Início do Contrato"><Inp C={C} type="date" value={form.contract_start} onChange={v=>ff({contract_start:v})}/></FRow>
      <FRow C={C} label="Fim do Contrato"><Inp C={C} type="date" value={form.contract_end} onChange={v=>ff({contract_end:v})}/></FRow>
      <FRow C={C} label="Tags (vírgula)"><Inp C={C} value={form.tagsStr} onChange={v=>ff({tagsStr:v})} placeholder="Saúde, Meta Ads"/></FRow>
      <FRow C={C} label="E-mail"><Inp C={C} value={form.contact} onChange={v=>ff({contact:v})} placeholder="email@empresa.com"/></FRow>
      <div style={{gridColumn:"span 2"}}><FRow C={C} label="Telefone"><Inp C={C} value={form.phone} onChange={v=>ff({phone:v})} placeholder="(11) 99999-0000"/></FRow></div>
    </div>
    <div style={{margin:"8px 0",padding:12,background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:.7,fontWeight:700}}>Escalonamento de Valor</span>
        <Btn C={C} sm ghost onClick={()=>ff({value_schedule:[...form.value_schedule,{from:"",value:"",tipo:"recorrente",parcelas:""}]})}>+ Período</Btn>
      </div>
      {form.value_schedule.map((p,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1.2fr 0.8fr auto",gap:8,alignItems:"end",marginBottom:10,padding:10,background:C.surface,borderRadius:8,border:`1px solid ${C.border}`}}>
        <FRow C={C} label="A partir de"><Inp C={C} type="date" value={p.from} onChange={v=>updVS(i,"from",v)}/></FRow>
        <FRow C={C} label="Valor R$"><Inp C={C} type="number" value={p.value} onChange={v=>updVS(i,"value",v)} placeholder="2500"/></FRow>
        <FRow C={C} label="Tipo"><select value={p.tipo||"recorrente"} onChange={e=>updVS(i,"tipo",e.target.value)} style={iS(C)}><option value="recorrente">Recorrente</option><option value="parcelado">Parcelado</option></select></FRow>
        {p.tipo==="parcelado"?<FRow C={C} label="Parcelas"><Inp C={C} type="number" value={p.parcelas} onChange={v=>updVS(i,"parcelas",v)} placeholder="12" min="1"/></FRow>:<div style={{fontSize:11,color:C.muted,alignSelf:"center"}}>12 meses</div>}
        {form.value_schedule.length>1&&<button onClick={()=>ff({value_schedule:form.value_schedule.filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,alignSelf:"center",flexShrink:0,marginBottom:2}}>✕</button>}
      </div>)}
    </div>
    <MFoot C={C} onClose={onClose} onSave={onSave} disabled={!form.name}/>
  </Modal>;
}

// ── Funil ────────────────────────────────────────────────
function Funil({kanban,setKanban,stages,setStages,C}){
  const [dragging,setDragging]=useState(null);
  const [over,setOver]=useState(null);
  const [confetti,setConfetti]=useState(false);
  const [modal,setModal]=useState(false);
  const [stageEd,setStageEd]=useState(false);
  const [form,setForm]=useState({name:"",value:"",resp:"",stage:""});
  const SC={"Prospecção":C.muted,"Proposta Enviada":C.blue,"Negociação":C.warning,"Fechado":C.success};
  const getC=s=>SC[s]||C.accent;
  const total=stages.reduce((a,s)=>a+(kanban[s]||[]).reduce((b,c)=>b+Number(c.value),0),0);

  async function addCard(){
    if(!form.name)return;
    const st=form.stage||stages[0];
    const card={id:uid(),name:form.name,value:Number(form.value)||0,resp:form.resp,stage:st};
    await supabase.from("nd_kanban").insert(card);
    setKanban(p=>({...p,[st]:[...(p[st]||[]),card]}));
    setModal(false);setForm({name:"",value:"",resp:"",stage:stages[0]||""});
  }
  async function removeCard(id,stage){
    await supabase.from("nd_kanban").delete().eq("id",id);
    setKanban(p=>({...p,[stage]:(p[stage]||[]).filter(c=>c.id!==id)}));
  }
  async function drop(e,col){
    if(!dragging||dragging.col===col)return;
    if(dragging.col!=="Fechado"&&col==="Fechado") setConfetti(true);
    await supabase.from("nd_kanban").update({stage:col}).eq("id",dragging.card.id);
    setKanban(p=>{const n={...p};n[dragging.col]=(n[dragging.col]||[]).filter(c=>c.id!==dragging.card.id);n[col]=[...(n[col]||[]),{...dragging.card,stage:col}];return n;});
    setDragging(null);setOver(null);
  }
  async function saveStages(ns){
    setStages(ns);
    await supabase.from("nd_config").upsert({key:"stages",value:ns});
    setKanban(prev=>{const n={};ns.forEach(s=>{n[s]=prev[s]||[];});return n;});
  }

  return <div>
    {confetti&&<Confetti onDone={()=>setConfetti(false)}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h1 style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:C.strong}}>Funil de Vendas</h1>
        <p style={{color:C.muted,fontSize:13,marginTop:3}}>Pipeline: <span style={{color:C.accent,fontWeight:700}}>R$ {total.toLocaleString()}</span></p></div>
      <div style={{display:"flex",gap:8}}><Btn C={C} ghost sm onClick={()=>setStageEd(true)}>✏️ Etapas</Btn><Btn C={C} onClick={()=>{setForm({name:"",value:"",resp:"",stage:stages[0]||""});setModal(true);}}>+ Oportunidade</Btn></div>
    </div>
    <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:8,alignItems:"flex-start"}}>
      {stages.map(stage=><div key={stage} onDragOver={e=>{e.preventDefault();setOver(stage);}} onDrop={e=>drop(e,stage)}
        style={{minWidth:220,flex:1,background:C.card,border:`2px solid ${over===stage?getC(stage):C.border}`,borderRadius:16,padding:14,transition:"border-color .15s",boxShadow:C.shadow}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
          <span style={{fontFamily:"Syne",fontWeight:700,fontSize:12,color:getC(stage)}}>{stage}</span>
          <span style={{background:C.bg,borderRadius:20,padding:"2px 8px",fontSize:11,color:C.muted}}>{(kanban[stage]||[]).length}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7,minHeight:50,maxHeight:360,overflowY:"auto"}}>
          {(kanban[stage]||[]).map(card=><div key={card.id} draggable onDragStart={()=>setDragging({card,col:stage})}
            style={{background:C.bg,borderRadius:9,padding:"10px 12px",cursor:"grab",border:`1px solid ${C.border}`,position:"relative",transition:"transform .12s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <button onClick={e=>{e.stopPropagation();removeCard(card.id,stage);}} style={{position:"absolute",top:5,right:5,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,opacity:.4}}>✕</button>
            <div style={{fontWeight:600,fontSize:13,color:C.strong,paddingRight:14,marginBottom:4}}>{card.name}</div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.muted}}>👤 {card.resp}</span><span style={{fontSize:12,fontWeight:700,color:C.accent}}>R$ {Number(card.value).toLocaleString()}</span></div>
          </div>)}
        </div>
        <div style={{marginTop:9,fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`,paddingTop:8}}>Total: <strong style={{color:C.text}}>R$ {(kanban[stage]||[]).reduce((a,c)=>a+Number(c.value),0).toLocaleString()}</strong></div>
      </div>)}
    </div>
    {modal&&<Modal C={C} title="Nova Oportunidade" onClose={()=>setModal(false)}>
      <FRow C={C} label="Nome do Lead"><Inp C={C} value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Ex: Clínica ABC"/></FRow>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FRow C={C} label="Valor Estimado"><Inp C={C} type="number" value={form.value} onChange={v=>setForm(p=>({...p,value:v}))} placeholder="3000"/></FRow>
        <FRow C={C} label="Responsável"><Inp C={C} value={form.resp} onChange={v=>setForm(p=>({...p,resp:v}))} placeholder="Nome"/></FRow>
      </div>
      <FRow C={C} label="Etapa"><Sel C={C} value={form.stage} onChange={v=>setForm(p=>({...p,stage:v}))} options={stages}/></FRow>
      <MFoot C={C} onClose={()=>setModal(false)} onSave={addCard} disabled={!form.name}/>
    </Modal>}
    {stageEd&&<ListEditor C={C} title="Etapas do Funil" items={stages} setItems={saveStages} onClose={()=>setStageEd(false)}/>}
  </div>;
}

// ── Atendimentos ─────────────────────────────────────────
function Atendimentos({history,setHistory,clients,attTypes,setAttTypes,C}){
  const [modal,setModal]=useState(false);
  const [typeEd,setTypeEd]=useState(false);
  const [form,setForm]=useState({client:"",type:"",user_name:"",note:"",date:today(),time:""});
  const TC={"Reunião":C.blue,"E-mail":C.purple,"Ligação":C.warning,"WhatsApp":C.success,"Visita":C.accent};
  async function add(){
    if(!form.client||!form.note)return;
    const obj={...form,id:uid(),type:form.type||attTypes[0]};
    await supabase.from("nd_history").insert(obj);
    setHistory(p=>[obj,...p]);
    setModal(false);setForm({client:"",type:attTypes[0]||"",user_name:"",note:"",date:today(),time:""});
  }
  async function del(id){await supabase.from("nd_history").delete().eq("id",id);setHistory(p=>p.filter(x=>x.id!==id));}
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h1 style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:C.strong}}>Atendimentos</h1><p style={{color:C.muted,fontSize:13,marginTop:3}}>{history.length} registros</p></div>
      <div style={{display:"flex",gap:8}}><Btn C={C} ghost sm onClick={()=>setTypeEd(true)}>✏️ Tipos</Btn><Btn C={C} onClick={()=>{setForm({client:"",type:attTypes[0]||"",user_name:"",note:"",date:today(),time:""});setModal(true);}}>+ Registrar</Btn></div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {history.map(h=><div key={h.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:14,boxShadow:C.shadow,position:"relative"}}>
        <div style={{width:4,borderRadius:4,background:TC[h.type]||C.muted,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
            <span style={{fontWeight:700,fontSize:14,color:C.strong}}>{h.client}</span>
            <span style={{fontSize:12,color:C.muted}}>{fmt(h.date)}{h.time?` às ${h.time}`:""}</span>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:8}}>
            <span style={{background:(TC[h.type]||C.muted)+"20",color:TC[h.type]||C.muted,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600}}>{h.type}</span>
            <span style={{background:C.border,color:C.muted,padding:"2px 9px",borderRadius:20,fontSize:11}}>por {h.user_name}</span>
          </div>
          <p style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{h.note}</p>
        </div>
        <button onClick={()=>del(h.id)} style={{position:"absolute",top:10,right:12,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,opacity:.4}}>✕</button>
      </div>)}
    </div>
    {modal&&<Modal C={C} title="Registrar Atendimento" onClose={()=>setModal(false)} wide>
      <FRow C={C} label="Cliente"><select value={form.client} onChange={e=>setForm(p=>({...p,client:e.target.value}))} style={iS(C)}><option value="">Selecione...</option>{clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></FRow>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FRow C={C} label="Tipo"><Sel C={C} value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={attTypes}/></FRow>
        <FRow C={C} label="Responsável"><Inp C={C} value={form.user_name} onChange={v=>setForm(p=>({...p,user_name:v}))} placeholder="Nome"/></FRow>
        <FRow C={C} label="Data"><Inp C={C} type="date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))}/></FRow>
        <FRow C={C} label="Hora"><Inp C={C} type="time" value={form.time} onChange={v=>setForm(p=>({...p,time:v}))}/></FRow>
      </div>
      <FRow C={C} label="Observação"><textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Descreva o atendimento..." style={{...iS(C),minHeight:80,resize:"vertical"}}/></FRow>
      <MFoot C={C} onClose={()=>setModal(false)} onSave={add} disabled={!form.client||!form.note}/>
    </Modal>}
    {typeEd&&<ListEditor C={C} title="Tipos de Atendimento" items={attTypes} setItems={async v=>{setAttTypes(v);await supabase.from("nd_config").upsert({key:"att_types",value:v});}} onClose={()=>setTypeEd(false)}/>}
  </div>;
}

// ── Tarefas ──────────────────────────────────────────────
function Tarefas({tasks,setTasks,clients,C}){
  const [modal,setModal]=useState(false);
  const [alert,setAlert]=useState("");
  const [form,setForm]=useState({title:"",client:"",assignee:"",due:"",priority:"Média"});
  async function toggle(id,done){
    await supabase.from("nd_tasks").update({done:!done}).eq("id",id);
    setTasks(l=>l.map(t=>t.id===id?{...t,done:!done}:t));
  }
  async function add(){
    if(!form.title)return;
    if(form.due&&form.due<today()){setAlert("O prazo não pode ser inferior à data atual.");return;}
    const obj={...form,id:uid(),done:false};
    await supabase.from("nd_tasks").insert(obj);
    setTasks(p=>[...p,obj]);
    setModal(false);setForm({title:"",client:"",assignee:"",due:"",priority:"Média"});
  }
  async function del(id){await supabase.from("nd_tasks").delete().eq("id",id);setTasks(l=>l.filter(x=>x.id!==id));}
  const renderT=t=>{
    const d=daysTo(t.due),late=d!==null&&d<0&&!t.done;
    return <div key={t.id} style={{background:C.card,border:`1px solid ${late?C.danger:C.border}`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,opacity:t.done?.45:1,boxShadow:C.shadow}}>
      <div onClick={()=>toggle(t.id,t.done)} style={{width:19,height:19,borderRadius:5,border:`2px solid ${t.done?C.accent:C.border}`,background:t.done?C.accent:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{t.done&&<span style={{fontSize:10,color:"#fff",fontWeight:900}}>✓</span>}</div>
      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:C.strong,textDecoration:t.done?"line-through":"none"}}>{t.title}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{t.client||"—"} · {t.assignee||"—"}</div></div>
      {late&&<span style={{fontSize:11,fontWeight:700,background:C.danger+"22",color:C.danger,padding:"2px 9px",borderRadius:20,animation:"blink 1.2s ease-in-out infinite"}}>⚠ {Math.abs(d)}d atraso</span>}
      {!late&&d!==null&&!t.done&&<span style={{fontSize:11,fontWeight:600,background:(d<=2?C.warning:C.muted)+"18",color:d<=2?C.warning:C.muted,padding:"2px 9px",borderRadius:20}}>{d===0?"Hoje":`${d}d`}</span>}
      <Badge s={t.priority} C={C}/>
      <button onClick={()=>del(t.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,opacity:.4}}>✕</button>
    </div>;
  };
  const pending=tasks.filter(t=>!t.done),done=tasks.filter(t=>t.done);
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h1 style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:C.strong}}>Tarefas</h1><p style={{color:C.muted,fontSize:13,marginTop:3}}>{pending.length} pendentes · {done.length} concluídas</p></div>
      <Btn C={C} onClick={()=>setModal(true)}>+ Nova Tarefa</Btn>
    </div>
    <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:9}}>Pendentes</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>{pending.map(renderT)}</div>
    {!pending.length&&<p style={{color:C.muted,fontSize:13,marginBottom:20}}>Nenhuma pendência 🎉</p>}
    {!!done.length&&<><div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:9}}>Concluídas</div><div style={{display:"flex",flexDirection:"column",gap:8}}>{done.map(renderT)}</div></>}
    {modal&&<Modal C={C} title="Nova Tarefa" onClose={()=>setModal(false)} wide>
      {alert&&<div style={{background:C.danger+"18",border:`1px solid ${C.danger}44`,color:C.danger,borderRadius:9,padding:"9px 12px",fontSize:13,marginBottom:10}}>{alert}</div>}
      <FRow C={C} label="Título"><Inp C={C} value={form.title} onChange={v=>setForm(p=>({...p,title:v}))} placeholder="Ex: Criar criativos"/></FRow>
      <FRow C={C} label="Cliente"><select value={form.client} onChange={e=>setForm(p=>({...p,client:e.target.value}))} style={iS(C)}><option value="">Selecione...</option>{clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></FRow>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FRow C={C} label="Responsável"><Inp C={C} value={form.assignee} onChange={v=>setForm(p=>({...p,assignee:v}))} placeholder="Nome"/></FRow>
        <FRow C={C} label="Prazo"><Inp C={C} type="date" value={form.due} min={today()} onChange={v=>{setAlert("");setForm(p=>({...p,due:v}));}}/></FRow>
      </div>
      <FRow C={C} label="Prioridade"><Sel C={C} value={form.priority} onChange={v=>setForm(p=>({...p,priority:v}))} options={["Alta","Média","Baixa"]}/></FRow>
      <MFoot C={C} onClose={()=>setModal(false)} onSave={add} disabled={!form.title}/>
    </Modal>}
  </div>;
}

// ── Financeiro ───────────────────────────────────────────
function Financeiro({rec,setRec,pay,setPay,clients,C}){
  const [tab,setTab]=useState("receber");
  const [modal,setModal]=useState(null);
  const [editItem,setEditItem]=useState(null);
  const [baixaModal,setBaixaModal]=useState(null);
  const [baixaDate,setBaixaDate]=useState(today());
  const [confirm,setConfirm]=useState(null);
  const [formR,setFormR]=useState({client:"",value:"",due:"",description:""});
  const [formP,setFormP]=useState({description:"",supplier:"",value:"",category:"",due:""});
  const [search,setSearch]=useState("");
  const [sortOrder,setSortOrder]=useState("asc");

  useEffect(()=>{
    const t=today();
    const upd=async(tbl,setFn,list)=>{
      const ids=list.filter(f=>f.status==="Pendente"&&f.due&&f.due<t).map(f=>f.id);
      if(ids.length){await supabase.from(tbl).update({status:"Atrasado"}).in("id",ids);setFn(p=>p.map(f=>ids.includes(f.id)?{...f,status:"Atrasado"}:f));}
    };
    upd("nd_rec",setRec,rec);upd("nd_pay",setPay,pay);
  },[]);

  async function confirmBaixa(){
    const tbl=baixaModal.tipo==="rec"?"nd_rec":"nd_pay";
    await supabase.from(tbl).update({status:"Pago",paid:baixaDate}).eq("id",baixaModal.id);
    if(baixaModal.tipo==="rec") setRec(p=>p.map(f=>f.id===baixaModal.id?{...f,status:"Pago",paid:baixaDate}:f));
    else setPay(p=>p.map(f=>f.id===baixaModal.id?{...f,status:"Pago",paid:baixaDate}:f));
    setBaixaModal(null);
  }
  async function saveEdit(){
    const tbl=editItem._tipo==="rec"?"nd_rec":"nd_pay";
    const {_tipo,...obj}=editItem;
    obj.value=Number(obj.value);
    await supabase.from(tbl).update(obj).eq("id",obj.id);
    if(_tipo==="rec") setRec(p=>p.map(f=>f.id===obj.id?obj:f));
    else setPay(p=>p.map(f=>f.id===obj.id?obj:f));
    setEditItem(null);
  }
  async function delItem(){
    const tbl=confirm.tipo==="rec"?"nd_rec":"nd_pay";
    await supabase.from(tbl).delete().eq("id",confirm.id);
    if(confirm.tipo==="rec") setRec(p=>p.filter(x=>x.id!==confirm.id));
    else setPay(p=>p.filter(x=>x.id!==confirm.id));
    setConfirm(null);
  }

  const paidRec=rec.filter(f=>f.status==="Pago").reduce((a,f)=>a+Number(f.value),0);
  const lateRec=rec.filter(f=>f.status==="Atrasado").reduce((a,f)=>a+Number(f.value),0);
  const pendPay=pay.filter(f=>f.status!=="Pago"&&f.status!=="Cancelado").reduce((a,f)=>a+Number(f.value),0);
  const paidPay=pay.filter(f=>f.status==="Pago").reduce((a,f)=>a+Number(f.value),0);
  const sColor=s=>s==="Pago"?C.success:s==="Atrasado"?C.danger:C.warning;
  const TabBtn=({id,label})=><button onClick={()=>setTab(id)} style={{padding:"8px 20px",borderRadius:9,border:"none",background:tab===id?C.accent:"transparent",color:tab===id?"#fff":C.muted,cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"DM Sans",transition:"all .15s"}}>{label}</button>;

  const sortedAndFiltered=(data)=>{
    let filtered=data.filter(f=>{
      const s=search.toLowerCase();
      if(tab==="receber") return f.client.toLowerCase().includes(s)||(f.description||"").toLowerCase().includes(s);
      return f.description.toLowerCase().includes(s)||f.supplier.toLowerCase().includes(s);
    });
    filtered.sort((a,b)=>(sortOrder==="asc"?1:-1)*a.due.localeCompare(b.due));
    return filtered;
  };

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h1 style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:C.strong}}>Financeiro</h1>
      <Btn C={C} onClick={()=>setModal(tab==="receber"?"rec":"pay")}>{tab==="receber"?"+ A Receber":"+ A Pagar"}</Btn>
    </div>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:18}}>
      {tab==="receber"?<><Stat C={C} label="Recebido" value={`R$ ${paidRec.toLocaleString()}`} color={C.success}/><Stat C={C} label="Atrasado" value={`R$ ${lateRec.toLocaleString()}`} color={C.danger}/><Stat C={C} label="Total Esperado" value={`R$ ${rec.filter(f=>f.status!=="Cancelado").reduce((a,f)=>a+Number(f.value),0).toLocaleString()}`} color={C.accent}/></>
      :<><Stat C={C} label="Pago" value={`R$ ${paidPay.toLocaleString()}`} color={C.success}/><Stat C={C} label="Pendente" value={`R$ ${pendPay.toLocaleString()}`} color={C.warning}/></>}
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"4px 6px",display:"inline-flex",gap:4,marginBottom:16}}>
      <TabBtn id="receber" label="Contas a Receber"/><TabBtn id="pagar" label="Contas a Pagar"/>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{...iS(C),flex:1,minWidth:250}}/>
      <button onClick={()=>setSortOrder(o=>o==="asc"?"desc":"asc")} style={{background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"9px 16px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"DM Sans"}}>📅 {sortOrder==="asc"?"Crescente":"Decrescente"}</button>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden",boxShadow:C.shadow}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:C.bg}}>
          {(tab==="receber"?["Cliente","Descrição","Valor","Vencimento","Pagamento","Status","Ações"]:["Descrição","Fornecedor","Valor","Vencimento","Pagamento","Status","Ações"]).map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:.7,fontWeight:700}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {tab==="receber"&&sortedAndFiltered(rec).map((f,i)=><tr key={f.id} style={{borderTop:`1px solid ${C.border}`,background:i%2===0?"transparent":C.stripe}}>
            <td style={{padding:"11px 14px",fontWeight:600,fontSize:13,color:C.strong}}>{f.client}</td>
            <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{f.description||"—"}</td>
            <td style={{padding:"11px 14px",color:C.accent,fontFamily:"Syne",fontWeight:700,fontSize:13}}>R$ {Number(f.value).toLocaleString()}</td>
            <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{fmt(f.due)}</td>
            <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{f.paid?fmt(f.paid):"—"}</td>
            <td style={{padding:"11px 14px"}}><span style={{background:sColor(f.status)+"20",color:sColor(f.status),padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700}}>{f.status}</span></td>
            <td style={{padding:"11px 14px"}}><div style={{display:"flex",gap:5}}>{f.status!=="Pago"&&<Btn C={C} sm onClick={()=>{setBaixaDate(today());setBaixaModal({id:f.id,tipo:"rec"});}}>Baixar</Btn>}<Btn C={C} sm ghost onClick={()=>setEditItem({...f,_tipo:"rec"})}>✏️</Btn><button onClick={()=>setConfirm({id:f.id,tipo:"rec"})} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:14,opacity:.7}}>🗑</button></div></td>
          </tr>)}
          {tab==="pagar"&&sortedAndFiltered(pay).map((f,i)=><tr key={f.id} style={{borderTop:`1px solid ${C.border}`,background:i%2===0?"transparent":C.stripe}}>
            <td style={{padding:"11px 14px",fontWeight:600,fontSize:13,color:C.strong}}>{f.description}</td>
            <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{f.supplier}</td>
            <td style={{padding:"11px 14px",color:C.warning,fontFamily:"Syne",fontWeight:700,fontSize:13}}>R$ {Number(f.value).toLocaleString()}</td>
            <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{fmt(f.due)}</td>
            <td style={{padding:"11px 14px",fontSize:12,color:C.muted}}>{f.paid?fmt(f.paid):"—"}</td>
            <td style={{padding:"11px 14px"}}><span style={{background:sColor(f.status)+"20",color:sColor(f.status),padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700}}>{f.status}</span></td>
            <td style={{padding:"11px 14px"}}><div style={{display:"flex",gap:5}}>{f.status!=="Pago"&&<Btn C={C} sm onClick={()=>{setBaixaDate(today());setBaixaModal({id:f.id,tipo:"pay"});}}>Baixar</Btn>}<Btn C={C} sm ghost onClick={()=>setEditItem({...f,_tipo:"pay"})}>✏️</Btn><button onClick={()=>setConfirm({id:f.id,tipo:"pay"})} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:14,opacity:.7}}>🗑</button></div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {confirm&&<Confirm C={C} msg="Deseja realmente excluir este lançamento?" onNo={()=>setConfirm(null)} onYes={delItem}/>}
    {baixaModal&&<Modal C={C} title="Confirmar Baixa" onClose={()=>setBaixaModal(null)}>
      <p style={{color:C.text,fontSize:13,marginBottom:14}}>Informe a data de pagamento:</p>
      <FRow C={C} label="Data da Baixa"><Inp C={C} type="date" value={baixaDate} onChange={v=>setBaixaDate(v)}/></FRow>
      <MFoot C={C} onClose={()=>setBaixaModal(null)} onSave={confirmBaixa} label="Confirmar" disabled={!baixaDate}/>
    </Modal>}
    {editItem&&<Modal C={C} title="Editar Lançamento" onClose={()=>setEditItem(null)} wide>
      {editItem._tipo==="rec"?<>
        <FRow C={C} label="Cliente"><select value={editItem.client} onChange={e=>setEditItem(p=>({...p,client:e.target.value}))} style={iS(C)}><option value="">Selecione...</option>{clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></FRow>
        <FRow C={C} label="Descrição"><Inp C={C} value={editItem.description} onChange={v=>setEditItem(p=>({...p,description:v}))}/></FRow>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FRow C={C} label="Valor R$"><Inp C={C} type="number" value={editItem.value} onChange={v=>setEditItem(p=>({...p,value:v}))}/></FRow>
          <FRow C={C} label="Vencimento"><Inp C={C} type="date" value={editItem.due} onChange={v=>setEditItem(p=>({...p,due:v}))}/></FRow>
          <FRow C={C} label="Status"><Sel C={C} value={editItem.status} onChange={v=>setEditItem(p=>({...p,status:v}))} options={["Pendente","Pago","Atrasado","Cancelado"]}/></FRow>
        </div>
      </>:<>
        <FRow C={C} label="Descrição"><Inp C={C} value={editItem.description} onChange={v=>setEditItem(p=>({...p,description:v}))}/></FRow>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FRow C={C} label="Fornecedor"><Inp C={C} value={editItem.supplier} onChange={v=>setEditItem(p=>({...p,supplier:v}))}/></FRow>
          <FRow C={C} label="Categoria"><Inp C={C} value={editItem.category} onChange={v=>setEditItem(p=>({...p,category:v}))}/></FRow>
          <FRow C={C} label="Valor R$"><Inp C={C} type="number" value={editItem.value} onChange={v=>setEditItem(p=>({...p,value:v}))}/></FRow>
          <FRow C={C} label="Vencimento"><Inp C={C} type="date" value={editItem.due} onChange={v=>setEditItem(p=>({...p,due:v}))}/></FRow>
          <FRow C={C} label="Status"><Sel C={C} value={editItem.status} onChange={v=>setEditItem(p=>({...p,status:v}))} options={["Pendente","Pago","Atrasado","Cancelado"]}/></FRow>
        </div>
      </>}
      <MFoot C={C} onClose={()=>setEditItem(null)} onSave={saveEdit}/>
    </Modal>}
    {modal==="rec"&&<Modal C={C} title="Nova Conta a Receber" onClose={()=>setModal(null)} wide>
      <FRow C={C} label="Cliente"><select value={formR.client} onChange={e=>setFormR(p=>({...p,client:e.target.value}))} style={iS(C)}><option value="">Selecione...</option>{clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></FRow>
      <FRow C={C} label="Descrição"><Inp C={C} value={formR.description} onChange={v=>setFormR(p=>({...p,description:v}))} placeholder="Ex: Mensalidade Mar/25"/></FRow>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FRow C={C} label="Valor R$"><Inp C={C} type="number" value={formR.value} onChange={v=>setFormR(p=>({...p,value:v}))} placeholder="2500"/></FRow>
        <FRow C={C} label="Vencimento"><Inp C={C} type="date" value={formR.due} onChange={v=>setFormR(p=>({...p,due:v}))}/></FRow>
      </div>
      <MFoot C={C} onClose={()=>setModal(null)} onSave={async()=>{if(!formR.client||!formR.value)return;const obj={...formR,id:uid(),value:Number(formR.value),status:"Pendente",paid:""};await supabase.from("nd_rec").insert(obj);setRec(p=>[...p,obj]);setModal(null);setFormR({client:"",value:"",due:"",description:""}); }} disabled={!formR.client||!formR.value}/>
    </Modal>}
    {modal==="pay"&&<Modal C={C} title="Nova Conta a Pagar" onClose={()=>setModal(null)} wide>
      <FRow C={C} label="Descrição"><Inp C={C} value={formP.description} onChange={v=>setFormP(p=>({...p,description:v}))} placeholder="Ex: Servidor Cloud"/></FRow>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FRow C={C} label="Fornecedor"><Inp C={C} value={formP.supplier} onChange={v=>setFormP(p=>({...p,supplier:v}))} placeholder="Ex: AWS"/></FRow>
        <FRow C={C} label="Categoria"><Inp C={C} value={formP.category} onChange={v=>setFormP(p=>({...p,category:v}))} placeholder="Ex: Infra"/></FRow>
        <FRow C={C} label="Valor R$"><Inp C={C} type="number" value={formP.value} onChange={v=>setFormP(p=>({...p,value:v}))} placeholder="450"/></FRow>
        <FRow C={C} label="Vencimento"><Inp C={C} type="date" value={formP.due} onChange={v=>setFormP(p=>({...p,due:v}))}/></FRow>
      </div>
      <MFoot C={C} onClose={()=>setModal(null)} onSave={async()=>{if(!formP.description||!formP.value)return;const obj={...formP,id:uid(),value:Number(formP.value),status:"Pendente",paid:""};await supabase.from("nd_pay").insert(obj);setPay(p=>[...p,obj]);setModal(null);setFormP({description:"",supplier:"",value:"",category:"",due:""});}} disabled={!formP.description||!formP.value}/>
    </Modal>}
  </div>;
}

// ── Usuários ─────────────────────────────────────────────
function Usuarios({users,setUsers,C}){
  const [modal,setModal]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"user",permissions:["Dashboard"]});
  const [showPass,setShowPass]=useState(false);
  const ff=v=>setForm(p=>({...p,...v}));
  function togglePerm(page){setForm(p=>({...p,permissions:p.permissions.includes(page)?p.permissions.filter(x=>x!==page):[...p.permissions,page]}));}
  async function save(){
    const obj={...form,id:modal==="new"?uid():form.id};
    if(modal==="new"){await supabase.from("nd_users").insert(obj);setUsers(p=>[...p,obj]);}
    else{await supabase.from("nd_users").update(obj).eq("id",obj.id);setUsers(p=>p.map(u=>u.id===obj.id?obj:u));}
    setModal(null);
  }
  async function del(id){await supabase.from("nd_users").delete().eq("id",id);setUsers(p=>p.filter(x=>x.id!==id));setConfirm(null);}
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h1 style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:C.strong}}>Usuários</h1><p style={{color:C.muted,fontSize:13,marginTop:3}}>{users.length} cadastrados</p></div>
      <Btn C={C} onClick={()=>{setForm({name:"",email:"",password:"",role:"user",permissions:["Dashboard"]});setModal("new");}}>+ Novo Usuário</Btn>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {users.map(u=><div key={u.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,boxShadow:C.shadow}}>
        <div style={{width:40,height:40,borderRadius:10,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:15,color:C.accent,flexShrink:0}}>{u.name[0]}</div>
        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:C.strong}}>{u.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{u.email}</div></div>
        <Badge s={u.role} C={C}/>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",maxWidth:220,justifyContent:"flex-end"}}>{(u.permissions||[]).map(p=><span key={p} style={{background:C.border,color:C.muted,padding:"2px 7px",borderRadius:20,fontSize:10}}>{p}</span>)}</div>
        <Btn C={C} sm ghost onClick={()=>{setForm({...u});setModal("edit");}}>✏️</Btn>
        <button onClick={()=>setConfirm(u.id)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:14,opacity:.6}}>🗑</button>
      </div>)}
    </div>
    {confirm&&<Confirm C={C} msg="Deseja realmente excluir este usuário?" onNo={()=>setConfirm(null)} onYes={()=>del(confirm)}/>}
    {modal&&<Modal C={C} title={modal==="new"?"Novo Usuário":"Editar Usuário"} onClose={()=>setModal(null)} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FRow C={C} label="Nome"><Inp C={C} value={form.name} onChange={v=>ff({name:v})} placeholder="Nome completo"/></FRow>
        <FRow C={C} label="Perfil"><Sel C={C} value={form.role} onChange={v=>ff({role:v})} options={["admin","user"]}/></FRow>
      </div>
      <FRow C={C} label="E-mail"><Inp C={C} value={form.email} onChange={v=>ff({email:v})} placeholder="email@empresa.com"/></FRow>
      <FRow C={C} label="Senha"><div style={{position:"relative"}}><input value={form.password||""} onChange={e=>ff({password:e.target.value})} type={showPass?"text":"password"} placeholder="••••••••" style={iS(C)}/><button onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>{showPass?"🙈":"👁"}</button></div></FRow>
      <FRow C={C} label="Permissões">
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:5}}>
          {ALL_PAGES.map(page=>{const on=(form.permissions||[]).includes(page);return <button key={page} onClick={()=>togglePerm(page)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${on?C.accent:C.border}`,background:on?C.accentDim:"transparent",color:on?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:on?700:400}}>{page}</button>;})}
        </div>
      </FRow>
      <MFoot C={C} onClose={()=>setModal(null)} onSave={save} disabled={!form.name||!form.email}/>
    </Modal>}
  </div>;
}

// ── Nav ──────────────────────────────────────────────────
const NAV=[
  {id:"Dashboard",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>},
  {id:"Clientes",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
  {id:"Funil",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>},
  {id:"Atendimentos",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
  {id:"Tarefas",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>},
  {id:"Financeiro",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
  {id:"Usuários",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>},
];

// ── App ──────────────────────────────────────────────────
export default function App(){
  const [theme,setTheme]=useState(()=>localStorage.getItem("nd:theme")||"dark");
  const [user,setUser]=useState(()=>{try{const r=localStorage.getItem("nd:session");return r?JSON.parse(r):null;}catch{return null;}});
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [active,setActive]=useState("Dashboard");
  const [loading,setLoading]=useState(true);
  const [clients,setClients]=useState([]);
  const [kanban,setKanban]=useState({});
  const [stages,setStages]=useState([]);
  const [history,setHistory]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [rec,setRec]=useState([]);
  const [pay,setPay]=useState([]);
  const [users,setUsers]=useState([]);
  const [plans,setPlans]=useState([]);
  const [attTypes,setAttTypes]=useState([]);
  const C=TH[theme];

  useEffect(()=>{
    if(!user){setLoading(false);return;}
    (async()=>{
      setLoading(true);
      const [c,k,h,t,r,p,u,cfg]=await Promise.all([
        supabase.from("nd_clients").select("*"),
        supabase.from("nd_kanban").select("*"),
        supabase.from("nd_history").select("*").order("date",{ascending:false}),
        supabase.from("nd_tasks").select("*"),
        supabase.from("nd_rec").select("*").order("due"),
        supabase.from("nd_pay").select("*").order("due"),
        supabase.from("nd_users").select("*"),
        supabase.from("nd_config").select("*"),
      ]);
      setClients(c.data||[]);
      const st=(cfg.data?.find(x=>x.key==="stages")?.value)||["Prospecção","Proposta Enviada","Negociação","Fechado"];
      setStages(st);
      const kb={};st.forEach(s=>{kb[s]=(k.data||[]).filter(x=>x.stage===s);});
      setKanban(kb);
      setHistory(h.data||[]);
      setTasks(t.data||[]);
      setRec(r.data||[]);
      setPay(p.data||[]);
      setUsers(u.data||[]);
      setPlans((cfg.data?.find(x=>x.key==="plans")?.value)||["Starter","Pro","Enterprise","Personalizado"]);
      setAttTypes((cfg.data?.find(x=>x.key==="att_types")?.value)||["Reunião","E-mail","Ligação","WhatsApp","Visita"]);
      setLoading(false);
    })();
  },[user]);

  useEffect(()=>localStorage.setItem("nd:theme",theme),[theme]);
  useEffect(()=>{if(user) localStorage.setItem("nd:session",JSON.stringify(user)); else localStorage.removeItem("nd:session");},[user]);

  const toggleTheme=()=>setTheme(t=>t==="dark"?"light":"dark");

  if(!user) return <Login C={C} theme={theme} toggleTheme={toggleTheme} onLogin={u=>setUser(u)}/>;
  if(loading) return <Spinner C={C}/>;

  const perms=user.permissions||ALL_PAGES;
  const visibleNav=NAV.filter(n=>perms.includes(n.id));

  const pages={
    Dashboard:<Dashboard C={C} clients={clients} tasks={tasks} history={history} rec={rec} pay={pay}/>,
    Clientes:<Clientes C={C} clients={clients} setClients={setClients} history={history} plans={plans} setPlans={setPlans} setRec={setRec}/>,
    Funil:<Funil C={C} kanban={kanban} setKanban={setKanban} stages={stages} setStages={setStages}/>,
    Atendimentos:<Atendimentos C={C} history={history} setHistory={setHistory} clients={clients} attTypes={attTypes} setAttTypes={setAttTypes}/>,
    Tarefas:<Tarefas C={C} tasks={tasks} setTasks={setTasks} clients={clients}/>,
    Financeiro:<Financeiro C={C} rec={rec} setRec={setRec} pay={pay} setPay={setPay} clients={clients}/>,
    Usuários:<Usuarios C={C} users={users} setUsers={setUsers}/>,
  };

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      html,body,#root{height:100%;width:100%;}
      body{font-family:'DM Sans',sans-serif;background:${C.bg};overflow:hidden;}
      ::-webkit-scrollbar{width:4px;height:4px;}
      ::-webkit-scrollbar-thumb{background:#2d3748;border-radius:4px;}
      select option{background:#1e293b;color:#e2e8f0;}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes cfDrop{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:.45}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
      .page{animation:fadeUp .2s ease;}
      @media(max-width:768px){
        body{font-size:14px;}
        h1{font-size:20px !important;}
        h2{font-size:18px !important;}
        h3{font-size:15px !important;}
        button{font-size:12px !important;padding:6px 12px !important;}
        input,select,textarea{font-size:13px !important;padding:8px 10px !important;}
        table{font-size:12px !important;}
        td,th{padding:8px 10px !important;}
        div{font-size:13px !important;}
      }
    `}</style>
    <div style={{display:"flex",height:"100vh",width:"100vw",overflow:"hidden",background:C.bg,color:C.text}}>
      <div style={{width:sidebarOpen?220:0,minWidth:0,background:C.sidebar,borderRight:`1px solid ${C.sidebarBorder}`,display:"flex",flexDirection:"column",height:"100vh",transition:"width .2s",overflow:"hidden"}}>
        <div style={{padding:"20px 18px 16px",borderBottom:`1px solid ${C.sidebarBorder}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:8,background:"#6c63ff22",border:"1.5px solid #6c63ff44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div><div style={{fontFamily:"Syne",fontWeight:800,fontSize:14,color:"#f1f5f9",lineHeight:1.2}}>Natividade</div><div style={{fontFamily:"Syne",fontWeight:700,fontSize:9,color:"#6c63ff",letterSpacing:2}}>DIGITAL</div></div>
          </div>
        </div>
        <nav style={{flex:1,padding:"10px",overflowY:"auto"}}>
          {visibleNav.map(item=>{const on=active===item.id;return <button key={item.id} onClick={()=>setActive(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:on?"#6c63ff22":"transparent",border:"none",borderRadius:9,color:on?"#a8a3ff":"#5a6a7e",cursor:"pointer",textAlign:"left",fontSize:13.5,fontWeight:on?600:400,marginBottom:2,fontFamily:"DM Sans",transition:"all .12s"}}><span style={{color:on?"#a8a3ff":"#3d4f63",flexShrink:0}}>{item.icon}</span>{item.id}</button>;})}
        </nav>
        <div style={{padding:"12px 10px",borderTop:`1px solid ${C.sidebarBorder}`}}>
          <button onClick={toggleTheme} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"8px 12px",background:"#ffffff08",border:"1px solid #ffffff10",borderRadius:9,color:"#7a8a9e",cursor:"pointer",marginBottom:10,fontSize:12,fontFamily:"DM Sans"}}>
            {theme==="dark"?"☀️ Modo Claro":"🌙 Modo Escuro"}
          </button>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:7,background:"#6c63ff22",display:"flex",alignItems:"center",justifyContent:"center",color:"#a8a3ff",fontWeight:800,fontFamily:"Syne",fontSize:12,flexShrink:0}}>{user.name[0]}</div>
              <div><div style={{fontSize:12,fontWeight:600,color:"#c8d0de"}}>{user.name}</div><div style={{fontSize:10,color:"#3d4f63"}}>{user.role}</div></div>
            </div>
            <button onClick={()=>setUser(null)} title="Sair" style={{background:"none",border:"none",color:"#4b5a72",cursor:"pointer",fontSize:16}}>⏏</button>
          </div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
          <button onClick={()=>setSidebarOpen(s=>!s)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>☰</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"28px max(20px, calc((100vw - 1200px) / 2))",minWidth:0}}>
        <div className="page" key={active}>{pages[active]}</div>
      </div>
      </div>
    </div>
  </>;
}