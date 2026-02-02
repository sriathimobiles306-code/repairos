// src/shared/auth/auth.types.ts

export enum UserRole {
    OWNER = 'OWNER',
    STAFF = 'STAFF',
    PLATFORM_ADMIN = 'PLATFORM_ADMIN' // For future use
}

export interface JwtPayload {
    sub: string;       // User ID
    tenantId: number;  // Tenant ID
    role: UserRole;    // User Role
    iat: number;
    exp: number;
}

export interface UserContext {
    userId: number;
    tenantId: number;
    role: UserRole;
}
