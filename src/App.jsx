import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ===== 評価対象メトリクス（1選手前提） =====
const METRICS = [
  {
    key: 'shoulderIR',
    label: '肩内旋ROM',
    unit: 'deg',
    red: -0.10,
    yellow: -0.05,
    reasonRed: '可動域が大きく低下（介入推奨）',
    reasonYellow: '軽度低下（疲労・硬さ疑い）'
  },
  {
    key: 'shoulderER',
    label: '肩外旋ROM',
    unit: 'deg',
    red: -0.10,
    yellow: -0.05,
    reasonRed: '外旋可動域低下（投球・打撃リスク）',
    reasonYellow: '軽度低下（経過観察）'
  }
];

// ===== 判定ロジック =====
function evaluate(delta, m) {
  if (delta <= m.red) return { status: 'RED', reason: m.reasonRed };
  if (delta <= m.yellow) return { status: 'YELLOW', reason: m.reasonYellow };
  return { status: 'GREEN', reason: '問題なし' };
}

export default function App() {
  const [date, setDate] = useState('');
  const [values, setValues] = useState({});
  const [records, setRecords] = useState([]);

  // ===== 起動時に localStorage から復元 =====
  useEffect(() => {
    const saved = localStorage.getItem('records');
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  // ===== 基準値（初回測定をbaseline） =====
  const baseline = records[0] || {};

  // ===== 記録追加 =====
  const addRecord = () => {
    if (!date) return;
    const newRecords = [...records, { date, ...values }];
    setRecords(newRecords);
    localStorage.setItem('records', JSON.stringify(newRecords));
    setValues({});
    setDate('');
  };

  // ===== 記録削除 =====
  const deleteRecord = (index) => {
    const newRecords = records.filter((_, i) => i !== index);
    setRecords(newRecords);
    localStorage.setItem('records', JSON.stringify(newRecords));
  };

  // ===== 今日の評価 =====
  const todayEvaluation = useMemo(() => {
    if (records.length === 0) return [];
    const latest = records[records.length - 1];

    return METRICS.map(m => {
      if (baseline[m.key] == null || latest[m.key] == null) return null;
      const delta = (latest[m.key] - baseline[m.key]) / baseline[m.key];
      const evalResult = evaluate(delta, m);
      return {
        ...m,
        delta,
        ...evalResult
      };
    }).filter(Boolean);
  }, [records]);

  // ===== 表示用（RED / YELLOWのみ） =====
  const alertItems = todayEvaluation.filter(e => e.status !== 'GREEN');

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daily ROM Check（Single Player）</h1>

      {/* ===== 判断ゾーン ===== */}
      {alertItems.length > 0 ? (
        <div className="mb-6 p-4 border-l-4 border-red-600 bg-red-50">
          <div className="font-semibold mb-2">▶ 本日の判断：介入検討</div>
          {alertItems.map(a => (
            <div key={a.key} className="mb-2">
              <div className="font-medium">{a.label}</div>
              <div className="text-sm">
                Δ {(a.delta * 100).toFixed(1)}% ／ {a.status}
              </div>
              <div className="text-sm text-gray-700">理由：{a.reason}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 p-4 border-l-4 border-green-600 bg-green-50">
          ▶ 本日の判断：介入不要（許容範囲）
        </div>
      )}

      {/* ===== 入力ゾーン ===== */}
      <div className="mb-4">
        <input
          type="date"
          className="border p-2 mr-2 w-full sm:w-auto"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {METRICS.map(m => (
          <input
            key={m.key}
            type="number"
            className="border p-2"
            placeholder={`${m.label} (${m.unit})`}
            value={values[m.key] || ''}
            onChange={e => setValues({ ...values, [m.key]: Number(e.target.value) })}
          />
        ))}
      </div>

      <button
        onClick={addRecord}
        className="bg-black text-white px-4 py-2 rounded mb-6"
      >
        記録する
      </button>

      {/* ===== トレンド（確認用） ===== */}
      {records.length > 1 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-2">ROM トレンド（確認用）</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={records}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {METRICS.map(m => (
                <Line
                  key={m.key}
                  dataKey={m.key}
                  name={m.label}
                  strokeWidth={2}
                  dot
                  type="linear"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ===== 記録一覧（削除可） ===== */}
      {records.length > 0 && (
        <div className="mt-8 mb-6">
          <h2 className="font-semibold mb-2">記録一覧</h2>
          <ul className="border rounded p-2">
            {records.map((r, i) => (
              <li key={i} className="flex justify-between border-b last:border-b-0 py-1">
                <span>{r.date} - {METRICS.map(m => `${m.label}: ${r[m.key]}${m.unit}`).join(' / ')}</span>
                <button
                  className="text-red-600 font-semibold ml-2"
                  onClick={() => deleteRecord(i)}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}