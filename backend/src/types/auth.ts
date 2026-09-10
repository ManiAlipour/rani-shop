// src/types/auth.ts
export type UserRole = "SUPER_ADMIN" | "STORE_MANAGER" | "SUPPORT" | "CUSTOMER";

export interface RequestAuth {
  userId: string;
  role?: UserRole;
  sessionId?: string;
  familyId?: string;
  refreshed?: boolean;
}

export interface AccessTokenPayload {
  userId: string;
  role?: UserRole;
  sessionId?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  familyId: string;
}
