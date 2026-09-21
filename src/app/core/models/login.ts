export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token?: string;
    email: string;
    role: string;
    expiresAt: Date;
}

export interface MeResponse {
    email: string;
    role: string;
}