import { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { ref, update, onValue, set } from 'firebase/database'
import { TRIVIA_DEFAULT } from '../data/defaults'
import logoOuroboros from '../assets/logo_ouroboros.png'

export default function DrunkTrivia({ onBack, isAdmin, isModerator, userId, roomId, roomState, players, advanceTurn, localPlayers }) {
    const [triviaData, setTriviaData] = useState(TRIVIA_DEFAULT)
    const [localTime, setLocalTime] = useState(0)
    const [isRitualWaiting, setIsRitualWaiting] = useState(false)

    // Sync states from Firebase
    const phase = roomState?.triviaPhase || 'category' // category, level, pre-reveal, thinking, time-up, result
    const selectedCategory = roomState?.triviaCategory || null
    const selectedLevel = roomState?.triviaLevel || null
    const currentQ = roomState?.triviaQuestion || null
    const timerStart = roomState?.triviaTimerStart || null
    const timerDuration = roomState?.triviaTimerDuration || 0
    const feedback = roomState?.triviaFeedback || null

    const playerSlots = roomState?.playerSlots || {}
    const activeTurnSlot = roomState?.activeTurnSlot || 0
    const activePlayer = players.find((p, idx) => {
        const slot = playerSlots[p.id] !== undefined ? playerSlots[p.id] : idx
        return slot === activeTurnSlot
    })
    // Check if ANY local player on this device has the turn
    const isMyTurn = localPlayers?.some(lp => lp.id === activePlayer?.id) || activePlayer?.id === userId

    // Simplified permissions
    const canPlay = isMyTurn
    const canControl = isAdmin || isModerator || isMyTurn // Can pick category, unseal card
    const canFacilitate = isAdmin || isModerator // ONLY Admins/Moderators can reveal answers and advance turns

    useEffect(() => {
        const contentRef = ref(db, 'content/trivia')
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
        const penaltyTs = roomState?.penaltyRitualTimestamp
        if (penaltyTs) {
            const age = Date.now() - penaltyTs
            if (age < 3000) {
                setIsRitualWaiting(true)
                const timer = setTimeout(() => setIsRitualWaiting(false), 3000 - age)
                return () => clearTimeout(timer)
            } else {
                setIsRitualWaiting(false)
            }
        } else {
            setIsRitualWaiting(false)
        }
    }, [roomState?.penaltyRitualTimestamp])

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
            triviaTimerDuration: 10 // 10 seconds to think
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
        if (players.length === 0) return
        const randomIndex = Math.floor(Math.random() * players.length)
        const picked = players[randomIndex]

        // Calculate their slot index for the wisp
        const targetSlot = playerSlots[picked.id] !== undefined ? playerSlots[picked.id] : randomIndex

        update(ref(db, `rooms/${roomId}`), {
            globalRandomTarget: picked.nickname,
            penaltyRitualTimestamp: Date.now(),
            penaltyRitualSlot: targetSlot
        })
    }

    // Removed startAnswering and reveaResult logic as we don't pick answers anymore

    const getCategoryColor = (name) => {
        const lower = (name || '').toLowerCase()
        if (lower.includes('nóng') || lower.includes('hot') || lower.includes('tình') || lower.includes('yêu')) return '#ff2d55' // Pink/Red
        if (lower.includes('nhậu') || lower.includes('rượu') || lower.includes('bia') || lower.includes('đô')) return '#ff9500' // Orange/Beer
        if (lower.includes('bạn') || lower.includes('chill')) return '#5856d6' // Indigo/Friendship
        if (lower.includes('bí') || lower.includes('mật') || lower.includes('tối')) return '#af52de' // Purple/Mystery
        if (lower.includes('đời') || lower.includes('thường') || lower.includes('xã')) return '#34c759' // Green/Nature
        return '#BF953F' // Default Gold
    }

    const resetGame = () => {
        update(ref(db, `rooms/${roomId}`), {
            triviaPhase: 'category',
            triviaCategory: null,
            triviaLevel: null,
            triviaQuestion: null,
            triviaTimerStart: null,
            triviaFeedback: null,
            globalRandomTarget: null,
            penaltyRitualTimestamp: null,
            penaltyRitualSlot: null
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
                        <header className="trivia-header">
                            <h2 className="gold-foil">Tiên Tri Tửu</h2>
                            <p className="oracle-subtitle">Hỏi đáp bằng linh hồn, trả giá bằng men say</p>
                        </header>
                        <div className="oracle-grid">
                            {validCategories.map(cat => {
                                const sigColor = getCategoryColor(cat)
                                return (
                                    <button
                                        key={cat}
                                        className="oracle-card glass-morphism"
                                        style={{ '--sig-color': sigColor }}
                                        onClick={() => selectCategory(cat)}
                                    >
                                        <div className="oracle-card-bg" style={{ background: `radial-gradient(circle at top right, ${sigColor}22, transparent)` }}></div>
                                        <div className="oracle-card-glow"></div>
                                        <span className="oracle-card-title">{cat}</span>
                                        <div className="oracle-card-icon">◈</div>
                                    </button>
                                )
                            })}
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
                        <h3 className="section-title">Cấp Độ Huyền Bí</h3>
                        <div className="modern-level-scroll">
                            {validLevels.map(lv => (
                                <button
                                    key={lv}
                                    className={`level-pill ${selectedLevel === lv ? 'active' : ''}`}
                                    onClick={() => selectLevel(lv)}
                                >
                                    {lv === 1 ? 'Nhập Môn' : lv === 2 ? 'Tri Kỷ' : 'Vong Ngã'}
                                </button>
                            ))}
                        </div>

                        <h3 className="section-title">Lưu Trữ Cổ Xưa</h3>
                        <div className="oracle-grid mini">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="oracle-card glass-morphism decorative" style={{ minHeight: '80px', pointerEvents: 'none', opacity: 0.4 }}>
                                    <div className="oracle-card-title" style={{ fontSize: '0.7rem' }}>Bản Thảo {i + 1}</div>
                                    <div className="oracle-card-icon">📜</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
            case 'pre-reveal':
                return (
                    <div className="card-reveal-screen animate-fade" onClick={revealQuestion}>
                        <div className="ritual-particles">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={`particle p${i}`}></div>
                            ))}
                        </div>
                        <div className={`premium-card face-down-card ${canControl ? 'interactive' : ''}`}>
                            <div className="card-aura"></div>
                            <div className="ouroboros-stamp" style={{ backgroundImage: `url(${logoOuroboros})` }}></div>
                            <p className="tap-hint">{canControl ? "Chạm để giải ấn câu hỏi" : `Chờ ${activePlayer?.nickname} giải ấn...`}</p>
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
                            <div className="action-bar-ritual">
                                {phase === 'time-up' && canFacilitate && (
                                    <button className="premium-button reveal-btn-ritual" onClick={showAnswer}>
                                        Giải Ấn Sự Thật
                                    </button>
                                )}
                                {phase === 'thinking' && !canFacilitate && <p className="waiting-oracle">Đang chờ sự thật được khai mở...</p>}
                            </div>

                            {/* Phase: Result - Show Next Button & Random Tool */}
                            {phase === 'result' && (
                                <div className="animate-fade">
                                    <h2 className="feedback-text gold-text" style={{ fontSize: '1.5rem' }}>{feedback}</h2>

                                    {roomState?.globalRandomTarget && !isRitualWaiting && (
                                        <div className="random-target-reveal animate-bounce">
                                            🎯 Mục tiêu: <span className="pink-text">{roomState.globalRandomTarget}</span>
                                        </div>
                                    )}

                                    {isRitualWaiting && (
                                        <div className="random-target-reveal animate-pulse" style={{ opacity: 0.6 }}>
                                            🎯 Đang chọn linh hồn...
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1.5rem' }}>
                                        {canControl && (
                                            <button className="premium-button random-btn" onClick={pickRandomPenalty}>
                                                {roomState?.globalRandomTarget ? "Chọn lại 🎲" : "Chọn nạn nhân 🎲"}
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
                    max-width: 600px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-bottom: 4rem;
                }
                .main-title { 
                    margin-bottom: 1.5rem; 
                    letter-spacing: 6px; 
                    font-family: var(--font-magic); 
                    text-transform: uppercase;
                    font-size: 1.5rem;
                }
                .trivia-content { width: 100%; position: relative; }

                /* Oracle Grid - The scalable category selector */
                .oracle-header { text-align: center; margin-bottom: 2rem; }
                .oracle-subtitle { color: var(--gold-dark); font-style: italic; font-size: 0.9rem; margin-top: 0.5rem; }
                
                .oracle-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 16px; 
                    padding: 4px;
                }
                @media (min-width: 768px) {
                    .oracle-grid { grid-template-columns: repeat(3, 1fr); }
                }

                .oracle-card {
                    position: relative;
                    min-height: 120px;
                    background: rgba(20, 10, 30, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    overflow: hidden;
                    text-decoration: none;
                    color: inherit;
                }

                .oracle-card-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
                .oracle-card-glow { 
                    position: absolute; 
                    bottom: -20px; 
                    left: 50%; 
                    transform: translateX(-50%);
                    width: 60%; 
                    height: 10px; 
                    background: var(--sig-color); 
                    filter: blur(25px); 
                    opacity: 0.3;
                    transition: opacity 0.4s ease;
                }

                .oracle-card:hover {
                    transform: translateY(-8px);
                    background: rgba(30, 15, 45, 0.6);
                    border-color: var(--sig-color);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.5), 0 0 10px var(--sig-color);
                }
                .oracle-card:hover .oracle-card-glow { opacity: 0.8; }

                .oracle-card-title {
                    font-family: var(--font-heading);
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #fff;
                    z-index: 1;
                    text-align: center;
                    line-height: 1.2;
                }
                .oracle-card-icon {
                    margin-top: 0.5rem;
                    color: var(--sig-color);
                    font-size: 0.8rem;
                    z-index: 1;
                    opacity: 0.6;
                }

                /* Selections & Buttons */
                .section-title {
                    font-family: var(--font-heading);
                    color: var(--gold);
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    margin: 2rem 0 1rem;
                    opacity: 0.8;
                }

                .modern-level-scroll {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    padding: 10px 4px;
                    scrollbar-width: none;
                }
                .modern-level-scroll::-webkit-scrollbar { display: none; }

                .level-pill {
                    flex: 1;
                    min-width: 100px;
                    padding: 16px;
                    background: rgba(20, 10, 30, 0.4);
                    border: 1px solid var(--glass-border);
                    color: var(--gold-light);
                    border-radius: 12px;
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                }
                .level-pill:hover { border-color: var(--gold); background: rgba(191,149,63,0.1); transform: translateY(-3px); }
                .level-pill.active { background: var(--gold-gradient); color: #000; border: none; font-weight: 800; }

                .level-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 2rem; }
                .level-btn {
                    padding: 25px 10px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--glass-border);
                    color: var(--gold-light);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 0.8rem;
                }
                .level-btn:hover { border-color: var(--gold); background: rgba(191,149,63,0.15); transform: translateY(-4px); }
                .lv-1 { border-color: rgba(52, 199, 89, 0.3); }
                .lv-2 { border-color: rgba(255, 149, 0, 0.3); }
                .lv-3 { border-color: rgba(255, 45, 85, 0.3); }

                .back-mini { 
                    background: none; border: none; color: var(--gold-dark); cursor: pointer; 
                    font-size: 0.8rem; margin: 0 auto 1.5rem; display: block; 
                    font-family: var(--font-magic); text-transform: uppercase; letter-spacing: 1px;
                }

                .card-reveal-screen { perspective: 1000px; padding: 1rem; }
                .face-down-card {
                    min-height: 400px;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1A0B2E 0%, #0C0514 100%);
                    border: 2px solid var(--gold-dark);
                    box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(191,149,63,0.1);
                    position: relative;
                }
                .face-down-card::after {
                    content: ""; position: absolute; inset: -4px; border: 1px solid var(--gold); 
                    border-radius: 20px; opacity: 0.2; pointer-events: none;
                }
                .face-down-card.interactive:hover { border-color: var(--gold); transform: rotateX(5deg) scale(1.02); }
                
                .ouroboros-stamp {
                    width: 140px;
                    height: 140px;
                    background: url('../assets/logo_ouroboros.png') center/contain no-repeat;
                    opacity: 0.35;
                    filter: sepia(1) saturate(3) hue-rotate(-50deg) drop-shadow(0 0 15px var(--gold-dark));
                    margin-bottom: 2rem;
                    animation: subtlePulse 4s infinite ease-in-out;
                }
                @keyframes subtlePulse {
                    0%, 100% { transform: scale(1); opacity: 0.35; }
                    50% { transform: scale(1.05); opacity: 0.5; }
                }

                .timer-container { width: 100%; margin-bottom: 2rem; text-align: center; }
                .timer-bar { width: 80%; height: 3px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; margin: 12px auto; }
                .timer-fill { height: 100%; background: var(--gold-gradient); transition: width 0.1s linear; }
                .timer-value { font-family: var(--font-magic); font-size: 2rem; color: var(--gold); text-shadow: 0 0 10px var(--gold-dark); }

                .trivia-play-card { padding: 3rem 2rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.08); }
                .question-text { font-family: var(--font-heading); font-size: 1.5rem; line-height: 1.4; color: #fff; margin-bottom: 1rem; }
                
                .trivia-option {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 24px;
                    border-radius: 8px;
                    color: var(--text-muted);
                    font-family: var(--font-body);
                    font-size: 1.2rem;
                    text-align: center;
                }
                .trivia-option.correct.revealed {
                    background: rgba(191, 149, 63, 0.1);
                    border-color: var(--gold);
                    color: var(--gold-light);
                    box-shadow: 0 0 30px rgba(191, 149, 63, 0.2);
                    animation: answerReveal 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes answerReveal {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }

                .back-button { 
                    position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.5); 
                    border: 1px solid var(--glass-border); color: var(--gold-dark); padding: 8px 16px; 
                    border-radius: 20px; cursor: pointer; font-size: 0.7rem; transition: all 0.2s;
                    backdrop-filter: blur(5px);
                }
                .back-button:hover { color: var(--gold); border-color: var(--gold); }
                
                .turn-banner {
                    width: auto; padding: 6px 20px; margin-bottom: 1.5rem;
                    background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px; font-size: 0.8rem; color: var(--gold-dark);
                }
                .turn-banner.my-turn {
                    background: var(--gold-gradient); color: #000; font-weight: 800; border: none;
                }

                /* Ritual Particles */
                .ritual-particles { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
                .particle {
                    position: absolute; width: 6px; height: 6px; background: var(--gold);
                    border-radius: 50%; opacity: 0; filter: blur(2px);
                    animation: floatParticle 8s infinite ease-in-out;
                }
                .p0 { top: 20%; left: 30%; animation-delay: 0s; }
                .p1 { top: 60%; left: 20%; animation-delay: 2s; }
                .p2 { top: 40%; left: 80%; animation-delay: 4s; }
                .p3 { top: 80%; left: 70%; animation-delay: 1s; }
                .p4 { top: 10%; left: 60%; animation-delay: 5s; }
                .p5 { top: 90%; left: 40%; animation-delay: 3s; }

                @keyframes floatParticle {
                    0% { transform: translateY(0) translateX(0) scale(0); opacity: 0; }
                    20% { opacity: 0.6; }
                    80% { opacity: 0.2; }
                    100% { transform: translateY(-100px) translateX(40px) scale(0); opacity: 0; }
                }

                .oracle-grid.mini { grid-template-columns: repeat(3, 1fr); margin-top: 1rem; }

                .active-game-screen { width: 100%; display: flex; flex-direction: column; align-items: center; }
                .options-stack { display: flex; flex-direction: column; gap: 12px; margin-top: 2rem; width: 100%; }
                
                .opt-letter {
                    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
                    background: var(--gold-dark); color: #000; border-radius: 50%; font-weight: 900;
                    font-size: 0.8rem; margin-right: 12px; flex-shrink: 0;
                }
                .opt-text { flex: none; }

                .feedback-text { font-family: var(--font-magic); margin-bottom: 2rem; color: var(--gold); text-shadow: 0 0 15px var(--gold-dark); }
                .random-target-reveal { font-family: var(--font-heading); background: rgba(255,45,85,0.1); border: 1px dashed var(--sig-color); padding: 12px 24px; border-radius: 30px; margin: 1rem 0; color: #fff; text-transform: uppercase; letter-spacing: 2px; }
                .pink-text { color: #ff2d55; font-weight: 800; }

                .card-aura {
                    position: absolute; inset: -20px;
                    background: radial-gradient(circle at center, rgba(191,149,63,0.15), transparent 70%);
                    z-index: -1; animation: auraPulse 3s infinite ease-in-out;
                }
                @keyframes auraPulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.1); opacity: 0.6; }
                }
            `}</style>
        </div>
    )
}
