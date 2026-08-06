import { getStore } from "@netlify/blobs";
export default async (req)=>{
  try{
    const u=new URL(req.url),slug=String(u.searchParams.get("slug")||"").toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,80);
    if(!slug) return new Response("Link inválido.",{status:400});
    const pages=getStore({name:"customflows-public-pages",consistency:"strong"});
    const html=await pages.get(slug,{consistency:"strong"});
    if(html===null) return new Response("<!doctype html><meta charset=utf-8><title>Não encontrado</title><body style='font-family:Arial;padding:40px'><h1>Solução não encontrada</h1><p>Publique novamente ou confira o link.</p></body>",{status:404,headers:{"content-type":"text/html; charset=utf-8"}});
    return new Response(html,{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=60, s-maxage=60","x-content-type-options":"nosniff"}});
  }catch(e){console.error(e);return new Response("Erro ao carregar a solução.",{status:500})}
};