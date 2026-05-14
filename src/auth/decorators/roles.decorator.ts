import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> => {
    return SetMetadata(ROLES_KEY, roles);
};