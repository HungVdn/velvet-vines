import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update, onValue } from 'firebase/database'
import { TRIVIA_DEFAULT } from '../data/defaults'

export default function DrunkTrivia({ onBack, isAdmin, isModerator, roomId, roomState }) {
    const [triviaData, setTriviaData] = useState(TRIVIA_DEFAULT)
    const qIndex = roomState?.triviaIndex || 0
    const feedback = roomState?.triviaFeedback || null

    useEffect(() => {
        const contentRef = ref(db, 'content/trivia')
        const unsubscribe = onValue(contentRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                setTriviaData(Array.isArray(data) ? data : Object.values(data))
            } else {
                setTriviaData(TRIVIA_DEFAULT)
            }
        })
        return () => unsubscribe()
    }, [])

    const currentQ = triviaData[qIndex % triviaData.length]

    const nextQuestion = () => {
        if (!isAdmin && !isModerator) return
        const randomIndex = Math.floor(Math.random() * triviaData.length)
        update(ref(db, `rooms/${roomId}`), {
            triviaIndex: randomIndex,
            triviaFeedback: null
        })
    }

    const handleAnswer = (index) => {
        if ((!isAdmin && !isModerator) || feedback) return
        const isCorrect = index === parseInt(currentQ.correct)
        const newFeedback = isCorrect ? 'Chính xác!' : 'Sai rồi! Uống đi.'

        update(ref(db, `rooms/${roomId}`), { triviaFeedback: newFeedback })

        setTimeout(() => {
            nextQuestion()
        }, 2000)
    }

    const getOptions = () => {
        if (currentQ.a) return currentQ.a // Old format
        return [currentQ.a1, currentQ.a2, currentQ.a3, currentQ.a4].filter(Boolean)
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
                            {getOptions().map((opt, i) => (
                                <button
                                    key={i}
                                    className={`option-btn ${feedback ? (i === parseInt(currentQ.correct) ? 'correct' : 'wrong') : ''}`}
                                    onClick={() => handleAnswer(i)}
                                    disabled={(!isAdmin && !isModerator) || !!feedback}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!isAdmin && !isModerator && !feedback && <p className="subtitle">Chờ Quản trị viên trả lời...</p>}

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
