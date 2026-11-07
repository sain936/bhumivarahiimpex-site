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
const P=(runs,o={})=>new Paragraph({spacing:{after:o.after??160,line:276},alignment:o.align,tabStops:o.tabs,children:Array.isArray(runs)?runs:[r(runs)]});
const body=[
 P([r('Ref. No.: BVI/[YYYY]/[000]',{bold:true}),new TextRun({text:'\t',font:F}),r('Date: [DD Month YYYY]',{bold:true})],{tabs:[{type:TabStopType.RIGHT,position:W}],after:320}),
 P('To,',{after:40}),
 P('[Recipient Name]',{after:40}),
 P('[Designation]',{after:40}),
 P('[Company Name]',{after:40}),
 P('[Address Line 1]',{after:40}),
 P('[City, Country]',{after:280}),
 P([r('Subject: ',{bold:true}),r('[Subject of the letter]',{bold:true})],{after:280}),
 P('Dear Sir / Madam,'),
 P('[Write the body of your letter here. Keep paragraphs short and specific: what you are offering or requesting, the key details (product, grade, quantity, Incoterm, port), and the next step you expect.]'),
 P('[Second paragraph, if needed.]'),
 P('We look forward to your response.',{after:400}),
 P('Yours faithfully,',{after:40}),
 P([r('For BHUMI VARAHI IMPEX PRIVATE LIMITED',{bold:true,color:G})],{after:900}),
 P([r('Authorised Signatory',{bold:true})],{after:40}),
 P('[Name]',{after:40}),
 P('[Designation]',{after:40}),
];
const doc=new Document({creator:'Bhumi Varahi Impex Pvt. Ltd.',title:'Bhumi Varahi Impex Letterhead',
 styles:{default:{document:{run:{font:F,size:21}}}},
 sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:2300,bottom:1500,left:851,right:851,header:450,footer:400}}},headers:{default:header},footers:{default:footer},children:body}]});
Packer.toBuffer(doc).then(b=>fs.writeFileSync(process.argv[3],b));
