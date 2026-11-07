import React from 'react';

const palette={
  ink:'#1a4839', timber:'#9bb9aa', structure:'#7c9d91', court:'#d6ebd5',
  courtOutline:'#609078',pv:'#285b65',green:'#87b585',service:'#d3d4c0',
  ground:'#d9dcd2', residential:'#91bcb2', shared:'#c9b27b', white:'#f8f8ef'
};
const dimensions=(input)=>{
  const scale=Math.min(660/input.widthM,415/input.depthM);
  const w=input.widthM*scale,h=input.depthM*scale;
  const x=(900-w)/2,y=97+(415-h)/2;
  const wingX=(input.widthM-input.courtWidthM)/2*scale;
  const wingY=(input.depthM-input.courtDepthM)/2*scale;
  return{x,y,w,h,scale,wingX,wingY,cx:x+wingX,cy:y+wingY,cw:input.courtWidthM*scale,ch:input.courtDepthM*scale};
};
const toRect=(r,d)=>({x:d.x+r.x*d.scale,y:d.y+r.y*d.scale,width:r.w*d.scale,height:r.h*d.scale});
export function calculateRoofSegments(input){
  const wingX=(input.widthM-input.courtWidthM)/2,wingY=(input.depthM-input.courtDepthM)/2;
  const strips=[
    {x:0,y:0,w:input.widthM,h:wingY},
    {x:0,y:wingY+input.courtDepthM,w:input.widthM,h:wingY},
    {x:0,y:wingY,w:wingX,h:input.courtDepthM},
    {x:wingX+input.courtWidthM,y:wingY,w:wingX,h:input.courtDepthM}
  ];
  const total=input.widthM*input.depthM-input.courtWidthM*input.courtDepthM;
  const quotas=[
    {kind:'pv',remaining:total*input.solarRoofShare/100},
    {kind:'green',remaining:total*input.greenRoofShare/100},
    {kind:'service',remaining:total*(100-input.solarRoofShare-input.greenRoofShare)/100}
  ];
  const parts=[];
  for (const strip of strips){
    let sx=strip.x, leftover=strip.w;
    for(const quota of quotas){
      if(leftover<=1e-9 || quota.remaining<=1e-9)continue;
      const width=Math.min(leftover,quota.remaining/strip.h);
      if(width>1e-9){
        parts.push({kind:quota.kind,x:sx,y:strip.y,w:width,h:strip.h});
        sx+=width;leftover-=width;quota.remaining-=width*strip.h;
      }
    }
    if(leftover>1e-6)throw new Error('Roof partition did not conserve area');
  }
  return parts;
}

function DimensionLine({x1,y1,x2,y2,label,horizontal=true}){
  return <g stroke={palette.ink} fill={palette.ink} opacity=".82" strokeWidth="1.3">
    <line x1={x1} y1={y1} x2={x2} y2={y2}/><path d={horizontal?'M'+x1+','+(y1-6)+'v12 M'+x2+','+(y2-6)+'v12':'M'+(x1-6)+','+y1+'h12 M'+(x2-6)+','+y2+'h12'}/>
    <text x={(x1+x2)/2+(horizontal?0:-12)} y={(y1+y2)/2+(horizontal?-8:4)} fontSize="14" fontFamily="Arial, sans-serif" textAnchor="middle" stroke="none" transform={horizontal?undefined:'rotate(-90 '+(x1-12)+' '+((y1+y2)/2)+')'}>{label}</text>
  </g>;
}
function CoreMarker({x,y,label}){
  return <g transform={'translate('+x+' '+y+')'}>
    <rect x="-18" y="-15" width="36" height="30" rx="2" fill="#f5efdf" stroke="#31594d" strokeWidth="1.5"/>
    <path d="M-11 -9H11L-11 0H11L-11 8H11" fill="none" stroke="#436756" strokeWidth="1.2"/>
    <text textAnchor="middle" y="26" fontSize="10" fontFamily="Arial, sans-serif" fill="#31594d">{label}</text>
  </g>;
}
function Roof({input,d}){
  const segments=calculateRoofSegments(input);
  const c={pv:palette.pv,green:palette.green,service:palette.service};
  return <g>
    {segments.map((r,i)=>{
      const q=toRect(r,d);
      return <rect key={i} {...q} fill={c[r.kind]} stroke="#eaf2e8" strokeWidth="2"/>;
    })}
    {segments.filter(r=>r.kind==='pv').map((r,i)=>{
      const q=toRect(r,d),cols=Math.floor(q.width/23),rows=Math.floor(q.height/18);
      return (cols<1||rows<1)?null:<g key={'grid'+i} stroke="#aad8d1" opacity=".4" strokeWidth=".75">
        {Array.from({length:cols},(_,j)=><line key={'v'+j} x1={q.x+(j+1)*q.width/(cols+1)} y1={q.y+2} x2={q.x+(j+1)*q.width/(cols+1)} y2={q.y+q.height-2}/>)}
        {Array.from({length:rows},(_,j)=><line key={'h'+j} x1={q.x+2} y1={q.y+(j+1)*q.height/(rows+1)} x2={q.x+q.width-2} y2={q.y+(j+1)*q.height/(rows+1)}/>)}
      </g>;
    })}
  </g>;
}

