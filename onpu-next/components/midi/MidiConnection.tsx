'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMidiContext } from '@/components/providers/MidiProvider';
import { Plug, PlugZap, Piano, AlertCircle, CheckCircle } from 'lucide-react';

interface MidiConnectionProps {
  onNoteReceived?: (noteName: string) => void;
}

export function MidiConnection({ onNoteReceived }: MidiConnectionProps) {
  const {
    isSupported,
    isConnected,
    devices,
    connectMidi,
    disconnectMidi,
    onNoteOn,
    removeNoteOnListener,
  } = useMidiContext();

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a stable callback reference
  const stableCallback = React.useMemo(() => {
    return onNoteReceived ? (noteName: string) => {
      console.log('Note received in MidiConnection:', noteName);
      onNoteReceived(noteName);
    } : null;
  }, [onNoteReceived]);

  React.useEffect(() => {
    console.log('MidiConnection useEffect triggered:', { hasCallback: !!stableCallback, isConnected });
    
    if (stableCallback) {
      console.log('Setting up MIDI note callback');
      onNoteOn(stableCallback);
    } else {
      console.log('Removing MIDI note callback - no callback');
      removeNoteOnListener();
    }

    return () => {
      console.log('MidiConnection useEffect cleanup');
      removeNoteOnListener();
    };
  }, [stableCallback, onNoteOn, removeNoteOnListener]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await connectMidi();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MIDI接続に失敗しました');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectMidi();
    setError(null);
  };

  if (!isSupported) {
    return (
      <Card className="border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">
              このブラウザはWeb MIDI APIをサポートしていません。
              Chrome、Edge、Operaをお使いください。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all ${isConnected ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Piano className="w-5 h-5" />
          MIDIキーボード接続
          {isConnected && <CheckCircle className="w-4 h-4 text-green-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-600' : ''}>
              {isConnected ? '接続中' : '未接続'}
            </Badge>
            {devices.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {devices.length}台のデバイス
              </span>
            )}
          </div>
          
          <Button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            variant={isConnected ? 'outline' : 'default'}
            size="sm"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                接続中...
              </>
            ) : isConnected ? (
              <>
                <PlugZap className="w-4 h-4 mr-2" />
                切断
              </>
            ) : (
              <>
                <Plug className="w-4 h-4 mr-2" />
                接続
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Connected Devices */}
        {isConnected && devices.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              接続済みデバイス:
            </h4>
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border"
              >
                <div>
                  <p className="text-sm font-medium">{device.name}</p>
                  {device.manufacturer && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {device.manufacturer}
                    </p>
                  )}
                </div>
                <Badge 
                  variant={device.state === 'connected' ? 'default' : 'secondary'}
                  className={device.state === 'connected' ? 'bg-green-600' : ''}
                >
                  {device.state === 'connected' ? '接続中' : '切断'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {isConnected ? (
              <>
                🎹 MIDIキーボードのC〜Bの鍵盤を押して回答できます。
                どのオクターブの鍵盤でも認識されます。
              </>
            ) : (
              <>
                MIDIキーボードをコンピューターに接続してから「接続」ボタンを押してください。
                ブラウザがMIDIデバイスへのアクセス許可を求めた場合は「許可」を選択してください。
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}