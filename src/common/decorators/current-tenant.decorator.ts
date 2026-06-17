import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../types/tenant-context.type';

type RequestWithTenant = Request & {
  tenant?: TenantContext;
};

export const CurrentTenant = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenant;
  },
);
