import { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { ref, update, onValue, set } from 'firebase/database'
import { TRIVIA_DEFAULT } from '../data/defaults'
import logoOuroboros from '../assets/logo_ouroboros.png'

export default function DrunkTrivia({ onBack, isAdmin, isModerator, userId, roomId, roomState, players, advanceTurn, localPlayers }) {
    const [triviaData, setTriviaData] = useState(TRIVIA_DEFAULT)
    const [localTime, setLocalTime] = useState(0)

    // Sync states from Firebase
    const phase = roomState?.triviaPhase || 'category' // category, level, pre-reveal, thinking, time-up, result
    const selectedCategory = roomState?.triviaCategory || null
    const selectedLevel = roomState?.triviaLevel || null
    const currentQ = roomState?.triviaQuestion || null
    const timerStart = roomState?.triviaTimerStart || null
    const timerDuration = roomState?.triviaTimerDuration || 0
    const feedback = roomState?.triviaFeedback || null
    const selectedAnswer = roomState?.triviaSelectedAnswer || null
    const randomTarget = roomState?.triviaRandomTarget || null
    const randomTimestamp = roomState?.triviaRandomTimestamp || null

    const [isRolling, setIsRolling] = useState(false)
    const [rollingName, setRollingName] = useState('')

    const playerSlots = roomState?.playerSlots || {}
    const activeTurnSlot = roomState?.activeTurnSlot || 0
    const activePlayer = players.find((p, idx) => {
        const slot = playerSlots[p.id] !== undefined ? playerSlots[p.id] : idx
        return slot === activeTurnSlot
    })
    // Check if ANY local player on this device has the turn
    const isMyTurn = localPlayers?.some(lp => lp.id === activePlayer?.id) || activePlayer?.id === userId

    // Split permissions
    const canPlay = isMyTurn
    const canControl = isAdmin || isModerator || isMyTurn // Can pick category, unseal card
    const canFacilitate = isAdmin || isModerator // ONLY Admins/Moderators can reveal answers and advance turns

    useEffect(() => {
        if (randomTimestamp) {
            setIsRolling(true)
            let timer = 0
            const interval = setInterval(() => {
                if (players.length > 0) {
                    const randInd = Math.floor(Math.random() * players.length)
                    setRollingName(players[randInd]?.nickname)
                }
                timer += 100
                if (timer >= 2000) {
                    clearInterval(interval)
                    setIsRolling(false)
                }
            }, 100)
            return () => clearInterval(interval)
        }
    }, [randomTimestamp, players])

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

                if (remaining <= 0 && canFacilitate) {
                    if (phase === 'thinking') {
                        // Time ended, move to "time-up" phase (waiting for reveal)
                        update(ref(db, `rooms/${roomId}`), {
                            triviaPhase: 'time-up',
                            triviaTimerStart: null
                        })
                    }
                }
            }, 100)
        }
        return () => clearInterval(interval)
    }, [timerStart, phase, timerDuration, canFacilitate])

    useEffect(() => {
        // Reset trivia state when the turn changes
        if (canFacilitate) {
            resetGame()
        }
    }, [activeTurnSlot])

    const selectCategory = (cat) => {
        if (!canControl) return // Admins or active player can select category
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
        if (!canControl) return // Any control-capable player can start thinking phase
        update(ref(db, `rooms/${roomId}`), {
            triviaPhase: 'thinking',
            triviaTimerStart: Date.now(),
            triviaTimerDuration: 30 // 30 seconds to think
        })
    }

    const showAnswer = () => {
        if (!canFacilitate) return
        update(ref(db, `rooms/${roomId}`), {
            triviaPhase: 'result',
            triviaFeedback: 'ĐÁP ÁN LÀ... 🥁'
        })
    }

    const pickRandomPenalty = () => {
        if (!canControl) return
        const otherPlayers = players.filter(p => true)
        if (otherPlayers.length === 0) return
        const picked = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
        update(ref(db, `rooms/${roomId}`), {
            triviaRandomTarget: picked.nickname,
            triviaRandomTimestamp: Date.now()
        })
    }

    // Removed startAnswering and reveaResult logic as we don't pick answers anymore

    const resetGame = () => {
        update(ref(db, `rooms/${roomId}`), {
            triviaPhase: 'category',
            triviaCategory: null,
            triviaLevel: null,
            triviaQuestion: null,
            triviaTimerStart: null,
            triviaFeedback: null,
            triviaSelectedAnswer: null,
            triviaRandomTarget: null,
            triviaRandomTimestamp: null
        })
    }

    const renderPhase = () => {
        switch (phase) {
            case 'category': {
                const validCategories = Object.keys(triviaData).filter(cat => {
                    const levels = triviaData[cat]
                    return Object.values(levels).some(qList => Array.isArray(qList) && qList.length > 0)
                })

                return (
                    <div className="selection-screen animate-fade">
                        <h3 className="gold-text">Chọn Chủ Đề</h3>
                        <div className="options-grid">
                            {validCategories.map(cat => (
                                <button key={cat} className="premium-button cat-btn" onClick={() => selectCategory(cat)}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }
            case 'level': {
                const validLevels = [1, 2, 3].filter(lv => {
                    const qList = triviaData[selectedCategory]?.[lv]
                    return Array.isArray(qList) && qList.length > 0
                })

                return (
                    <div className="selection-screen animate-fade">
                        <button className="back-mini" onClick={() => update(ref(db, `rooms/${roomId}`), { triviaPhase: 'category' })}>← Đổi chủ đề</button>
                        <h3 className="gold-text">{selectedCategory}</h3>
                        <p className="subtitle pink-text">Chọn độ khó</p>
                        <div className="level-grid">
                            {validLevels.map(lv => (
                                <button key={lv} className={`level-btn lv-${lv}`} onClick={() => selectLevel(lv)}>
                                    Cấp {lv}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }
            case 'pre-reveal':
                return (
                    <div className="card-reveal-screen animate-fade" onClick={revealQuestion}>
                        <div className={`premium-card face-down-card ${canControl ? 'interactive' : ''}`}>
                            <div className="ouroboros-stamp" style={{ backgroundImage: `url(${logoOuroboros})` }}></div>
                            <p className="tap-hint">{canControl ? "Chạm để giải ấn câu hỏi" : `Chờ ${activePlayer?.nickname} hoặc Host...`}</p>
                        </div>
                    </div>
                )
            case 'thinking':
            case 'time-up':
            case 'result':
                const options = [currentQ.a1, currentQ.a2, currentQ.a3, currentQ.a4].filter(Boolean)
                return (
                    <div className="active-game-screen animate-fade">
                        <div className="timer-container">
                            {phase === 'thinking' ? (
                                <>
                                    <div className="timer-label">Thời gian suy nghĩ</div>
                                    <div className="timer-bar">
                                        <div className="timer-fill" style={{ width: `${(localTime / timerDuration) * 100}%` }}></div>
                                    </div>
                                    <div className="timer-value">{localTime}s</div>
                                </>
                            ) : (
                                <div className="timer-value ended">HẾT GIỜ! ⌛</div>
                            )}
                        </div>

                        <div className={`premium-card trivia-play-card ${phase === 'result' ? 'result-mode' : ''}`}>
                            <p className="question-text">{currentQ.q}</p>

                            <div className="options-stack">
                                {phase === 'result' && (
                                    <div className="trivia-option correct revealed">
                                        <span className="opt-letter">✓</span>
                                        <span className="opt-text">{[currentQ.a1, currentQ.a2, currentQ.a3, currentQ.a4][currentQ.correct]}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Control Area */}
                        <div className="result-controls animate-fade" style={{ marginTop: '2rem' }}>
                            {/* Phase: Thinking - Just show text */}
                            {phase === 'thinking' && (
                                <p className="subtitle blink">Đang suy nghĩ...</p>
                            )}

                            {/* Phase: Time Up - Show Reveal Button */}
                            {phase === 'time-up' && (
                                canFacilitate ? (
                                    <button className="premium-button pulse-btn" onClick={showAnswer}>
                                        Chạm để xem đáp án 👁️
                                    </button>
                                ) : (
                                    <p className="subtitle pink-text">Chờ chủ xị mở đáp án... 👁️</p>
                                )
                            )}

                            {/* Phase: Result - Show Next Button & Random Tool */}
                            {phase === 'result' && (
                                <div className="animate-fade">
                                    <h2 className="feedback-text gold-text" style={{ fontSize: '1.5rem' }}>{feedback}</h2>

                                    {(randomTarget || isRolling) && (
                                        <div className={`random-target-reveal ${isRolling ? 'rolling' : 'animate-bounce'}`}>
                                            🎯 Mục tiêu: <span className="pink-text">{isRolling ? rollingName : randomTarget}</span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1.5rem' }}>
                                        {canControl && (
                                            <button className="premium-button random-btn" onClick={pickRandomPenalty}>
                                                {randomTarget ? "Chọn lại 🎲" : "Chọn nạn nhân 🎲"}
                                            </button>
                                        )}
                                        {canFacilitate && (
                                            <button className="premium-button" onClick={advanceTurn}>Tiếp tục - Sang lượt</button>
                                        )}
                                    </div>

                                    {!canControl && !canFacilitate && (
                                        <p className="subtitle gold-text">Chờ Quản trị viên chuyển lượt... ✨</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            default: return null
        }
    }

    return (
        <div className="game-container trivia-overhaul">
            {(isAdmin || isModerator) && <button className="back-button" onClick={onBack}>← Sảnh chờ</button>}
            <h2 className="gold-text main-title">Đố Vui Nhậu Nhẹt</h2>
            <div className={`turn-banner ${isMyTurn ? 'my-turn' : ''}`}>
                {isMyTurn ? "Lượt của bạn! 👊" : `Lượt của: ${activePlayer?.nickname}`}
            </div>
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
                .trivia-option:hover:not(.static-option) { background: rgba(191,149,63,0.05); border-color: var(--gold-dark); }
                .trivia-option.static-option { cursor: default; }
                .trivia-option.correct.revealed { background: rgba(46, 125, 50, 0.4); border-color: #4caf50; color: #fff; box-shadow: 0 0 15px rgba(76, 175, 80, 0.4); transform: scale(1.02); }
                .trivia-option.dimmed { opacity: 0.5; }
                
                .timer-value.ended { color: #ef5350; letter-spacing: 2px; font-size: 1.2rem; font-weight: 700; }
                .pulse-btn { animation: pulseBtn 1.5s infinite; }
                @keyframes pulseBtn { 0% { transform: scale(1); } 50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(191,149,63,0.4); } 100% { transform: scale(1); } }
                .blink { animation: blinkText 1.5s infinite; }
                @keyframes blinkText { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .opt-letter { font-family: var(--font-magic); font-size: 1.2rem; margin-right: 15px; color: var(--gold); opacity: 0.7; }

                .random-target-reveal {
                    background: rgba(191,149,63,0.1);
                    border: 1px dashed var(--gold);
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    color: var(--gold-light);
                    font-weight: 700;
                    font-size: 1.1rem;
                    min-height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                .random-target-reveal.rolling {
                    border-style: solid;
                    background: rgba(191,149,63,0.2);
                    box-shadow: inset 0 0 20px rgba(191,149,63,0.2);
                    animation: rollingBorder 0.2s infinite;
                }
                @keyframes rollingBorder {
                    0% { border-color: var(--gold); }
                    50% { border-color: #ff2864; }
                    100% { border-color: var(--gold); }
                }
                .random-btn { background: rgba(255, 40, 100, 0.1); border-color: #ff2864; color: #ff2864; }
                .random-btn:hover { background: rgba(255, 40, 100, 0.2); }

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
                .turn-banner {
                    width: 100%;
                    text-align: center;
                    padding: 8px;
                    margin-bottom: 1rem;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid var(--glass-border);
                    color: var(--gold-light);
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 0.9rem;
                    border-radius: 4px;
                }
                .turn-banner.my-turn {
                    background: rgba(191,149,63,0.15);
                    border-color: var(--gold);
                    color: var(--gold);
                    font-weight: 700;
                    box-shadow: 0 0 15px rgba(191,149,63,0.2);
                    animation: pulseBanner 2s infinite;
                }
                @keyframes pulseBanner { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
            `}</style>
        </div>
    )
}
