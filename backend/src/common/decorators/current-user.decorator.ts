import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../APP.Infrastructure/auth/jwt.service';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

