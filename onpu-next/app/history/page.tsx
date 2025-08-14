'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHistory } from '@/hooks/useHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  History as HistoryIcon, 
  TrendingUp, 
  Target, 
  Clock, 
  Music, 
  Award,
  Calendar,
  Download,
  Upload,
  Trash2,
  Home,
  BarChart3
} from 'lucide-react';

export default function HistoryPage() {
  const {
    history,
    isLoading,
    getRecentSessions,
    exportHistory,
    importHistory,
    clearHistory
  } = useHistory();

  const [importError, setImportError] = useState<string | null>(null);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      await importHistory(file);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'インポートに失敗しました');
    }
    
    event.target.value = '';
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    }
    return `${remainingSeconds}秒`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAccuracyBadgeVariant = (accuracy: number) => {
    if (accuracy >= 90) return 'default';
    if (accuracy >= 70) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p>履歴を読み込み中...</p>
        </div>
      </div>
    );
  }

  const recentSessions = getRecentSessions(20);
  const stats = history.overallStats;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <HistoryIcon className="w-8 h-8" />
              学習履歴
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              学習の進捗と統計を確認できます
            </p>
          </div>
          
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">総セッション数</p>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">総問題数</p>
                  <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">総合正解率</p>
                  <p className={`text-2xl font-bold ${getAccuracyColor(stats.overallAccuracy)}`}>
                    {stats.overallAccuracy.toFixed(1)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">総練習時間</p>
                  <p className="text-2xl font-bold">{formatDuration(stats.totalPracticeTime)}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions" className="text-xs md:text-sm">
              <span className="hidden sm:inline">セッション履歴</span>
              <span className="sm:hidden">履歴</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-xs md:text-sm">
              <span className="hidden sm:inline">詳細統計</span>
              <span className="sm:hidden">統計</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="text-xs md:text-sm">
              <span className="hidden sm:inline">データ管理</span>
              <span className="sm:hidden">管理</span>
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>最近のセッション</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">まだセッション履歴がありません</p>
                    <p className="text-sm text-gray-400 mt-1">練習を開始して履歴を記録しましょう！</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <Badge variant={getAccuracyBadgeVariant(session.results?.accuracy || 0)}>
                              {session.results?.accuracy.toFixed(1)}%
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium">
                              {formatDate(session.startTime)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {session.results?.correctAnswers || 0} / {session.results?.totalQuestions || 0} 問正解
                              {session.settings.clef && (
                                <span className="ml-2">
                                  • {session.settings.clef === 'treble' ? 'ト音記号' : 
                                      session.settings.clef === 'bass' ? 'ヘ音記号' : '両方'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatDuration(session.results?.totalTime || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            平均 {session.results?.averageResponseTime.toFixed(0)}ms
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Strong Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    得意な音符
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.strongNotes.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">データが不足しています</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.strongNotes.map((note, index) => (
                        <div key={note} className="flex items-center justify-between">
                          <span className="font-medium">{note}</span>
                          <Badge variant="default">得意</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weak Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                    練習が必要な音符
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.weakNotes.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">すべての音符が得意です！</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.weakNotes.map((note, index) => (
                        <div key={note} className="flex items-center justify-between">
                          <span className="font-medium">{note}</span>
                          <Badge variant="destructive">要練習</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Stats */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>その他の統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.favoriteClef === 'treble' ? 'ト音記号' : 'ヘ音記号'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">よく使う記号</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.streakDays}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">連続練習日数</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.lastPracticeDate ? formatDate(stats.lastPracticeDate).split(' ')[0] : '-'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">最後の練習日</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>履歴データの管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Export/Import */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">データの移行</h3>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
                    <Button onClick={exportHistory} variant="outline" className="w-full sm:w-auto">
                      <Download className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">履歴をエクスポート</span>
                      <span className="sm:hidden">エクスポート</span>
                    </Button>
                    
                    <div className="w-full sm:w-auto">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                        id="import-history"
                      />
                      <Button asChild variant="outline" className="w-full sm:w-auto">
                        <label htmlFor="import-history" className="cursor-pointer flex items-center justify-center">
                          <Upload className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">履歴をインポート</span>
                          <span className="sm:hidden">インポート</span>
                        </label>
                      </Button>
                    </div>
                  </div>
                  
                  {importError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-700 dark:text-red-400">{importError}</p>
                    </div>
                  )}
                </div>

                {/* Clear Data */}
                <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-red-600">危険な操作</h3>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                      すべての学習履歴を削除します。この操作は取り消せません。
                    </p>
                    <Button
                      onClick={() => {
                        if (window.confirm('本当にすべての履歴を削除しますか？この操作は取り消せません。')) {
                          clearHistory();
                        }
                      }}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      すべての履歴を削除
                    </Button>
                  </div>
                </div>

                {/* Data Summary */}
                <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium">データ概要</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{history.sessions.length}</p>
                      <p className="text-gray-600 dark:text-gray-400">保存されたセッション</p>
                    </div>
                    <div>
                      <p className="font-medium">{stats.totalQuestions}</p>
                      <p className="text-gray-600 dark:text-gray-400">総問題数</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {Math.round(JSON.stringify(history).length / 1024)} KB
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">データサイズ</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {history.lastUpdated ? formatDate(history.lastUpdated).split(' ')[0] : '-'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">最終更新日</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}