export function FloorPlan({input,level='typical'}){
  const d=dimensions(input),rects=[
    {x:d.x,y:d.y,width:d.w,height:d.wingY},
    {x:d.x,y:d.cy+d.ch,width:d.w,height:d.wingY},
    {x:d.x,y:d.cy,width:d.wingX,height:d.ch},
    {x:d.cx+d.cw,y:d.cy,width:d.wingX,height:d.ch}
  ];
  const isRoof=level==='roof',isGround=level==='ground';
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 690" role="img"
   aria-label={'Schematic '+level+' plan of a '+input.widthM+' by '+input.depthM+' meter '+input.floors+' story building with an open courtyard. Not for construction.'}>
    <defs>
      <pattern id="studioGrid" width="25" height="25" patternUnits="userSpaceOnUse">
        <path d="M25 0H0V25" stroke="#bad0c1" strokeWidth="1" fill="none" opacity=".35"/>
      </pattern>
    </defs>
    <rect width="900" height="690" fill="#f0f3eb"/>
    <rect width="900" height="690" fill="url(#studioGrid)"/>
    <g fontFamily="Arial,sans-serif" fill={palette.ink}>
      <text x="41" y="43" fontWeight="700" fontSize="22" letterSpacing="2">C.A.N.O.P.Y. / CONCEPT PLAN</text>
      <text x="41" y="69" fontSize="13" letterSpacing="1.4">{level.toUpperCase()} · LOCAL METERS · NOT TO SCALE FOR CONSTRUCTION</text>
    </g>
    <rect x={d.x-20} y={d.y-20} width={d.w+40} height={d.h+40} rx="8" fill="#dfebe0" stroke="#a8c5b3" strokeWidth="1.5"/>
    {isRoof?<Roof input={input} d={d}/>:rects.map((q,i)=><rect key={i} {...q} fill={isGround?(i===1?palette.shared:palette.structure):palette.residential} stroke="#f9faf3" strokeWidth="2"/>)}
    {!isRoof&&<g fill="none" stroke="#f1f6e9" strokeWidth="2" strokeDasharray="7 5" opacity=".8">
      <rect x={d.x+10} y={d.y+10} width={d.w-20} height={d.h-20}/>
    </g>}
    <rect x={d.cx} y={d.cy} width={d.cw} height={d.ch} fill={palette.court} stroke={palette.courtOutline} strokeWidth="3"/>
    <path d={'M'+(d.cx+11)+','+(d.cy+d.ch/2)+' H'+(d.cx+d.cw-11)+' M'+(d.cx+d.cw/2)+','+(d.cy+11)+' V'+(d.cy+d.ch-11)}
      stroke="#9ebda4" strokeDasharray="8 7" strokeWidth="4" fill="none"/>
    <circle cx={d.cx+d.cw*.28} cy={d.cy+d.ch*.36} r={Math.min(d.cw,d.ch)*.07} fill="#679b76" opacity=".95"/>
    <circle cx={d.cx+d.cw*.69} cy={d.cy+d.ch*.59} r={Math.min(d.cw,d.ch)*.085} fill="#679b76" opacity=".95"/>
    <circle cx={d.cx+d.cw*.48} cy={d.cy+d.ch*.79} r={Math.min(d.cw,d.ch)*.05} fill="#679b76" opacity=".95"/>
    <text x={d.cx+d.cw/2} y={d.cy+d.ch/2+5} textAnchor="middle" fontSize="15" fontFamily="Arial, sans-serif" fontWeight="700" fill="#2c694b">OPEN COURT</text>
    {!isRoof&&<g>
      <CoreMarker x={d.x+Math.min(d.wingX*.52,36)} y={d.y+d.wingY*.5} label="CORE A"/>
      <CoreMarker x={d.x+d.w-Math.min(d.wingX*.52,36)} y={d.y+d.h-d.wingY*.5} label="CORE B"/>
    </g>}
    {!isRoof&&<g fontSize="13" fontFamily="Arial,sans-serif" fill="#194a39" fontWeight="700" textAnchor="middle">
      <text x={d.x+d.w/2} y={d.y+d.wingY/2+4}>{isGround?'PUBLIC FRONTAGE':'ADAPTABLE INTERIOR'}</text>
      <text x={d.x+d.w/2} y={d.y+d.h-d.wingY/2+4}>{isGround?'SHARED SERVICES':'PERIMETER PROGRAM'}</text>
    </g>}
    {isRoof&&<g fontFamily="Arial,sans-serif" fontSize="14" fill="#214f43">
      <rect x="85" y="552" width="18" height="14" fill={palette.pv}/><text x="111" y="564">Photovoltaics</text>
      <rect x="275" y="552" width="18" height="14" fill={palette.green}/><text x="301" y="564">Habitat roof</text>
      <rect x="465" y="552" width="18" height="14" fill={palette.service}/><text x="491" y="564">Service / access</text>
    </g>}
    <DimensionLine x1={d.x} y1={d.y-42} x2={d.x+d.w} y2={d.y-42} label={input.widthM+' m'} />
    <DimensionLine x1={d.x-45} y1={d.y} x2={d.x-45} y2={d.y+d.h} label={input.depthM+' m'} horizontal={false}/>
    <g fontFamily="Arial,sans-serif" fontSize="13" fill="#466b55">
      <text x="45" y="625">A schematic area study; no lot lines, fire exits, doors, room schedules or service engineering.</text>
      <text x="45" y="647">All dimensions hypothetical and subject to qualified design review, code, hydrology and ecological constraints.</text>
      <text x="820" y="47" textAnchor="middle" fontWeight="700">N ↑</text>
    </g>
    <rect x="30" y="18" width="840" height="649" fill="none" stroke="#b2c4b7" strokeWidth="1.5"/>
  </svg>;
}

