import { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { ref, update, onValue, set } from 'firebase/database'
import { TRIVIA_DEFAULT } from '../data/defaults'
import logoOuroboros from '../assets/logo_ouroboros.png'

export default function DrunkTrivia({ onBack, isAdmin, isModerator, userId, roomId, roomState, players, advanceTurn }) {
    const [triviaData, setTriviaData] = useState(TRIVIA_DEFAULT)
    const [localTime, setLocalTime] = useState(0)

    // Sync states from Firebase
    const phase = roomState?.triviaPhase || 'category' // category, level, pre-reveal, thinking, answering, result
    const selectedCategory = roomState?.triviaCategory || null
    const selectedLevel = roomState?.triviaLevel || null
    const currentQ = roomState?.triviaQuestion || null
    const timerStart = roomState?.triviaTimerStart || null
    const timerDuration = roomState?.triviaTimerDuration || 0
    const feedback = roomState?.triviaFeedback || null
    const selectedAnswer = roomState?.triviaSelectedAnswer || null

    const playerSlots = roomState?.playerSlots || {}
    const activeTurnSlot = roomState?.activeTurnSlot || 0
    const activePlayer = players.find((p, idx) => {
        const slot = playerSlots[p.id] !== undefined ? playerSlots[p.id] : idx
        return slot === activeTurnSlot
    })
    const isMyTurn = activePlayer?.id === userId
    const canControl = isAdmin || isModerator || isMyTurn

    useEffect(() => {
        const contentRef = ref(db, 'content/trivia_v2')
        const unsubscribe = onValue(contentRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                setTriviaData(data)
            } else {
                setTriviaData(TRIVIA_DEFAULT)
            }
        })
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        let interval
        if (timerStart && (phase === 'thinking' || phase === 'answering')) {
            interval = setInterval(() => {
                const now = Date.now()
                const elapsed = Math.floor((now - timerStart) / 1000)
                const remaining = Math.max(0, timerDuration - elapsed)
                setLocalTime(remaining)

                if (remaining <= 0 && canControl) {
                    if (phase === 'thinking') {
                        startAnswering()
                    } else if (phase === 'answering') {
                        revealResult(null) // Timeout
                    }
                }
            }, 100)
        }
        return () => clearInterval(interval)
    }, [timerStart, phase, timerDuration, canControl])

    useEffect(() => {
        // Reset trivia state when the turn changes
        if (canControl) {
            resetGame()
        }
    }, [activeTurnSlot])

    const selectCategory = (cat) => {
        if (!canControl) return
        update(ref(db, `rooms/${roomId}`), {
            triviaCategory: cat,
            triviaPhase: 'level'
        })
    }

    const selectLevel = (lv) => {
        if (!canControl) return
        const questions = triviaData[selectedCategory][lv]
        const randomQ = questions[Math.floor(Math.random() * questions.length)]
        update(ref(db, `rooms/${roomId}`), {
            triviaLevel: lv,
            triviaQuestion: randomQ,
            triviaPhase: 'pre-reveal'
        })
    }

    const revealQuestion = () => {
        if (!canControl) return
        update(ref(db, `rooms/${roomId}`), {
            triviaPhase: 'thinking',
            triviaTimerStart: Date.now(),
            triviaTimerDuration: 10 // 10 seconds to think
        })
    }

    const startAnswering = () => {
        if (!canControl) return
        update(ref(db, `rooms/${roomId}`), {
            triviaPhase: 'answering',
            triviaTimerStart: Date.now(),
            triviaTimerDuration: 15 // 15 seconds to answer
        })
    }

    const revealResult = (ansIndex) => {
        if (!canControl) return
        const isCorrect = ansIndex === currentQ.correct
        update(ref(db, `rooms/${roomId}`), {
            triviaPhase: 'result',
            triviaSelectedAnswer: ansIndex,
            triviaFeedback: isCorrect ? 'CHÍNH XÁC! 🏆' : (ansIndex === null ? 'HẾT GIỜ! ⏳' : 'SAI RỒI! 🍷')
        })
    }

    const resetGame = () => {
        update(ref(db, `rooms/${roomId}`), {
            triviaPhase: 'category',
            triviaCategory: null,
            triviaLevel: null,
            triviaQuestion: null,
            triviaTimerStart: null,
            triviaFeedback: null,
            triviaSelectedAnswer: null
        })
    }

    const renderPhase = () => {
        switch (phase) {
            case 'category':
                return (
                    <div className="selection-screen animate-fade">
                        <h3 className="gold-text">Chọn Chủ Đề</h3>
                        <div className="options-grid">
                            {Object.keys(triviaData).map(cat => (
                                <button key={cat} className="premium-button cat-btn" onClick={() => selectCategory(cat)}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            case 'level':
                return (
                    <div className="selection-screen animate-fade">
                        <button className="back-mini" onClick={() => update(ref(db, `rooms/${roomId}`), { triviaPhase: 'category' })}>← Đổi chủ đề</button>
                        <h3 className="gold-text">{selectedCategory}</h3>
                        <p className="subtitle pink-text">Chọn độ khó</p>
                        <div className="level-grid">
                            {[1, 2, 3].map(lv => (
                                <button key={lv} className={`level-btn lv-${lv}`} onClick={() => selectLevel(lv)}>
                                    Cấp {lv}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            case 'pre-reveal':
                return (
                    <div className="card-reveal-screen animate-fade" onClick={revealQuestion}>
                        <div className="premium-card face-down-card">
                            <div className="ouroboros-stamp" style={{ backgroundImage: `url(${logoOuroboros})` }}></div>
                            <p className="tap-hint">Chạm để giải ấn câu hỏi</p>
                        </div>
                    </div>
                )
            case 'thinking':
            case 'answering':
            case 'result':
                const options = [currentQ.a1, currentQ.a2, currentQ.a3, currentQ.a4].filter(Boolean)
                return (
                    <div className="active-game-screen animate-fade">
                        <div className="timer-container">
                            <div className="timer-label">{phase === 'thinking' ? 'Đang suy nghĩ...' : 'Trả lời ngay!'}</div>
                            <div className="timer-bar">
                                <div className="timer-fill" style={{ width: `${(localTime / timerDuration) * 100}%` }}></div>
                            </div>
                            <div className="timer-value">{localTime}s</div>
                        </div>

                        <div className={`premium-card trivia-play-card ${phase === 'result' ? 'result-mode' : ''}`}>
                            <p className="question-text">{currentQ.q}</p>

                            <div className="options-stack">
                                {options.map((opt, i) => {
                                    let btnClass = ""
                                    if (phase === 'result') {
                                        if (i === currentQ.correct) btnClass = "correct"
                                        else if (i === selectedAnswer) btnClass = "wrong"
                                    }
                                    return (
                                        <button
                                            key={i}
                                            className={`trivia-option ${btnClass}`}
                                            onClick={() => revealResult(i)}
                                            disabled={!canControl || phase !== 'answering'}
                                        >
                                            <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                                            <span className="opt-text">{opt}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {phase === 'result' && (
                            <div className="result-controls animate-fade">
                                <h2 className="feedback-text gold-text">{feedback}</h2>
                                {(isAdmin || isModerator) ? (
                                    <button className="premium-button" onClick={advanceTurn}>Tiếp tục - Sang lượt</button>
                                ) : (
                                    <p className="subtitle">Chờ Quản trị viên chuyển lượt...</p>
                                )}
                            </div>
                        )}
                    </div>
                )
            default: return null
        }
    }

    return (
        <div className="game-container trivia-overhaul">
            {(isAdmin || isModerator) && <button className="back-button" onClick={onBack}>← Sảnh chờ</button>}
            <h2 className="gold-text main-title">Đố Vui Nhậu Nhẹt</h2>
            <div className="trivia-content">
                {renderPhase()}
            </div>

            <style jsx>{`
                .trivia-overhaul {
                    max-width: 500px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .main-title { margin-bottom: 2rem; letter-spacing: 4px; font-family: var(--font-magic); }
                .trivia-content { width: 100%; position: relative; }

                .options-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 1rem; }
                .cat-btn { padding: 20px; font-size: 1rem; }

                .level-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 2rem; }
                .level-btn {
                    padding: 30px 10px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--glass-border);
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .level-btn:hover { border-color: var(--gold); background: rgba(191,149,63,0.1); }
                .back-mini { background: none; border: none; color: var(--gold-dark); cursor: pointer; font-size: 0.8rem; margin-bottom: 1rem; }

                .face-down-card {
                    min-height: 350px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1A0B2E 0%, #0C0514 100%);
                    border: 2px solid var(--gold-dark);
                    cursor: pointer;
                    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                }
                .face-down-card:hover { transform: scale(1.02) rotate(1deg); border-color: var(--gold); }
                .ouroboros-stamp {
                    width: 120px;
                    height: 120px;
                    background: url('../assets/logo_ouroboros.png') center/contain no-repeat;
                    opacity: 0.4;
                    filter: sepia(1) saturate(5) hue-rotate(-50deg);
                    margin-bottom: 2rem;
                }
                .tap-hint { font-family: var(--font-magic); color: var(--gold); letter-spacing: 2px; text-transform: uppercase; font-size: 0.8rem; opacity: 0.6; }

                .timer-container { width: 100%; margin-bottom: 2rem; text-align: center; }
                .timer-bar { width: 100%; height: 4px; background: rgba(191,149,63,0.1); border-radius: 2px; overflow: hidden; margin: 8px 0; }
                .timer-fill { height: 100%; background: var(--gold); transition: width 0.1s linear; }
                .timer-label { font-size: 0.7rem; color: var(--gold-dark); text-transform: uppercase; letter-spacing: 2px; }
                .timer-value { font-family: var(--font-magic); font-size: 1.5rem; color: var(--gold); }

                .trivia-play-card { padding: 2.5rem 1.5rem; text-align: center; }
                .question-text { font-size: 1.3rem; line-height: 1.4; margin-bottom: 2.5rem; font-weight: 300; }
                .options-stack { display: flex; flex-direction: column; gap: 12px; }
                .trivia-option {
                    display: flex;
                    align-items: center;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(191,149,63,0.1);
                    color: white;
                    padding: 15px;
                    border-radius: 4px;
                    text-align: left;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .trivia-option:hover:not(:disabled) { background: rgba(191,149,63,0.05); border-color: var(--gold-dark); }
                .trivia-option.correct { background: rgba(46, 125, 50, 0.2); border-color: #4caf50; color: #81c784; }
                .trivia-option.wrong { background: rgba(198, 40, 40, 0.2); border-color: #ef5350; color: #e57373; }
                .opt-letter { font-family: var(--font-magic); font-size: 1.2rem; margin-right: 15px; color: var(--gold); opacity: 0.7; }

                .result-controls { margin-top: 3rem; text-align: center; }
                .feedback-text { font-size: 2rem; margin-bottom: 1.5rem; font-family: var(--font-magic); text-shadow: 0 0 10px var(--gold); }
                .back-button { 
                    position: absolute; 
                    top: 20px; 
                    left: 20px; 
                    background: none; 
                    border: 1px solid var(--gold-dark); 
                    color: var(--gold); 
                    padding: 8px 16px; 
                    border-radius: 4px; 
                    cursor: pointer;
                    font-family: var(--font-magic);
                    font-size: 0.7rem;
                    letter-spacing: 1px;
                }
            `}</style>
        </div>
    )
}
