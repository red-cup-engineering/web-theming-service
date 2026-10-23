// Source-owned DTCG 2025.10 token interpretation shared by every web theme.
// Values and types are read together: an untyped $value is not a valid design
// token, and an alias may not silently convert one type into another.
// No template defaults, browser state, provider calls or brand-specific colors.

const TOKEN_ALIAS=/^\{([A-Za-z0-9_.-]+)\}$/u;
const HEX=/^#[0-9A-Fa-f]{6}$/u;
const own=(node,key)=>Object.prototype.hasOwnProperty.call(node,key);

function tokenNode(tokens,path) {
  if(typeof path!=="string"||!path||path.split(".").some(p=>!p))
    throw new TypeError("A nonempty dotted design-token path is required");
  let node=tokens,type;
  for(const key of path.split(".")){
    if(!node||typeof node!=="object"||Array.isArray(node)||own(node,"$value")||!own(node,key))
      throw new Error('design tokens have no "'+path+'"');
    if(typeof node.$type==="string")type=node.$type;
    node=node[key];
  }
  if(!node||typeof node!=="object"||Array.isArray(node)||!own(node,"$value"))
    throw new TypeError('design-token path "'+path+'" is a group, not a token');
  if(typeof node.$type==="string")type=node.$type;
  return{node,type};
}
function resolve(tokens,path,seen=new Set()){
  if(seen.has(path))throw new TypeError('design token alias cycle at "'+path+'"');
  const visiting=new Set(seen);visiting.add(path);
  const {node,type}=tokenNode(tokens,path),value=node.$value;
  const alias=typeof value==="string"?TOKEN_ALIAS.exec(value):null;
  if(alias){
    const target=resolve(tokens,alias[1],visiting);
    if(type&&type!==target.type)
      throw new TypeError("design token "+path+" aliases incompatible $type "+target.type);
    return{value:target.value,type:type??target.type};
  }
  if(typeof type!=="string"||!type)
    throw new TypeError("design token "+path+" has no explicit or inherited $type");
  return{value,type};
}
function requireType(tokens,path,expected){
  const t=resolve(tokens,path);
  if(t.type!==expected)
    throw new TypeError("design token "+path+" must be $type "+expected+" (not "+t.type+")");
  return t.value;
}
const cssHex=(value,path)=>{
  if(typeof value==="string"){
    if(!HEX.test(value))throw new TypeError("design token "+path+" is not a six-digit CSS hex color");
    return value.toUpperCase();
  }
  // Color Module 2025.10: sRGB components and optional hex serialization.
  if(!value||typeof value!=="object"||Array.isArray(value)||
      value.colorSpace!=="srgb"||!Array.isArray(value.components)||
      value.components.length!==3||
      (value.alpha!==undefined&&value.alpha!==1))
    throw new TypeError("design token "+path+" has no opaque sRGB color");
  const rgb=value.components.map(component=>{
    if(typeof component!=="number"||!Number.isFinite(component)||component<0||component>1)
      throw new TypeError("design token "+path+" has an invalid sRGB component");
    return Math.round(component*255).toString(16).padStart(2,"0");
  });
  const hex="#"+rgb.join("").toUpperCase();
  if(value.hex!==undefined&&(!HEX.test(value.hex)||value.hex.toUpperCase()!==hex))
    throw new TypeError("design token "+path+" contradicts its sRGB hex fallback");
  return hex;
};

/** Whether a document has an actual token or nested group at this path.
 * This is only path existence, not a promise that the token is valid. */
export function hasDesignToken(tokens,path){
  try{
    let node=tokens;
    for(const part of path.split(".")){
      if(!node||typeof node!=="object"||!own(node,part))return false;
      node=node[part];
    }
    return true;
  }catch{return false;}
}

/** The typed value at a dotted path, following aliases with cycle/type refusal. */
export function designTokenValue(tokens,path){return resolve(tokens,path).value;}

/** The effective DTCG type, respecting group inheritance and typed aliases. */
export function designTokenType(tokens,path){return resolve(tokens,path).type;}

/** A typography composite's ordered font-family stack. */
export function designTokenFontStack(tokens,typeToken){
  const path="type."+typeToken;
  const composite=requireType(tokens,path,"typography");
  const attr=composite?.fontFamily;
  const alias=typeof attr==="string"?TOKEN_ALIAS.exec(attr):null;
  const family=alias?requireType(tokens,alias[1],"fontFamily"):attr;
  const stack=Array.isArray(family)?family:[family];
  if(stack.length===0||stack.some(name=>typeof name!=="string"||!name.trim()||/[\u0000-\u001f\u007f]/u.test(name)))
    throw new TypeError("design token "+path+" names no safe font family stack");
  return Object.freeze([...stack]);
}

/** An opaque color as #RRGGBB; an explicit extension mode stays source-typed. */
export function designTokenColor(tokens,path,{mode}={}){
  let value=requireType(tokens,path,"color");
  if(mode!==undefined){
    const {node}=tokenNode(tokens,path);
    const raw=node.$extensions?.mode?.[mode];
    if(raw===undefined)throw new Error("design token "+path+" has no "+mode+" mode value");
    const alias=typeof raw==="string"?TOKEN_ALIAS.exec(raw):null;
    value=alias?requireType(tokens,alias[1],"color"):raw;
  }
  return cssHex(value,path);
}

/** A DTCG dimension with a preserved physical unit, never guessed from CSS. */
export function designTokenDimension(tokens,path){
  const value=requireType(tokens,path,"dimension");
  if(!value||typeof value!=="object"||Array.isArray(value)||
      typeof value.value!=="number"||!Number.isFinite(value.value)||
      !["px","rem"].includes(value.unit))
    throw new TypeError("design token "+path+" has no valid px/rem dimension");
  return Object.freeze({value:value.value,unit:value.unit});
}

/** Quoted CSS font stacks with safe generic-family handling. */
export function cssFontFamilyList(stack){
  const generic=new Set(["serif","sans-serif","monospace","cursive","fantasy",
    "system-ui","ui-serif","ui-sans-serif","ui-monospace","ui-rounded",
    "math","emoji","fangsong"]);
  if(!Array.isArray(stack)||!stack.length)
    throw new TypeError("CSS font-family stack must be a nonempty array");
  return stack.map(name=>{
    if(typeof name!=="string"||!name.trim()||/[\u0000-\u001f\u007f]/u.test(name))
      throw new TypeError("Invalid CSS font-family name");
    if(generic.has(name))return name;
    return '"'+name.replace(/\\/gu,"\\\\").replace(/"/gu,'\\"')+'"';
  }).join(", ");
}
