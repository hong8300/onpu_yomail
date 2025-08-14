import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  Music,
  Play,
  Settings,
  History,
  Piano,
  BookOpen,
  Zap,
  Target
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Onpu - 楽譜学習
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            音符を見て瞬時に答える
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            楽譜を読む力を向上させるための練習アプリです。<br />
            ド（C）から数えることなく、音符を見て瞬時に音名を答えられるようになりましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href="/practice">
                <Play className="w-5 h-5 mr-2" />
                練習を始める
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <a href="/settings">
                <Settings className="w-5 h-5 mr-2" />
                設定
              </a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                瞬時認識の練習
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                音符を見て瞬時に音名を答える練習で、楽譜読解力を向上させます。
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                ト音記号・ヘ音記号
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                ト音記号、ヘ音記号の両方に対応。幅広い音域で練習できます。
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Piano className="w-5 h-5 text-purple-600" />
                MIDI対応
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                MIDIキーボードでの入力に対応。実際の鍵盤で練習できます。
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                カスタマイズ可能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                問題数、音域、難易度など、個人のレベルに合わせて設定できます。
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-orange-600" />
                学習履歴
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                練習の進捗を記録し、苦手な音符を分析して効率的に学習できます。
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-red-600" />
                プロ仕様の楽譜
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Vexflowライブラリを使用した、美しく正確な楽譜表示です。
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            クイックアクセス
          </h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href="/practice">
                <Play className="w-4 h-4 mr-2" />
                練習ページ
              </a>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href="/history">
                <History className="w-4 h-4 mr-2" />
                学習履歴
              </a>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                設定
              </a>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2025 Onpu - 楽譜学習アプリ. すべての機能を無料でご利用いただけます。
          </p>
        </footer>
      </div>
    </div>
  );
}
