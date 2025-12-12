
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const userId = request.query.userId;
    
    // Pass userId as state
    return {
      state: userId ? JSON.stringify({ userId }) : undefined,
    };
  }
}
