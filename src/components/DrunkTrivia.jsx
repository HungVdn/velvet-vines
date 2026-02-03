import { db } from '../firebase'
import { ref, update } from 'firebase/database'

const TRIVIA_DATA = [
    { q: "Loại cocktail nào được làm từ rượu gin, nước chanh, đường và nước có ga?", a: ["Tom Collins", "Gin Fizz", "Negroni", "Martini"], correct: 0 },
    { q: "Thành phần chính của rượu Sake Nhật Bản là gì?", a: ["Lúa mì", "Khoai tây", "Gạo", "Lúa mạch"], correct: 2 },
    { q: "Rượu Mojito có nguồn gốc từ quốc gia nào?", a: ["Mexico", "Cuba", "Brazil", "Tây Ban Nha"], correct: 1 },
    { q: "Loại rượu nào được mệnh danh là 'Nàng Tiên Xanh'?", a: ["Chartreuse", "Midori", "Absinthe", "Jägermeister"], correct: 2 },
    { q: "Thể tích tiêu chuẩn của một chai rượu vang (ml) là bao nhiêu?", a: ["500ml", "700ml", "750ml", "1000ml"], correct: 2 },
]

export default function DrunkTrivia({ onBack, isAdmin, roomId, roomState }) {
    const qIndex = roomState?.triviaIndex || 0
    const currentQ = TRIVIA_DATA[qIndex]
    const feedback = roomState?.triviaFeedback || null

    const nextQuestion = () => {
        if (!isAdmin) return
        const randomIndex = Math.floor(Math.random() * TRIVIA_DATA.length)
        update(ref(db, `rooms/${roomId}`), {
            triviaIndex: randomIndex,
            triviaFeedback: null
        })
    }

    const handleAnswer = (index) => {
        if (!isAdmin || feedback) return
        const isCorrect = index === currentQ.correct
        const newFeedback = isCorrect ? 'Chính xác!' : 'Sai rồi! Uống đi.'

        update(ref(db, `rooms/${roomId}`), { triviaFeedback: newFeedback })

        setTimeout(() => {
            nextQuestion()
        }, 2000)
    }

    return (
        <div className="game-container animate-fade">
            <button className="back-button" onClick={onBack}>← Sảnh chờ</button>
            <h2 className="gold-text">Đố Vui Nhậu Nhẹt</h2>

            {currentQ && (
                <div className="trivia-screen">
                    <div className="premium-card trivia-card">
                        <p className="question-text">{currentQ.q}</p>
                        <div className="options-grid">
                            {currentQ.a.map((opt, i) => (
                                <button
                                    key={i}
                                    className={`option-btn ${feedback ? (i === currentQ.correct ? 'correct' : 'wrong') : ''}`}
                                    onClick={() => handleAnswer(i)}
                                    disabled={!isAdmin || !!feedback}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!isAdmin && !feedback && <p className="subtitle">Chờ Quản trị viên trả lời...</p>}

                    {feedback && (
                        <div className="feedback-overlay animate-fade">
                            <h3 className={feedback.startsWith('Chính xác') ? 'gold-text' : ''}>{feedback}</h3>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        .trivia-screen { width: 100%; max-width: 400px; margin-top: 1rem; }
        .timer-bar {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          margin-bottom: 2rem;
          overflow: hidden;
        }
        .timer-fill {
          height: 100%;
          background: var(--gold);
          transition: width 1s linear, background-color 0.3s ease;
        }
        .trivia-card { min-height: 250px; }
        .question-text { font-size: 1.2rem; margin-bottom: 2rem; font-weight: 400; }
        .options-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .option-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--glass-border);
          color: white;
          padding: 15px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-body);
        }
        .option-btn:hover:not(:disabled) { background: rgba(212, 175, 55, 0.1); border-color: var(--gold); }
        .option-btn.correct { background: #2e7d32; border-color: #4caf50; }
        .option-btn.wrong { background: #c62828; border-color: #ef5350; }
        .feedback-overlay { margin-top: 2rem; text-align: center; }
        .feedback-overlay h3 { font-size: 1.5rem; }
      `}</style>
        </div>
    )
}
