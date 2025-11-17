import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    try {
      const supabase = this.supabaseService.getClient();
      if (!supabase) {
        throw new UnauthorizedException('Supabase 클라이언트가 초기화되지 않았습니다.');
      }

      // JWT 토큰 검증
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 사용자 ID를 request 객체에 주입
      (request as any).user = {
        id: user.id,
        email: user.email,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('인증 검증 실패');
    }
  }
}

