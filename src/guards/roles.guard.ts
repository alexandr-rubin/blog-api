import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRoles } from '../helpers/userRoles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (requiredRoles.includes(UserRoles.Guest) && !user) {
      return true; // Если требуется гость и пользователь не авторизован, разрешаем доступ
    }

    if (!user || !user.role) {
      return false; // Если пользователь не авторизован или у него нет ролей, запрещаем доступ
    }

    const userRole = user.role;

    return requiredRoles.includes(userRole); // Проверяем, что требуемая роль совпадает с ролью пользователя
  }
}
