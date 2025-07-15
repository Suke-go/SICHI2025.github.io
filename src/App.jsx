import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Heart, Activity, Sparkles, MessageCircle, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

// --- Helper Functions & Components ---

// 時系列データ生成（モック） - これはバックエンドから取得されるデータなので、将来的には不要
function generateTimeSeriesData(seconds, segments) {
  const data = [];
  for (let i = 0; i < seconds; i++) {
    // Find which segment this second belongs to
    let currentSegment = segments[0];
    for (const seg of segments) {
        const timeParts = seg.timeRange.split(' - ');
        const start = timeParts[0].split(':').reduce((acc, time) => (60 * acc) + +time);
        const end = timeParts[1].split(':').reduce((acc, time) => (60 * acc) + +time);
        if (i >= start && i <= end) {
            currentSegment = seg;
            break;
        }
    }
    
    const baseHR = currentSegment.avgHeartRate;
    const baseEDA = currentSegment.avgEda;
    
    data.push({
      second: i,
      heartRate: baseHR + (Math.random() - 0.5) * 10,
      eda: Math.max(0, baseEDA + (Math.random() - 0.5) * 0.2)
    });
  }
  return data;
}


// ふわともキャラクターコンポーネント
const Fuwatomo = ({ emotion = 'happy', size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const emotionEmojis = {
    happy: '😊',
    calm: '😌',
    anxious: '😰',
    excited: '🥰',
    tired: '😪',
    energetic: '💪',
    peaceful: '😇'
  };

  return (
    <div className={`${sizeClasses[size]} bg-pink-200 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300`}>
      <span className="text-3xl">{emotionEmojis[emotion] || '😊'}</span>
    </div>
  );
};

// セグメントコンポーネント
const TranscriptionSegment = ({ segment, isActive, onClick }) => {
  const emotionColors = {
    happy: 'border-yellow-300 bg-yellow-50',
    calm: 'border-blue-300 bg-blue-50',
    anxious: 'border-red-300 bg-red-50',
    excited: 'border-pink-300 bg-pink-50',
    tired: 'border-gray-300 bg-gray-50',
    energetic: 'border-green-300 bg-green-50',
    peaceful: 'border-purple-300 bg-purple-50'
  };

  return (
    <div
      className={`mb-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
        emotionColors[segment.emotion]
      } ${isActive ? 'ring-4 ring-pink-400 scale-102' : 'hover:scale-101'}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">{segment.timeRange}</span>
          <span className="text-xs bg-white px-2 py-1 rounded-full">{segment.topic}</span>
        </div>
        <Fuwatomo emotion={segment.emotion} size="small" />
      </div>
      <p className="text-gray-700 leading-relaxed">{segment.text}</p>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          {Math.round(segment.avgHeartRate)} bpm
        </span>
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          EDA: {segment.avgEda.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

// 統合グラフコンポーネント
const IntegratedGraph = ({ sessionData, activeSegmentId }) => {
  const canvasRef = useRef(null);
  const { timeSeriesData, segments, insights } = sessionData;

  useEffect(() => {
    if (!timeSeriesData || !segments) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // セグメント背景を描画
    segments.forEach((segment) => {
        const timeParts = segment.timeRange.split(' - ');
        const startTime = timeParts[0].split(':').reduce((acc, time) => (60 * acc) + +time);
        const endTime = timeParts[1].split(':').reduce((acc, time) => (60 * acc) + +time);

        const startX = (startTime / timeSeriesData.length) * width;
        const endX = (endTime / timeSeriesData.length) * width;

      const colors = {
        happy: 'rgba(255, 235, 59, 0.1)',
        calm: 'rgba(33, 150, 243, 0.1)',
        anxious: 'rgba(244, 67, 54, 0.1)',
        excited: 'rgba(233, 30, 99, 0.1)',
        tired: 'rgba(158, 158, 158, 0.1)',
        energetic: 'rgba(76, 175, 80, 0.1)',
        peaceful: 'rgba(156, 39, 176, 0.1)'
      };

      ctx.fillStyle = colors[segment.emotion] || 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(startX, 0, endX - startX, height);

      if (segment.id === activeSegmentId) {
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, 0, endX - startX, height);
      }
    });

    // グリッド線
    ctx.strokeStyle = '#FFE0EC';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (height / 4) * i);
      ctx.lineTo(width, (height / 4) * i);
      ctx.stroke();
    }

    // 心拍数グラフを描画
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    timeSeriesData.forEach((point, idx) => {
      const x = (idx / timeSeriesData.length) * width;
      const normalizedHR = (point.heartRate - 60) / 30; // 60-90の範囲で正規化
      const y = height - (normalizedHR * height * 0.8 + height * 0.1);

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // EDAグラフを描画
    ctx.strokeStyle = '#9370DB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    timeSeriesData.forEach((point, idx) => {
      const x = (idx / timeSeriesData.length) * width;
      const y = height - (point.eda * height * 0.8 + height * 0.1);

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 感情ピークマーカー
    insights.emotionalPeaks.forEach(peak => {
      const [min, sec] = peak.time.split(':').map(Number);
      const totalSec = min * 60 + sec;
      const x = (totalSec / timeSeriesData.length) * width;

      ctx.fillStyle = peak.emotion === 'anxious' ? '#FF4444' : '#FF69B4';
      ctx.beginPath();
      ctx.arc(x, 30, 6, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [timeSeriesData, segments, activeSegmentId, insights]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-pink-500 font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          振り返りセッションの生体データ
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            心拍数
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            EDA
          </span>
        </div>
      </div>
      <canvas ref={canvasRef} width={600} height={250} className="w-full" />
      <div className="mt-4 text-xs text-gray-500 text-center">
        時間: 0:00 - {sessionData.duration}
      </div>
    </div>
  );
};

// 洞察コンポーネント
const InsightsPanel = ({ insights }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg">
      <h3 className="text-purple-600 font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5" />
        ふわともの洞察
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">感情のピークポイント</h4>
          {insights.emotionalPeaks.map((peak, idx) => (
            <div key={idx} className="flex items-start gap-2 mb-2">
              <span className="text-xs bg-white px-2 py-1 rounded-full">{peak.time}</span>
              <p className="text-sm text-gray-600">{peak.description}</p>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">パターン分析</h4>
          <ul className="space-y-1">
            {insights.patterns.map((pattern, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-pink-400">•</span>
                {pattern}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 p-4 bg-white rounded-xl">
          <div className="flex items-start gap-3">
            <Fuwatomo size="small" emotion="happy" />
            <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Loading and Error Components ---

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 flex items-center justify-center">
    <div className="text-center">
      <Fuwatomo size="large" emotion="calm" />
      <p className="mt-4 text-pink-400 text-lg">ふわともが振り返りを準備中...</p>
      <div className="mt-2 flex justify-center gap-1">
        <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  </div>
);

const ErrorScreen = ({ error }) => (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-2xl shadow-lg">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">おっと、問題が発生しました</h2>
            <p className="text-gray-600 mb-6">データの取得中にエラーが発生しました。しばらくしてからもう一度お試しください。</p>
            <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
                エラー詳細: {error.message}
            </p>
        </div>
    </div>
);


// --- メインアプリコンポーネント ---
export default function App() {
  const [sessionData, setSessionData] = useState(null);
  const [activeSegmentId, setActiveSegmentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // APIエンドポイントからデータを取得
        // 開発中はモックサーバーやローカルのJSONファイルを使うと便利です
        // const response = await fetch('/api/session-data');
        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }
        // const data = await response.json();

        const response = await fetch('http://localhost:3001/api/session-data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        setSessionData(data);

      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, []); // 空の依存配列で、コンポーネントのマウント時に一度だけ実行

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!sessionData) {
    // データがない場合（エラーではないが、データがnullの場合）
    return <ErrorScreen error={{ message: "セッションデータが見つかりませんでした。" }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fuwatomo size="small" emotion="happy" />
              <h1 className="text-2xl font-bold text-pink-500">ふわふわダイアリー</h1>
            </div>
            <div className="flex items-center gap-4 text-pink-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{sessionData.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{sessionData.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 統合グラフ */}
        <div className="mb-8">
          <IntegratedGraph
            sessionData={sessionData}
            activeSegmentId={activeSegmentId}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左カラム - 振り返り内容 */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-pink-500 mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                今日の振り返り
              </h2>
              
              <div className="space-y-2">
                {sessionData.segments.map((segment) => (
                  <TranscriptionSegment
                    key={segment.id}
                    segment={segment}
                    isActive={activeSegmentId === segment.id}
                    onClick={() => setActiveSegmentId(segment.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 右カラム - 洞察 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <InsightsPanel insights={sessionData.insights} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}