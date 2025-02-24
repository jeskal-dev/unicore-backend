import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Request as Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('JWT Authentication') // Agrupa todos los endpoints bajo la etiqueta "Auth"
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

   
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req) {
    console.log(req.user);

    const userID = Object(req.user)?.id;

    return this.service.profile(userID);
  }

  /**
   * Registro de un nuevo usuario.
   * @param body - Datos del usuario a registrar (nombre de usuario, correo electrónico, contraseña).
   * @returns Un mensaje indicando que el registro fue exitoso.
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto }) // Define el tipo del cuerpo de la solicitud
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g., missing fields or invalid data)',
  })
  register(@Body() body: RegisterDto) {
    return this.service.register(body);
  }

  /**
   * Inicio de sesión de un usuario existente.
   * @param body - Credenciales del usuario (nombre de usuario y contraseña).
   * @returns Un token JWT si las credenciales son válidas.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto }) // Define el tipo del cuerpo de la solicitud
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'your_jwt_access_token_here',
        refresh_token: 'your_jwt_refresh_token_here',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() body: LoginDto) {
    const user = await this.service.validateUser(body.username, body.password);
    return this.service.login(user);
  }

  /**
   * Cierre de sesión de un usuario.
   * @param token - Token JWT de acceso del usuario.
   * @returns Un mensaje indicando que el logout fue exitoso.
   */
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({
    schema: {
      example: {
        token: 'your_jwt_access_token_here',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logout successful',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during logout',
  })
  async logout(@Body('token') token: string) {
    try {
      await this.service.logout(token);
      return { message: 'Logout successful' };
    } catch (error) {
      if (error instanceof HttpException) throw error; // Propagar excepciones específicas
      throw new HttpException(
        'An error occurred during logout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Refrescar tokens de acceso y actualización.
   * @param refreshToken - Token de actualización del usuario.
   * @returns Nuevos tokens de acceso y actualización.
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiBody({
    schema: {
      example: {
        refresh_token: 'your_jwt_refresh_token_here',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        access_token: 'new_jwt_access_token_here',
        refresh_token: 'new_jwt_refresh_token_here',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (e.g., invalid refresh token)',
  })
  async refreshTokens(@Body('refresh_token') refreshToken: string) {
    try {
      return await this.service.refreshTokens(refreshToken);
    } catch (error) {
      throw new ForbiddenException(error);
    }
  }
}
