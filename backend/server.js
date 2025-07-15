const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

// --- Helper Functions ---
function generateTimeSeriesData(seconds, segments) {
  const data = [];
  for (let i = 0; i < seconds; i++) {
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

// --- API Endpoint ---
app.get('/api/session-data', (req, res) => {
  // モックデータ（App.jsxから移植）
  const mockData = {
    date: '2025-01-20',
    duration: '5:42',
    startTime: '21:00',
    segments: [
      { id: 1, timeRange: '0:00 - 0:45', text: '今日は朝からカフェに行って、モーニングを食べながら仕事の準備をしたんだけど、', topic: '朝のルーティン', avgHeartRate: 68, avgEda: 0.3, emotion: 'calm' },
      { id: 2, timeRange: '0:45 - 1:30', text: '実は今日、すごく大事なプレゼンがあって...正直めちゃくちゃ緊張してて、朝からドキドキが止まらなかったの。', topic: '仕事のプレゼン', avgHeartRate: 85, avgEda: 0.8, emotion: 'anxious' },
      { id: 3, timeRange: '1:30 - 2:15', text: 'でもね、プレゼンが終わったら上司にすごく褒められて！「よく準備してたね」って言われて、本当に嬉しかった〜', topic: '成功体験', avgHeartRate: 78, avgEda: 0.7, emotion: 'excited' },
      { id: 4, timeRange: '2:15 - 3:00', text: 'お昼は同僚とランチに行って、プレゼンの話で盛り上がっちゃった。みんな応援してくれてたみたいで、', topic: '同僚との交流', avgHeartRate: 72, avgEda: 0.5, emotion: 'happy' },
      { id: 5, timeRange: '3:00 - 3:45', text: '午後は少し疲れが出てきて、集中力が切れちゃった時間もあったけど、コーヒー飲んで気分転換したら復活！', topic: '午後の疲れ', avgHeartRate: 70, avgEda: 0.4, emotion: 'tired' },
      { id: 6, timeRange: '3:45 - 4:30', text: '夕方は早めに仕事を切り上げて、ジムに行ってきた。最近運動不足だったから、すごくスッキリした感じ。', topic: '運動', avgHeartRate: 82, avgEda: 0.6, emotion: 'energetic' },
      { id: 7, timeRange: '4:30 - 5:42', text: '家に帰ってきてお風呂に入って、今こうして振り返ってみると、今日は本当に充実した一日だったなって思う。明日も頑張ろう！', topic: '一日の振り返り', avgHeartRate: 66, avgEda: 0.3, emotion: 'peaceful' }
    ],
    insights: {
      emotionalPeaks: [
        { time: '1:15', emotion: 'anxious', description: 'プレゼンの話で緊張がピークに' },
        { time: '1:50', emotion: 'excited', description: '褒められた瞬間の喜び' }
      ],
      patterns: [
        '緊張する場面（プレゼン）で心拍数が85bpmまで上昇',
        '運動時を除くと、リラックス時の心拍数は65-70bpm程度で安定',
        '社交的な場面（ランチ）では適度な興奮状態を維持'
      ],
      summary: '今日は大きなチャレンジ（プレゼン）を乗り越えた達成感のある一日でした。緊張はしたものの、それを良いパフォーマンスに繋げられた様子が生体データからも読み取れます。特に成功体験後の心理状態が安定しており、自信につながったことがわかります。'
    }
  };

  // 時系列データを生成して追加
  mockData.timeSeriesData = generateTimeSeriesData(342, mockData.segments);

  res.json(mockData);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
