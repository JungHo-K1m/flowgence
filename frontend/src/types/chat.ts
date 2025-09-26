export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatMessageData {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: {
    message_index: number;
    timestamp: string;
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface ChatResponse {
  message: string;
  status: 'success' | 'error';
}
