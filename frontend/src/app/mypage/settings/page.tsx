"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { getNotionConnection, startNotionOAuth, disconnectNotion } from "@/lib/notionOAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function Settings() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<{
    connected: boolean;
    workspaceName?: string;
    connectedAt?: string;
    databaseId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  // URL 파라미터에서 연결 상태 확인
  useEffect(() => {
    const connected = searchParams?.get("notion_connected");
    const error = searchParams?.get("notion_error");

    if (connected === "true") {
      setMessage("Notion 계정이 성공적으로 연결되었습니다.");
      setMessageType("success");
      // URL에서 파라미터 제거
      window.history.replaceState({}, "", "/mypage/settings");
      // 연결 정보 다시 조회
      loadConnection();
    } else if (error) {
      setMessage(decodeURIComponent(error));
      setMessageType("error");
      window.history.replaceState({}, "", "/mypage/settings");
    }
  }, [searchParams]);

  // 연결 정보 로드
  const loadConnection = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getNotionConnection();
      setConnection(data);
    } catch (error) {
      console.error("연결 정보 조회 실패:", error);
      setConnection({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnection();
  }, [user]);

  // Notion 연결 시작
  const handleConnect = async () => {
    if (!user) {
      setMessage("로그인이 필요합니다.");
      setMessageType("error");
      return;
    }

    try {
      setConnecting(true);
      setMessage(null);
      await startNotionOAuth();
      // 리디렉션되므로 여기까지 도달하지 않음
    } catch (error) {
      console.error("Notion 연결 실패:", error);
      setMessage(error instanceof Error ? error.message : "Notion 연결에 실패했습니다.");
      setMessageType("error");
      setConnecting(false);
    }
  };

  // Notion 연결 해제
  const handleDisconnect = async () => {
    if (!user) {
      return;
    }

    if (!confirm("Notion 연결을 해제하시겠습니까?")) {
      return;
    }

    try {
      setDisconnecting(true);
      setMessage(null);
      await disconnectNotion();
      setMessage("Notion 연결이 해제되었습니다.");
      setMessageType("success");
      await loadConnection();
    } catch (error) {
      console.error("Notion 연결 해제 실패:", error);
      setMessage(error instanceof Error ? error.message : "연결 해제에 실패했습니다.");
      setMessageType("error");
    } finally {
      setDisconnecting(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-600 mt-1">계정 및 프로젝트 설정을 관리하세요</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">로그인이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-1">계정 및 프로젝트 설정을 관리하세요</p>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            messageType === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Notion 연결 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>Notion 연결</CardTitle>
          <CardDescription>
            Notion 계정을 연결하여 프로젝트 문서를 Notion으로 공유할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">연결 정보를 불러오는 중...</div>
            </div>
          ) : connection?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-gray-900">연결됨</div>
                    <div className="text-sm text-gray-600">
                      워크스페이스: {connection.workspaceName || "알 수 없음"}
                    </div>
                    {connection.connectedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        연결일: {new Date(connection.connectedAt).toLocaleDateString("ko-KR")}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? "해제 중..." : "연결 해제"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div>
                    <div className="font-medium text-gray-900">연결 안됨</div>
                    <div className="text-sm text-gray-600">
                      Notion 계정을 연결하여 문서를 공유하세요.
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? "연결 중..." : "Notion 계정 연결하기"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
