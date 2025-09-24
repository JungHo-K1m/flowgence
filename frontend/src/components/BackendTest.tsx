'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BackendTest() {
  const [healthStatus, setHealthStatus] = useState<unknown>(null);
  const [projects, setProjects] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // 컴포넌트 마운트 시 백엔드 연결 상태 확인
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackendConnection();
  }, []);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      setHealthStatus({ error: 'Failed to connect to backend' });
    }
    setLoading(false);
  };

  const testProjectsAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      setProjects({ error: 'Failed to fetch projects' });
    }
    setLoading(false);
  };

  const testChatAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: 'test-project-123',
          message: '안녕하세요! 백엔드 연동 테스트입니다.',
          history: [],
        }),
      });
      const data = await response.json();
      console.log('Chat API Response:', data);
      alert('채팅 API 테스트 성공! 콘솔을 확인하세요.');
    } catch (error) {
      console.error('Chat API Error:', error);
      alert('채팅 API 테스트 실패! 콘솔을 확인하세요.');
    }
    setLoading(false);
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      case 'checking':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected':
        return '백엔드 연결됨';
      case 'disconnected':
        return '백엔드 연결 끊김';
      case 'checking':
        return '백엔드 확인 중...';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">백엔드 연동 테스트</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">헬스체크 테스트</h3>
          <Button onClick={testHealthCheck} disabled={loading} className="w-full">
            {loading ? '테스트 중...' : '헬스체크 실행'}
          </Button>
          {healthStatus !== null && (
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(healthStatus as object, null, 2)}
            </pre>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">프로젝트 API 테스트</h3>
          <Button onClick={testProjectsAPI} disabled={loading} className="w-full">
            {loading ? '테스트 중...' : '프로젝트 조회'}
          </Button>
          {projects !== null && (
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(projects as object, null, 2)}
            </pre>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">채팅 API 테스트</h3>
          <Button onClick={testChatAPI} disabled={loading} className="w-full">
            {loading ? '테스트 중...' : '채팅 메시지 전송'}
          </Button>
          <p className="mt-2 text-xs text-gray-600">
            결과는 콘솔과 알림으로 확인
          </p>
        </Card>
      </div>
    </div>
  );
}
