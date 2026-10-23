/** Source-aware Design Tokens Community Group 2025.10 reader.
 * CSS composition/visual pixel receiving is separately performed by callers.
 */
export type DesignTokenDocument = Record<string, unknown>;
export interface DesignTokenDimension {
  readonly value: number;
  readonly unit: "px" | "rem";
}
export declare function hasDesignToken(tokens: DesignTokenDocument, path: string): boolean;
export declare function designTokenValue(tokens: DesignTokenDocument, path: string): unknown;
export declare function designTokenType(tokens: DesignTokenDocument, path: string): string;
export declare function designTokenFontStack(tokens: DesignTokenDocument, typeToken: string): readonly string[];
export declare function designTokenColor(tokens: DesignTokenDocument, path: string, options?: { mode?: string }): string;
export declare function designTokenDimension(tokens: DesignTokenDocument, path: string): DesignTokenDimension;
export declare function cssFontFamilyList(stack: readonly string[]): string;
