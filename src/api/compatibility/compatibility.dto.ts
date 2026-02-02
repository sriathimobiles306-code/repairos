// src/api/compatibility/compatibility.dto.ts

export class CompatibilityCheckDto {
    brand: string;
    model: string;
}

export enum SubscriptionTier {
    BASIC = 'BASIC',
    PRO = 'PRO',
    ENTERPRISE = 'ENTERPRISE',
}

export interface ScreenProfile {
    id: number;
    diagonal_inch: number;
    dimensions_mm: { w: number; h: number };
    type: string;
    resolution: string; // "N/A" if not tracked, but keeping shape simple
}

export interface MatchResponseItem {
    type: 'EXACT' | 'UNIVERSAL';
    sku_code: string;
    name: string;
    status: 'GREEN' | 'YELLOW' | 'RED';
    confidence: number;
    warnings: string[];
    metadata: Record<string, any>;
    verification_source?: string;
    stock: number;
}

export interface SubscriptionGatingMeta {
    allowed: boolean;
    hidden_universal_count: number;
    upgrade_message?: string;
}

export class CompatibilityResponse {
    request: {
        brand: string;
        model: string;
        resolved_model?: string;
    };
    screen_profile: ScreenProfile;
    matches: MatchResponseItem[];
    warnings: string[];
    subscription_gating: SubscriptionGatingMeta;
}
