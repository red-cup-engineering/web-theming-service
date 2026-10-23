import test from "node:test";
import assert from "node:assert/strict";
import {measureColorCoverage} from "../src/theming-computer/color-coverage.mjs";

const red=[255,69,48,255],blue=[61,85,136,255],bone=[242,234,216,255];
const image=()=>({
  width:4,height:2,
  pixels:Uint8Array.from([...red,...red,...bone,...bone,...bone,...bone,...blue,...blue]),
  regions:[{id:"page",x:0,y:0,width:4,height:2},{id:"first",x:0,y:0,width:4,height:1}],
  colors:[{id:"alarm",hex:"#FF4530"},{id:"witness",hex:"#3D5588"}]
});
test("one raster supports multiple explicit, unequal window readings",()=>{
 const r=measureColorCoverage(image());
 assert.equal(r.policyEvaluated,false);
 assert.equal(r.independentlyAccepted,false);
 assert.equal(r.reports[0].areaPixels,8);
 assert.deepEqual(r.reports[0].colors.map(x=>x.fraction),[0.25,0.25]);
 assert.deepEqual(r.reports[1].colors.map(x=>x.fraction),[0.5,0]);
 assert.equal(r.radius,20);
});
test("different color thresholds and crop bounds cannot claim identical testimony",()=>{
 const a=image();a.pixels[0]=245;
 const near=measureColorCoverage(a);
 assert.equal(near.reports[1].colors[0].matchedPixels,2);
 const narrow=measureColorCoverage({...a,radius:5});
 assert.equal(narrow.reports[1].colors[0].matchedPixels,1);
 const out=image();out.regions[0].width=5;
 assert.throws(()=>measureColorCoverage(out),/outside raster/);
});
test("invalid image, unauthorized alpha, duplicate labels and color values are refused",()=>{
 const a=image();a.pixels=a.pixels.subarray(1);
 assert.throws(()=>measureColorCoverage(a),/RGBA raster/);
 const transparent=image();transparent.pixels[3]=0;
 assert.throws(()=>measureColorCoverage(transparent),/Transparent pixel/);
 const dup=image();dup.colors.push(dup.colors[0]);
 assert.throws(()=>measureColorCoverage(dup),/Duplicate color/);
 const forged=image();forged.colors[0].hex="#oops";
 assert.throws(()=>measureColorCoverage(forged),/Invalid target/);
});
