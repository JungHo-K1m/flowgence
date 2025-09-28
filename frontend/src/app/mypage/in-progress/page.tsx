export default function InProgressProjects() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">진행중인 프로젝트</h1>
        <p className="text-gray-600 mt-1">
          현재 진행 중인 프로젝트들을 확인하세요
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            진행중인 프로젝트가 없습니다
          </div>
          <p className="text-gray-400 mt-2">새 프로젝트를 시작해보세요</p>
        </div>
      </div>
    </div>
  );
}
