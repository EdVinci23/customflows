import { getStore } from "@netlify/blobs";

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
  });
}
function clean(v=""){
  return String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);
}
function siteOrigin(req){
  const proto=req.headers.get("x-forwarded-proto")||"https";
  const host=req.headers.get("x-forwarded-host")||req.headers.get("host");
  if(host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}
export default async (req)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204});
  if(req.method!=="POST")return json({error:"Use POST."},405);
  try{
    const body=await req.json();
    const slug=clean(body.slug);
    const name=String(body.name||"Minha Solução").slice(0,160);
    const html=String(body.html||"");
    const editKey=String(body.editKey||"");
    if(!slug)return json({error:"Slug inválido."},400);
    if(!html.toLowerCase().includes("<html"))return json({error:"HTML público inválido."},400);
    if(editKey.length<24)return json({error:"Chave de edição inválida."},400);
    const bytes=new TextEncoder().encode(html).byteLength;
    if(bytes>4800000)return json({error:"Página pública acima de 4,8 MB."},413);
    const pages=getStore({name:"customflows-public-pages",consistency:"strong"});
    const keys=getStore({name:"customflows-publication-keys",consistency:"strong"});
    const saved=await keys.get(slug,{consistency:"strong"});
    if(saved && saved!==editKey)return json({error:"Este endereço já pertence a outra publicação. Escolha outro nome."},409);
    if(!saved)await keys.set(slug,editKey);
    await pages.set(slug,html,{metadata:{name,updatedAt:new Date().toISOString(),bytes}});
    return json({ok:true,slug,name,url:`${siteOrigin(req)}/s/${slug}`});
  }catch(e){
    console.error(e);
    return json({error:e?.message||"Erro interno."},500);
  }
};