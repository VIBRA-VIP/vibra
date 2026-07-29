import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: { id: string } & Record<string, unknown> }>();
  const user = request.user;
  if (!user?.id) return user;
  return user;
});
