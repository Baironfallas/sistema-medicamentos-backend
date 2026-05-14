export interface RefreshTokenPayload {
    sub: number;
    jti: string;
    tokenType: 'refresh';
}