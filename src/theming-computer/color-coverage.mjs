/** Empirical color-pixel fractions for explicit screenshot regions.
 * This returns measurements, not a brand rule, WCAG score, or approval.
 */
export function measureColorCoverage({pixels,width,height,regions,colors,radius=20}={}) {
  if(!Number.isSafeInteger(width)||width<1||!Number.isSafeInteger(height)||
     height<1||width*height>50000000)throw new TypeError("Invalid bounded raster");
  if(!(pixels instanceof Uint8Array)||pixels.length!==width*height*4)
    throw new TypeError("RGBA raster length mismatch");
  if(!Array.isArray(regions)||!regions.length||regions.length>20||
     !Array.isArray(colors)||!colors.length||colors.length>16)
    throw new TypeError("Regions and target colors are required");
  if(!Number.isFinite(radius)||radius<=0||radius>255)
    throw new TypeError("Invalid sRGB color distance");
  const selected=colors.map(c=>{
    if(!c||!/^[a-z][a-z0-9-]*$/.test(c.id)||
       !/^#[0-9a-f]{6}$/i.test(c.hex))throw new TypeError("Invalid target");
    return{...c,channels:[1,3,5].map(i=>parseInt(c.hex.slice(i,i+2),16))};
  });
  if(new Set(selected.map(c=>c.id)).size!==selected.length)
    throw new TypeError("Duplicate color target");
  const reports=regions.map(region=>{
    const {id,x,y,width:w,height:h}=region??{};
    if(!/^[a-z][a-z0-9-]*$/.test(id??"")||
       ![x,y,w,h].every(Number.isSafeInteger)||x<0||y<0||
       w<1||h<1||x+w>width||y+h>height)
      throw new TypeError("Region lies outside raster");
    const counts=selected.map(()=>0);
    for(let row=y;row<y+h;row++)
      for(let col=x;col<x+w;col++){
        const i=4*(row*width+col);
        if(pixels[i+3]!==255)throw new TypeError("Transparent pixel is not an opaque rendered observation");
        selected.forEach((c,k)=>{
          const d=c.channels.reduce((v,n,j)=>v+(pixels[i+j]-n)**2,0);
          if(d<radius*radius)counts[k]++;
        });
      }
    return{region:{id,x,y,width:w,height:h},areaPixels:w*h,
      colors:selected.map((c,k)=>({id:c.id,hex:c.hex.toUpperCase(),
        matchedPixels:counts[k],fraction:counts[k]/(w*h)}))};
  });
  if(new Set(reports.map(r=>r.region.id)).size!==reports.length)
    throw new TypeError("Duplicate window id");
  return{schema:"web-theming/rendered-color-observation/v1",
    method:"8-bit-sRGB-Euclidean-mask",radius,reports,
    policyEvaluated:false,independentlyAccepted:false};
}
