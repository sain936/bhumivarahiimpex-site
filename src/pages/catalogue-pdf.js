const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+process.cwd()+'/catalogue.html');await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:'Bhumi-Varahi-Impex-Catalogue-2026.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',
footerTemplate:'<div style="width:100%;font-size:7pt;color:#64748b;padding:0 15mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>Bhumi Varahi Impex Pvt. Ltd. · www.bhumivarahiimpex.com · +91 94929 92666</span><span class="pageNumber"></span></div>'});
await b.close()})();
