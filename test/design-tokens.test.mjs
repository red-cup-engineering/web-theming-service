import test from "node:test";
import assert from "node:assert/strict";
import {
  hasDesignToken,designTokenValue,designTokenType,designTokenColor,
  designTokenFontStack,designTokenDimension,cssFontFamilyList
} from "../src/theming-computer/design-tokens.mjs";

const srgb=(hex)=>({colorSpace:"srgb",components:[1,3,5].map(i=>
  parseInt(hex.slice(i,i+2),16)/255),alpha:1,hex});
const fixture=()=>({
  color:{$type:"color",
    ink:{$value:srgb("#0A0A0A")},
    paper:{$value:srgb("#F2EAD8")},
    witness:{$value:"{color.ink}"},
    transparent:{$value:srgb("#3D5588"),$extensions:{mode:{
      dark:srgb("#A4B8EF")
    }}}
  },
  font:{family:{display:{$type:"fontFamily",$value:["Space Grotesk","Arial","sans-serif"]},
    mono:{$type:"fontFamily",$value:["JetBrains Mono","ui-monospace"]}}},
  type:{display:{$type:"typography",$value:{fontFamily:"{font.family.display}",
    fontSize:{value:128,unit:"px"},fontWeight:700,lineHeight:0.85}}},
  layout:{measure:{$type:"dimension",$value:{value:42,unit:"rem"}}},
  alias:{$value:"{layout.measure}"}
});
test("DTCG group $type inheritance and typed aliases are preserved",()=>{
  const f=fixture();
  assert.equal(designTokenColor(f,"color.ink"),"#0A0A0A");
  assert.equal(designTokenColor(f,"color.witness"),"#0A0A0A");
  assert.equal(designTokenType(f,"color.ink"),"color");
  assert.equal(designTokenType(f,"alias"),"dimension");
  assert.deepEqual(designTokenValue(f,"alias"),{value:42,unit:"rem"});
  assert.equal(hasDesignToken(f,"color"),true);
  assert.equal(hasDesignToken(f,"color.nonexistent"),false);
});
test("DTCG full sRGB without redundant hex still projects; mismatched fallback refuses",()=>{
  const f=fixture();
  delete f.color.paper.$value.hex;
  assert.equal(designTokenColor(f,"color.paper"),"#F2EAD8");
  f.color.paper.$value.hex="#FFFFFF";
  assert.throws(()=>designTokenColor(f,"color.paper"),/contradicts/);
  f.color.paper.$value.hex="#F2EAD8";
  f.color.paper.$value.alpha=0.4;
  assert.throws(()=>designTokenColor(f,"color.paper"),/opaque sRGB/);
  f.color.paper.$value.alpha=1;
  f.color.paper.$value.components=[0.1,Infinity,1];
  assert.throws(()=>designTokenColor(f,"color.paper"),/invalid sRGB component/);
});
test("DTCG explicit mode and correctly typed color aliases are preserved",()=>{
  const f=fixture();
  assert.equal(designTokenColor(f,"color.transparent",{mode:"dark"}),"#A4B8EF");
  assert.throws(()=>designTokenColor(f,"color.ink",{mode:"dark"}),/no dark mode value/);
  f.color.transparent.$extensions.mode.dark="{color.paper}";
  assert.equal(designTokenColor(f,"color.transparent",{mode:"dark"}),"#F2EAD8");
});
test("untyped tokens, group values and wrong-type aliases refuse instead of guessing",()=>{
  const f=fixture();
  assert.throws(()=>designTokenValue(f,"color"),/group, not a token/);
  delete f.layout.measure.$type;
  assert.throws(()=>designTokenValue(f,"layout.measure"),/no explicit or inherited/);
  f.layout.measure.$type="dimension";
  f.color.witness.$value="{layout.measure}";
  assert.throws(()=>designTokenValue(f,"color.witness"),/incompatible \$type/);
  f.color.witness.$value="{color.witness}";
  assert.throws(()=>designTokenValue(f,"color.witness"),/alias cycle/);
  f.color.witness.$value="#3D5588";
  f.color.witness.$type="number";
  assert.throws(()=>designTokenColor(f,"color.witness"),/must be \$type color/);
});
test("typed composite font-family and CSS quoting cannot inject CSS",()=>{
  const f=fixture();
  assert.deepEqual(designTokenFontStack(f,"display"),["Space Grotesk","Arial","sans-serif"]);
  assert.equal(cssFontFamilyList(designTokenFontStack(f,"display")),
    '"Space Grotesk", "Arial", sans-serif');
  assert.equal(cssFontFamilyList(['My "Quoted" Face','ui-monospace']),
    '"My \\"Quoted\\" Face", ui-monospace');
  assert.throws(()=>cssFontFamilyList(["Arial\nbody{display:none}"]),/Invalid CSS font-family/);
  assert.throws(()=>cssFontFamilyList([]),/nonempty array/);
  f.type.display.$type="color";
  assert.throws(()=>designTokenFontStack(f,"display"),/must be \$type typography/);
});
test("typed dimensions cannot accidentally become CSS guesses",()=>{
  const f=fixture();
  assert.deepEqual(designTokenDimension(f,"layout.measure"),{value:42,unit:"rem"});
  f.layout.measure.$value={value:"42",unit:"rem"};
  assert.throws(()=>designTokenDimension(f,"layout.measure"),/no valid px\/rem dimension/);
  f.layout.measure.$value={value:42,unit:"years"};
  assert.throws(()=>designTokenDimension(f,"layout.measure"),/no valid px\/rem dimension/);
});
