const fs=require('fs');
const {Document,Packer,Paragraph,TextRun,ImageRun,Header,Footer,Table,TableRow,TableCell,WidthType,AlignmentType,BorderStyle,TabStopType,VerticalAlign,ExternalHyperlink}=require('docx');
const G='1B4D3E',GOLD='B8860B',GREY='5A6A72',F='Arial';
const logo=fs.readFileSync(process.argv[2]);
const none={style:BorderStyle.NONE,size:0,color:'FFFFFF'};
const nb={top:none,bottom:none,left:none,right:none,insideHorizontal:none,insideVertical:none};
const W=10204; // A4 width 11906 - 2*851 margins
const r=(t,o={})=>new TextRun({text:t,font:F,size:o.size||20,color:o.color||'222222',bold:o.bold,italics:o.italics,characterSpacing:o.sp});
const right=(runs,after=20)=>new Paragraph({alignment:AlignmentType.RIGHT,spacing:{after},children:runs});
const header=new Header({children:[
 new Table({width:{size:W,type:WidthType.DXA},columnWidths:[5000,5204],borders:nb,rows:[new TableRow({children:[
  new TableCell({width:{size:5000,type:WidthType.DXA},borders:nb,verticalAlign:VerticalAlign.CENTER,children:[new Paragraph({children:[new ImageRun({type:'png',data:logo,transformation:{width:250,height:72}})]})]}),
  new TableCell({width:{size:5204,type:WidthType.DXA},borders:nb,verticalAlign:VerticalAlign.CENTER,children:[
   right([r('Merchant Exporters & Importers',{size:17,bold:true,color:G})]),
   right([r('Email: ',{size:16,color:GREY}),new ExternalHyperlink({link:'mailto:info@bhumivarahiimpex.com',children:[r('info@bhumivarahiimpex.com',{size:16,color:G})]})]),
   right([r('Web: ',{size:16,color:GREY}),new ExternalHyperlink({link:'https://www.bhumivarahiimpex.com',children:[r('www.bhumivarahiimpex.com',{size:16,color:G})]})]),
   right([r('Phone / WhatsApp: ',{size:16,color:GREY}),r('+91 94929 92666',{size:16,color:G})],0),
  ]})]})]}),
 new Paragraph({spacing:{before:80,after:0},border:{bottom:{style:BorderStyle.SINGLE,size:12,color:GOLD,space:1}},children:[]}),
 new Paragraph({spacing:{before:20,after:0},border:{bottom:{style:BorderStyle.SINGLE,size:4,color:G,space:1}},children:[]}),
]});
const footer=new Footer({children:[
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:40},border:{top:{style:BorderStyle.SINGLE,size:8,color:G,space:6}},children:[r('BHUMI VARAHI IMPEX PRIVATE LIMITED',{size:16,bold:true,color:G,sp:20})]}),
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:20},children:[r('Registered Office: [add registered office address]',{size:15,color:GREY})]}),
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:0},children:[r('CIN: [add CIN]   |   IEC: [add when issued]   |   GSTIN: [add GSTIN]',{size:15,color:GREY})]}),
]});

const P=(runs,o={})=>new Paragraph({spacing:{after:o.after??120,line:264},alignment:o.align,tabStops:o.tabs,children:Array.isArray(runs)?runs:[r(runs,o)]});
const line={style:BorderStyle.SINGLE,size:4,color:'D9DEE3'};
const grid={top:line,bottom:line,left:line,right:line,insideHorizontal:line,insideVertical:line};
const cell=(t,w,o={})=>new TableCell({width:{size:w,type:WidthType.DXA},borders:o.borders||grid,shading:o.fill?{fill:o.fill,type:'clear',color:'auto'}:undefined,verticalAlign:VerticalAlign.CENTER,columnSpan:o.span,
  margins:{top:35,bottom:35,left:90,right:90},children:[new Paragraph({alignment:o.align,children:[r(t,{size:o.size||18,bold:o.bold,color:o.color})]})]});
