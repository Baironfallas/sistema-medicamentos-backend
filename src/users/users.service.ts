import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Repository } from 'typeorm';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

type CreateUserData = {
  identification: string;
  firstName: string;
  secondName: string | null;
  firstLastName: string;
  secondLastName: string | null;
  email: string;
  passwordHash: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(data: CreateUserData): Promise<UserResponseDto> {
    const emailExists = await this.userRepository.count({
      where: { email: data.email },
    });

    if (emailExists > 0) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const identificationExists = await this.userRepository.count({
      where: { identification: data.identification },
    });

    if (identificationExists > 0) {
      throw new ConflictException('La identificación ya está registrada.');
    }

    const user = this.userRepository.create({
      identification: data.identification,
      firstName: data.firstName,
      secondName: data.secondName,
      firstLastName: data.firstLastName,
      secondLastName: data.secondLastName,
      email: data.email,
      password: data.passwordHash,
      role: UserRole.USER,
    });

    const savedUser = await this.userRepository.save(user);

    return this.toResponseDto(savedUser);
  }

  async findById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: {
        userId: true,
        identification: true,
        firstName: true,
        secondName: true,
        firstLastName: true,
        secondLastName: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getUserResponseById(userId: number): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    return this.toResponseDto(user);
  }

  toResponseDto(user: User): UserResponseDto {
    return {
      userId: user.userId,
      identification: user.identification,
      firstName: user.firstName,
      secondName: user.secondName,
      firstLastName: user.firstLastName,
      secondLastName: user.secondLastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}