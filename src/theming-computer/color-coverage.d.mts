/** Measurement of actual raster pixels, NOT image quality or brand-policy approval. */
export type ObservedColorTarget={id:string;hex:string};
export type ObservedWindow={id:string;x:number;y:number;width:number;height:number};
export type ColorFraction={id:string;hex:string;matchedPixels:number;fraction:number};
export type WindowColorReading={
  region:ObservedWindow;areaPixels:number;colors:ColorFraction[]
};
export type ColorUsageObservation={
  schema:"web-theming/rendered-color-observation/v1";
  method:"8-bit-sRGB-Euclidean-mask";radius:number;
  reports:WindowColorReading[];policyEvaluated:false;independentlyAccepted:false
};
export declare function measureColorCoverage(input:{
  pixels:Uint8Array;width:number;height:number;
  regions:ObservedWindow[];colors:ObservedColorTarget[];radius?:number
}):ColorUsageObservation;
