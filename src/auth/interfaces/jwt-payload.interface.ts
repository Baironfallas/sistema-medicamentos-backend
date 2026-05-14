import { UserRole } from 'src/common/enums/user-role.enum';

export interface JwtPayload {
    sub: number;
    email: string;
    role: UserRole;
    tokenType: 'access';
}