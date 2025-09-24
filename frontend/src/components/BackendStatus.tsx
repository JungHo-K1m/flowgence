'use client';

import { useState, useEffect } from 'react';
import { checkHealth } from '@/lib/api';

interface BackendStatusProps {
  className?: string;
}

export default function BackendStatus({ className = '' }: BackendStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendStatus = async () => {
    setStatus('checking');
    const response = await checkHealth();
    
    if (response.status === 200) {
      setStatus('connected');
    } else {
      setStatus('disconnected');
    }
    
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkBackendStatus();
    
    // 30초마다 상태 확인
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
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
    switch (status) {
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
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </div>
      {lastChecked && (
        <span className="text-xs text-gray-500">
          {lastChecked.toLocaleTimeString()}
        </span>
      )}
      <button
        onClick={checkBackendStatus}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
        disabled={status === 'checking'}
      >
        새로고침
      </button>
    </div>
  );
}