const H=(t)=>new Paragraph({spacing:{before:150,after:70},children:[r(t.toUpperCase(),{size:18,bold:true,color:GOLD,sp:30})]});
// two-col key/value table
const kv=(rows,w1=3000)=>new Table({width:{size:W,type:WidthType.DXA},columnWidths:[w1,W-w1],rows:rows.map(([k,v])=>new TableRow({children:[cell(k,w1,{bold:true,color:G,fill:'F8F5EC'}),cell(v,W-w1)]}))});
// title
const title=new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:120},children:[r('QUOTATION',{size:34,bold:true,color:G,sp:60})]});
const meta=new Table({width:{size:W,type:WidthType.DXA},columnWidths:[2400,2702,2400,2702],rows:[
 new TableRow({children:[cell('Quotation No.',2400,{bold:true,color:G,fill:'F8F5EC'}),cell('BV-Q-[YYYY]-[000]',2702),cell('Date',2400,{bold:true,color:G,fill:'F8F5EC'}),cell('[DD Month YYYY]',2702)]}),
 new TableRow({children:[cell('Your RFQ ref.',2400,{bold:true,color:G,fill:'F8F5EC'}),cell('[e.g. BV-261108-003000]',2702),cell('Valid until',2400,{bold:true,color:G,fill:'F8F5EC'}),cell('[DD Month YYYY]',2702)]}),
]});
const cw=[600,3304,1700,1100,1700,1800];
const hdr=['No.','Product & grade','Packing','Qty (MT)','Price (USD/MT)','Amount (USD)'];
const items=new Table({width:{size:W,type:WidthType.DXA},columnWidths:cw,rows:[
 new TableRow({tableHeader:true,children:hdr.map((h,i)=>cell(h,cw[i],{bold:true,color:'FFFFFF',fill:G,align:i>2?AlignmentType.RIGHT:undefined,size:18}))}),
 ...[['1','[e.g. 1121 Basmati Rice, Golden Sella]','[25 kg PP bags]','[25.00]','[0.00]','[0.00]'],['2','[Product & grade]','[Packing]','[0.00]','[0.00]','[0.00]'],['3','','','','','']]
   .map(row=>new TableRow({children:row.map((t,i)=>cell(t,cw[i],{align:i>2?AlignmentType.RIGHT:undefined}))})),
 new TableRow({children:[cell('Total ([Incoterm], [destination port])',cw[0]+cw[1]+cw[2],{span:3,bold:true,color:G,fill:'F8F5EC'}),cell('[0.00]',cw[3],{bold:true,align:AlignmentType.RIGHT,fill:'F8F5EC'}),cell('',cw[4],{fill:'F8F5EC'}),cell('USD [0.00]',cw[5],{bold:true,align:AlignmentType.RIGHT,fill:'F8F5EC'})]}),
]});
const body=[
 title, meta,
 H('Buyer'),
 kv([['Company','[Buyer company name]'],['Contact person','[Name, designation]'],['Email / Phone','[email]  |  [phone / WhatsApp]'],['Address / Country','[City, Country]']]),
 H('Products and prices'),
 items,
 P([r('Amount in words: ',{bold:true,size:19}),r('[US Dollars ... only]',{size:19})],{after:0}),
 H('Terms of offer'),
 kv([['Incoterm','[FOB / CFR / CIF] [named port]'],['Port of loading','[Kakinada / Visakhapatnam / Chennai], India'],['Port of discharge','[Destination port, country]'],
     ['Shipment','[Within XX days from receipt of advance / LC]'],['Payment terms','[e.g. 30% advance by TT, balance against scanned documents] or [100% irrevocable LC at sight]'],
     ['Quantity tolerance','+/- 5% at seller’s option'],['Specifications','As per attached specification sheet / product catalogue'],
     ['Inspection','[Seller’s inspection / SGS or equivalent at buyer’s cost]'],
     ['Documents','Commercial invoice, packing list, bill of lading, certificate of origin, phytosanitary certificate, fumigation certificate, [others as agreed]'],
     ['Validity','This offer is valid until the date above, subject to stock availability']]),
 H('Bank details for payment'),
 kv([['Beneficiary','BHUMI VARAHI IMPEX PRIVATE LIMITED'],['Bank name & branch','[Bank, branch]'],['Account number','[Account no.]'],['SWIFT / IFSC','[SWIFT]  /  [IFSC]']]),
 P('',{after:60}),
 P('We thank you for your enquiry and look forward to your order. Please sign and return a copy of this quotation, or reply by email, to confirm acceptance.',{after:360}),
 new Table({width:{size:W,type:WidthType.DXA},columnWidths:[5102,5102],borders:nb,rows:[new TableRow({children:[
  new TableCell({width:{size:5102,type:WidthType.DXA},borders:nb,children:[P([r('For BHUMI VARAHI IMPEX PRIVATE LIMITED',{bold:true,color:G})],{after:500}),P([r('Authorised Signatory',{bold:true})],{after:20}),P('[Name, Designation]',{after:0})]}),
  new TableCell({width:{size:5102,type:WidthType.DXA},borders:nb,children:[P([r('Accepted by the Buyer',{bold:true,color:G})],{after:500}),P([r('Signature & company stamp',{bold:true})],{after:20}),P('[Name, Date]',{after:0})]}),
 ]})]}),
];
const doc=new Document({creator:'Bhumi Varahi Impex Pvt. Ltd.',title:'Bhumi Varahi Impex Quotation',
 styles:{default:{document:{run:{font:F,size:20}}}},
 sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:2300,bottom:1500,left:851,right:851,header:450,footer:400}}},headers:{default:header},footers:{default:footer},children:body}]});
Packer.toBuffer(doc).then(b=>fs.writeFileSync(process.argv[3],b));
