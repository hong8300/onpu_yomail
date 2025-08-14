'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { MidiConnection } from '@/components/midi/MidiConnection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Music, 
  Piano, 
  Monitor, 
  Download, 
  Upload, 
  RotateCcw,
  Home,
  Save 
} from 'lucide-react';
import { 
  QUESTION_COUNT_OPTIONS,
  NOTE_RANGE_PRESETS,
  DIFFICULTY_LEVELS,
  STAFF_SIZE_OPTIONS,
  THEME_OPTIONS
} from '@/lib/settings';

export default function SettingsPage() {
  const { 
    settings, 
    isLoading, 
    updatePracticeSettings, 
    updateDisplaySettings, 
    resetToDefaults,
    exportSettings,
    importSettings
  } = useSettings();

  const [importError, setImportError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Determine current preset based on settings
  const getCurrentPreset = () => {
    if (!settings) return undefined;
    const { noteRange } = settings.practice;
    
    for (const [key, preset] of Object.entries(NOTE_RANGE_PRESETS)) {
      if (preset.min === noteRange.min && preset.max === noteRange.max) {
        return key;
      }
    }
    return 'custom';
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      await importSettings(file);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'インポートに失敗しました');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleSettingChange = (section: 'practice' | 'display', updates: Record<string, unknown>) => {
    setSaveStatus('saving');
    if (section === 'practice') {
      updatePracticeSettings(updates);
    } else {
      updateDisplaySettings(updates);
    }
    setTimeout(() => setSaveStatus('saved'), 500);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleNoteRangePresetChange = (presetKey: string) => {
    const preset = NOTE_RANGE_PRESETS[presetKey as keyof typeof NOTE_RANGE_PRESETS];
    if (preset) {
      handleSettingChange('practice', {
        noteRange: { min: preset.min, max: preset.max }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p>設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Settings className="w-8 h-8" />
              設定
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              学習環境をカスタマイズしてください
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Save Status */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-sm text-gray-600">保存中...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Save className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">保存済み</span>
                </>
              )}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  ホームに戻る
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="practice" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="practice" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Music className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">練習設定</span>
              <span className="sm:hidden">練習</span>
            </TabsTrigger>
            <TabsTrigger value="midi" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Piano className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">MIDI設定</span>
              <span className="sm:hidden">MIDI</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Monitor className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">表示設定</span>
              <span className="sm:hidden">表示</span>
            </TabsTrigger>
          </TabsList>

          {/* Practice Settings */}
          <TabsContent value="practice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>練習内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Question Count */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">問題数</Label>
                  <Select
                    value={settings.practice.totalQuestions.toString()}
                    onValueChange={(value) => 
                      handleSettingChange('practice', { totalQuestions: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_COUNT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Note Range Preset */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">音域プリセット</Label>
                  <Select value={getCurrentPreset()} onValueChange={handleNoteRangePresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="プリセットを選択または下記でカスタム設定" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(NOTE_RANGE_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


                {/* Difficulty */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">難易度</Label>
                  <Select
                    value={settings.practice.difficulty}
                    onValueChange={(value) => 
                      handleSettingChange('practice', { difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-gray-500">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Enable Accidentals */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">シャープ・フラット</Label>
                    <p className="text-sm text-gray-500">黒鍵盤（♯/♭）を含む練習を有効にする</p>
                  </div>
                  <Switch
                    checked={settings.practice.enableAccidentals}
                    onCheckedChange={(checked) => 
                      handleSettingChange('practice', { enableAccidentals: checked })
                    }
                  />
                </div>

                <Separator />

                {/* Auto Advance */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">自動進行</Label>
                      <p className="text-sm text-gray-500">正解後に自動で次の問題に進む</p>
                    </div>
                    <Switch
                      checked={settings.practice.autoAdvance}
                      onCheckedChange={(checked) => 
                        handleSettingChange('practice', { autoAdvance: checked })
                      }
                    />
                  </div>

                  {settings.practice.autoAdvance && (
                    <div className="space-y-3">
                      <Label className="text-sm">自動進行の遅延時間: {settings.practice.autoAdvanceDelay}ms</Label>
                      <Slider
                        value={[settings.practice.autoAdvanceDelay]}
                        onValueChange={(value) => 
                          handleSettingChange('practice', { autoAdvanceDelay: value[0] })
                        }
                        min={500}
                        max={5000}
                        step={100}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>500ms (速い)</span>
                        <span>5000ms (遅い)</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MIDI Settings */}
          <TabsContent value="midi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>入力方法</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">MIDIキーボード</Label>
                      <p className="text-sm text-gray-500">MIDIキーボードでの入力を有効にする</p>
                    </div>
                    <Switch
                      checked={settings.practice.enableMidi}
                      onCheckedChange={(checked) => 
                        handleSettingChange('practice', { enableMidi: checked })
                      }
                    />
                  </div>


                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">マウス</Label>
                      <p className="text-sm text-gray-500">ボタンクリックでの入力を有効にする</p>
                    </div>
                    <Switch
                      checked={settings.practice.enableMouse}
                      onCheckedChange={(checked) => 
                        handleSettingChange('practice', { enableMouse: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MIDI Connection */}
            {settings.practice.enableMidi && (
              <MidiConnection />
            )}
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>表示設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Theme */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">テーマ</Label>
                  <Select
                    value={settings.display.theme}
                    onValueChange={(value) => 
                      handleSettingChange('display', { theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Staff Size */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">楽譜サイズ</Label>
                  <Select
                    value={settings.display.staffSize}
                    onValueChange={(value) => 
                      handleSettingChange('display', { staffSize: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Debug Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">デバッグ情報</Label>
                    <p className="text-sm text-gray-500">開発者向けの詳細情報を表示</p>
                  </div>
                  <Switch
                    checked={settings.display.showDebugInfo}
                    onCheckedChange={(checked) => 
                      handleSettingChange('display', { showDebugInfo: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Import/Export/Reset */}
        <Card>
          <CardHeader>
            <CardTitle>設定の管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
              <Button onClick={exportSettings} variant="outline" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">設定をエクスポート</span>
                <span className="sm:hidden">エクスポート</span>
              </Button>
              
              <div className="w-full sm:w-auto">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                  id="import-settings"
                />
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <label htmlFor="import-settings" className="cursor-pointer flex items-center justify-center">
                    <Upload className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">設定をインポート</span>
                    <span className="sm:hidden">インポート</span>
                  </label>
                </Button>
              </div>
              
              <Button onClick={resetToDefaults} variant="outline" className="w-full sm:w-auto">
                <RotateCcw className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">初期設定に戻す</span>
                <span className="sm:hidden">リセット</span>
              </Button>
            </div>
            
            {importError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-400">{importError}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}