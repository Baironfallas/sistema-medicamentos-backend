import { UserRole } from 'src/common/enums/user-role.enum';

export class UserResponseDto {
    userId!: number;
    identification!: string;
    firstName!: string;
    secondName!: string | null;
    firstLastName!: string;
    secondLastName!: string | null;
    email!: string;
    role!: UserRole;
    createdAt!: Date;
}