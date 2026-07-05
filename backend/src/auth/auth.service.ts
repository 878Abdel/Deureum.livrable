import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.genererTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const motDePasseValide = await bcrypt.compare(dto.password, user.password);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.genererTokens(user.id, user.email, user.role);
  }

  async refresh(userId: number, email: string, role: string) {
    return this.genererTokens(userId, email, role);
  }

  private async genererTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const access_token = this.jwtService.sign(payload, {
  secret: this.config.get<string>('JWT_SECRET'),
  expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '15m') as any,
});

const refresh_token = this.jwtService.sign(payload, {
  secret: this.config.get<string>('JWT_REFRESH_SECRET'),
  expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
});

    return { access_token, refresh_token, user: { id: userId, email, role } };
  }
}