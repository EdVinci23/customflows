import { getStore } from "@netlify/blobs";

function clean(v=""){
  return String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);
}
export default async(req)=>{
  try{
    const u=new URL(req.url);
    const slug=clean(u.searchParams.get("slug")||"");

    if(!slug){
      return new Response("Link inválido: parâmetro slug ausente.",{
        status:400,
        headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}
      });
    }

    const pages=getStore({name:"customflows-public-pages",consistency:"strong"});
    const html=await pages.get(slug,{consistency:"strong"});

    if(html===null){
      return new Response(
        `<!doctype html><meta charset="utf-8"><title>Não encontrado</title>
        <body style="font-family:Arial;padding:40px">
          <h1>Solução não encontrada</h1>
          <p>Slug recebido: <b>${slug}</b></p>
        </body>`,
        {status:404,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}}
      );
    }

    return new Response(html,{
      status:200,
      headers:{
        "content-type":"text/html; charset=utf-8",
        "cache-control":"public,max-age=30,s-maxage=30",
        "x-content-type-options":"nosniff"
      }
    });
  }catch(e){
    console.error(e);
    return new Response("Erro ao carregar a solução: "+(e?.message||"erro interno"),{
      status:500,
      headers:{"content-type":"text/plain; charset=utf-8"}
    });
  }
};
