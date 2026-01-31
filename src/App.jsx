import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { supabase } from './lib/supabase.js'

// ===== 判定閾値 =====
const THRESHOLDS = {
  RED: -0.1,     // -10%
  YELLOW: -0.05  // -5%
}

function judge(delta) {
  if (delta <= THRESHOLDS.RED) return 'RED'
  if (delta <= THRESHOLDS.YELLOW) return 'YELLOW'
  return 'GREEN'
}

export default function App() {
  const [records, setRecords] = useState([])
  const [date, setDate] = useState('')
  const [shoulderIR, setShoulderIR] = useState('')
  const [shoulderER, setShoulderER] = useState('')
  const [loading, setLoading] = useState(true)

  // ===== データ取得 =====
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('date', { ascending: true })

    if (!error) setRecords(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // ===== baseline（最初の1件） =====
  const baseline = records.length > 0 ? records[0] : null

  // ===== 最新日の評価 =====
  const todayEval = useMemo(() => {
    if (!baseline || records.length === 0) return null

    const latest = records[records.length - 1]

    const irDelta = baseline.shoulder_ir
      ? (latest.shoulder_ir - baseline.shoulder_ir) / baseline.shoulder_ir
      : 0

    const erDelta = baseline.shoulder_er
      ? (latest.shoulder_er - baseline.shoulder_er) / baseline.shoulder_er
      : 0

    return {
      date: latest.date,
      ir: { delta: irDelta, status: judge(irDelta) },
      er: { delta: erDelta, status: judge(erDelta) }
    }
  }, [records])

  // ===== 折れ線グラフ用データ（数値保証） =====
  const chartData = useMemo(() => {
    return records
      .filter(r => r.shoulder_ir != null && r.shoulder_er != null)
      .map(r => ({
        date: r.date,
        shoulder_ir: Number(r.shoulder_ir),
        shoulder_er: Number(r.shoulder_er)
      }))
  }, [records])

  // ===== 記録追加 =====
  const addRecord = async () => {
    if (!date) return

    const { error } = await supabase.from('records').insert({
      date,
      shoulder_ir: Number(shoulderIR),
      shoulder_er: Number(shoulderER)
    })

    if (error) {
      alert(error.message)
      return
    }

    setDate('')
    setShoulderIR('')
    setShoulderER('')
    fetchRecords()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Daily ROM Check</h1>

      {/* ===== 判定表示 ===== */}
      {todayEval && (
        <div
          style={{
            padding: 12,
            marginBottom: 20,
            borderLeft: '6px solid #333',
            background: '#f5f5f5'
          }}
        >
          <strong>{todayEval.date} の判定</strong>
          <div>IR：{(todayEval.ir.delta * 100).toFixed(1)}% → {todayEval.ir.status}</div>
          <div>ER：{(todayEval.er.delta * 100).toFixed(1)}% → {todayEval.er.status}</div>
        </div>
      )}

      {/* ===== 入力 ===== */}
      <div style={{ marginBottom: 16 }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input type="number" placeholder="IR" value={shoulderIR} onChange={e => setShoulderIR(e.target.value)} />
        <input type="number" placeholder="ER" value={shoulderER} onChange={e => setShoulderER(e.target.value)} />
        <button onClick={addRecord}>記録する</button>
      </div>

      {/* ===== 一覧 ===== */}
      {records.map(r => (
        <div key={r.id}>
          {r.date} ｜ IR: {r.shoulder_ir} ｜ ER: {r.shoulder_er}
        </div>
      ))}

      {/* ===== 折れ線グラフ（直線） ===== */}
      {chartData.length > 1 && (
        <div style={{ marginTop: 40, width: '100%', height: 320 }}>
          <h3>ROM トレンド</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />

              <Line
                type="linear"
                dataKey="shoulder_ir"
                name="Shoulder IR"
                strokeWidth={2}
                dot={{ r: 4 }}
              />

              <Line
                type="linear"
                dataKey="shoulder_er"
                name="Shoulder ER"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
