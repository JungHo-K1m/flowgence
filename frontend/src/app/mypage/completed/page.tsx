export default function CompletedProjects() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">완료된 프로젝트</h1>
        <p className="text-gray-600 mt-1">완료된 프로젝트들을 확인하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            완료된 프로젝트가 없습니다
          </div>
          <p className="text-gray-400 mt-2">프로젝트를 완료해보세요</p>
        </div>
      </div>
    </div>
  );
}
