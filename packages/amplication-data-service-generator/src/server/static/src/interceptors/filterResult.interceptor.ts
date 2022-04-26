import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  InjectRolesBuilder,
  Permission,
  RolesBuilder,
} from "nest-access-control";
import { Reflector } from "@nestjs/core";

@Injectable()
export class FilterResultInterceptor implements NestInterceptor {
  constructor(
    @InjectRolesBuilder() private readonly rolesBuilder: RolesBuilder,
    private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const [permissionsRoles]: any = this.reflector.getAllAndMerge<string[]>(
      "roles",
      [context.getHandler(), context.getClass()]
    );

    const permission = this.rolesBuilder.permission({
      role: permissionsRoles.role,
      action: permissionsRoles.action,
      possession: permissionsRoles.possession,
      resource: permissionsRoles.resource,
    });

    return next.handle().pipe(
      map((data) => {
        return this.filterResultByPermissions(permission, data);
      })
    );
  }

  private filterResultByPermissions(
    permission: Permission,
    resourceResults: any
  ): any[] | any | void {
    if (Array.isArray(resourceResults)) {
      return resourceResults.map((results: any) => permission.filter(results));
    } else {
      return permission.filter(resourceResults);
    }
  }
}
