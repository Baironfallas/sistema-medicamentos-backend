import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token entregado al iniciar sesión.',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString({ message: 'El refresh token debe ser un texto.' })
    @IsNotEmpty({ message: 'El refresh token es obligatorio.' })
    @IsJWT({ message: 'El refresh token debe tener un formato JWT válido.' })
    refreshToken!: string;
}