export function SectionDrawing({input}){
  const scale=Math.min(620/input.widthM,235/(input.floors*input.floorToFloorM));
  const ox=(900-input.widthM*scale)/2,groundY=308;
  const wing=(input.widthM-input.courtWidthM)/2*scale;
  const floorH=input.floorToFloorM*scale,topY=groundY-input.floors*floorH,fullW=input.widthM*scale;
  const courtW=input.courtWidthM*scale;
  const walls=[
    {x:ox,width:wing},
    {x:ox+wing+courtW,width:wing}
  ];
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 370" role="img" aria-label={'Schematic courtyard cross section through '+input.floors+' floors. No structural details or verified egress.'}>
    <rect width="900" height="370" fill="#eef2e9"/>
    <g fontFamily="Arial,sans-serif" fill="#244d3a">
      <text x="28" y="34" fontSize="19" fontWeight="700" letterSpacing="2">COURTYARD SECTION / STUDY</text>
      <text x="28" y="55" fontSize="11">PASSIVE SHADE · PERIMETER ROOFS · SHARED LANDSCAPE</text>
    </g>
    <path d={'M30 '+groundY+'H870'} stroke="#526d54" strokeWidth="2"/>
    {walls.map((wall,i)=><g key={i}>
      <rect x={wall.x} y={topY} width={wall.width} height={input.floors*floorH} fill="#abc6b3" stroke="#436855" strokeWidth="2"/>
      {Array.from({length:input.floors},(_,j)=><g key={j}>
       <line x1={wall.x} x2={wall.x+wall.width} y1={groundY-j*floorH} y2={groundY-j*floorH} stroke="#3b5f4d" strokeWidth="2"/>
       <rect x={wall.x+wall.width*.20} y={groundY-(j+1)*floorH+floorH*.21} width={wall.width*.6} height={floorH*.54} fill="#e7eee1" stroke="#648973"/>
      </g>)}
      <rect x={wall.x-4} y={topY-7} width={wall.width+8} height="9" fill={palette.pv}/>
    </g>)}
    <g>
      <path d={'M'+(ox+wing+12)+' '+groundY+' Q'+(ox+wing+courtW*.31)+' '+(groundY-31)+' '+(ox+wing+courtW*.5)+' '+groundY} fill="#88b58e" opacity=".75"/>
      <circle cx={ox+wing+courtW*.45} cy={groundY-39} r="23" fill="#80b188"/>
      <path d={'M'+(ox+wing+courtW*.45)+' '+groundY+'v-38'} stroke="#608c65" strokeWidth="5"/>
      <circle cx={ox+wing+courtW*.68} cy={groundY-23} r="17" fill="#8dbd94"/>
    </g>
    <g fill="#254c39" fontFamily="Arial,sans-serif" fontSize="13" textAnchor="middle">
      <text x={ox+wing+courtW/2} y={topY+60}>OPEN AIR</text>
      <text x={ox+wing+courtW/2} y={topY+78}>COURTYARD</text>
    </g>
    <DimensionLine x1={ox+fullW+35} y1={groundY} x2={ox+fullW+35} y2={topY} label={(input.floors*input.floorToFloorM).toFixed(1)+' m'} horizontal={false}/>
    <text x="38" y="344" fill="#4a6d54" fontFamily="Arial,sans-serif" fontSize="12">Illustrative section only · Not a structural, fire, seismic, thermal or accessibility design</text>
  </svg>;
}
