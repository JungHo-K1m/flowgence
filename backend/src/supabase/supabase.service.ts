import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase client initialized');
    } else {
      console.log('⚠️  Supabase credentials not found');
    }
  }

  getClient() {
    return this.supabase;
  }

  // Auth 관련 메서드들
  async getUser(userId: string) {
    if (!this.supabase) return null;
    
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    return data;
  }

  // RLS 정책을 우회한 직접 데이터 접근
  async directQuery(table: string, query: any) {
    if (!this.supabase) return null;
    
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .match(query);
    
    if (error) throw error;
    return data;
  }
}
