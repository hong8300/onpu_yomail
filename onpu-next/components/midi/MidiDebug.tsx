'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, Trash2 } from 'lucide-react';

interface MidiDebugProps {
  className?: string;
}

interface LogEntry {
  timestamp: Date;
  type: 'info' | 'warn' | 'error';
  message: string;
}

export function MidiDebug({ className = '' }: MidiDebugProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Override console methods to capture MIDI-related logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type: 'info' | 'warn' | 'error', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      // Only capture MIDI-related messages
      if (message.toLowerCase().includes('midi')) {
        setLogs(prev => [...prev, {
          timestamp: new Date(),
          type,
          message
        }].slice(-50)); // Keep only last 50 logs
      }
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getBadgeVariant = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bug className="w-5 h-5" />
            MIDIデバッグコンソール
            {logs.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {logs.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={clearLogs}
              disabled={logs.length === 0}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              クリア
            </Button>
            <Button
              onClick={() => setIsVisible(!isVisible)}
              variant="outline"
              size="sm"
            >
              {isVisible ? '隠す' : '表示'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isVisible && (
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                MIDIアクティビティはありません
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                    {formatTime(log.timestamp)}
                  </span>
                  <Badge 
                    variant={getBadgeVariant(log.type)} 
                    className="text-xs shrink-0"
                  >
                    {log.type.toUpperCase()}
                  </Badge>
                  <pre className="text-xs overflow-x-auto flex-1 whitespace-pre-wrap">
                    {log.message}
                  </pre>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
            <h4 className="text-sm font-medium mb-2">デバッグ手順:</h4>
            <ol className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>1. MIDIキーボードがUSBでPCに接続されていることを確認</li>
              <li>2. 他のMIDIソフトウェアが同じデバイスを使用していないか確認</li>
              <li>3. 「接続」ボタンをクリックしてログを確認</li>
              <li>4. デバイスが表示されない場合、ブラウザを再起動</li>
              <li>5. MIDIキーボードの電源を入れ直して再試行</li>
            </ol>
          </div>
        </CardContent>
      )}
    </Card>
  );
}