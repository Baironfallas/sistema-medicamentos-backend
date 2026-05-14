import { UserRole } from 'src/common/enums/user-role.enum';

export interface AuthenticatedUser {
    userId: number;
    email: string;
    role: UserRole;
}