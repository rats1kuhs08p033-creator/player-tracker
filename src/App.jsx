import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [records, setRecords] = useState([])
  const [date, setDate] = useState('')
  const [shoulderIr, setShoulderIr] = useState('')
  const [shoulderEr, setShoulderEr] = useState('')
  const [loading, setLoading] = useState(true)

  // ===== 取得 =====
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('records')
      .select('id, date, shoulder_ir, shoulder_er, created_at')
      .order('date', { ascending: true })

    if (error) {
      console.error('fetch error:', error)
      return
    }

    setRecords(data)
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
        date,
        shoulder_ir: Number(shoulderIr),
        shoulder_er: Number(shoulderEr),
      })

    if (error) {
      console.error('insert error:', error)
      alert(error.message)
      return
    }

    setDate('')
    setShoulderIr('')
    setShoulderEr('')
    fetchRecords()
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h1>ROM Records</h1>

      {/* 入力 */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <input
          type="number"
          placeholder="肩 内旋 (IR)"
          value={shoulderIr}
          onChange={e => setShoulderIr(e.target.value)}
        />
        <input
          type="number"
          placeholder="肩 外旋 (ER)"
          value={shoulderEr}
          onChange={e => setShoulderEr(e.target.value)}
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