import BackendTest from '@/components/BackendTest';

// 인증 없이 접근 가능하도록 설정
export default function TestBackendPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ 이 페이지는 백엔드 연동 테스트용입니다. Supabase 인증 오류는 무시하세요.
          </p>
        </div>
        <BackendTest />
      </div>
    </div>
  );
}
