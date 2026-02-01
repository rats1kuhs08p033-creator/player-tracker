import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [records, setRecords] = useState([])
  const [date, setDate] = useState('')
  const [shoulder_ir, setShoulder_ir] = useState('')
  const [shoulder_er, setShoulder_er] = useState('')
  const [loading, setLoading] = useState(true)

  // ===== データ取得 =====
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('date', { ascending: true })

    if (!error) {
      setRecords(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // ===== 追加 =====
  const addRecord = async () => {
    if (!date) {
      alert('日付を入力してください')
      return
    }

    const { error } = await supabase
      .from('records')
      .insert({
        date: date,
        shoulder_ir: Number(shoulder_ir),
        shoulder_er: Number(shoulder_er),
      })

    if (error) {
      alert(error.message)
      return
    }

    setDate('')
    setShoulder_ir('')
    setShoulder_er('')
    fetchRecords()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Daily ROM Check</h1>

      {/* 入力欄 */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <input
          type="number"
          placeholder="肩 内旋 (IR)"
          value={shoulder_ir}
          onChange={e => setShoulder_ir(e.target.value)}
        />
        <input
          type="number"
          placeholder="肩 外旋 (ER)"
          value={shoulder_er}
          onChange={e => setShoulder_er(e.target.value)}
        />
        <button onClick={addRecord}>記録する</button>
      </div>

      {/* 一覧 */}
      {records.length === 0 && <div>No records yet</div>}

      {records.map(r => (
        <div key={r.id}>
          {r.date} ｜ IR: {r.shoulder_ir} ｜ ER: {r.shoulder_er}
        </div>
      ))}
    </div>
  )
}