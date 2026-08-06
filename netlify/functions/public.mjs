import { getStore } from "@netlify/blobs";
function clean(v=""){return String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80)}
function getSlug(req){
  const url=new URL(req.url);let raw=url.searchParams.get("slug")||"";
  if(!raw||raw===":splat"||raw==="splat"){
    const candidates=[req.headers.get("x-nf-request-path"),req.headers.get("x-forwarded-uri"),req.headers.get("x-original-uri"),req.headers.get("referer")].filter(Boolean);
    for(const candidate of candidates){const m=String(candidate).match(/\/s\/([^/?#]+)/);if(m){raw=m[1];break}}
  }
  try{raw=decodeURIComponent(raw)}catch(e){}
  return clean(raw);
}
export default async(req)=>{
  try{
    const slug=getSlug(req);
    if(!slug)return new Response("Link inválido: o Netlify não repassou o nome da solução para a Function.",{status:400,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
    const pages=getStore({name:"customflows-public-pages",consistency:"strong"});
    const html=await pages.get(slug,{consistency:"strong"});
    if(html===null)return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Solução não encontrada</title></head><body style="font-family:Arial,sans-serif;padding:40px"><h1>Solução não encontrada</h1><p>Slug recebido: <b>${slug}</b></p><p>Publique esta solução novamente pelo CustomFlows.</p></body></html>`,{status:404,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
    return new Response(html,{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=60, s-maxage=60","x-content-type-options":"nosniff"}});
  }catch(e){console.error(e);return new Response("Erro ao carregar a solução: "+(e?.message||"erro interno"),{status:500,headers:{"content-type":"text/plain; charset=utf-8"}})}
};
