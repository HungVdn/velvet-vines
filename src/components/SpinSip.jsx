import { db } from '../firebase'
import { ref, update } from 'firebase/database'

const WHEEL_OPTIONS = [
    "Nhấp 1 Hơi", "Mời 2 Hơi", "Cả Hội Nhấp", "Thật hay Nhấp",
    "Thách hay Nhấp", "Cụng Ly!", "Uống Giao Lưu", "Lượt An Toàn"
]

export default function SpinSip({ onBack, isAdmin, roomId, roomState }) {
    const rotation = roomState?.spinRotation || 0
    const result = roomState?.spinResult || ''
    const isSpinning = roomState?.isSpinning || false

    const spinWheel = () => {
        if (!isAdmin || isSpinning) return

        const newRotation = rotation + 1800 + Math.floor(Math.random() * 360)

        update(ref(db, `rooms/${roomId}`), {
            isSpinning: true,
            spinRotation: newRotation,
            spinResult: ''
        })

        setTimeout(() => {
            const actualRotation = newRotation % 360
            const index = Math.floor(((360 - actualRotation + (360 / WHEEL_OPTIONS.length / 2)) % 360) / (360 / WHEEL_OPTIONS.length))
            const newResult = WHEEL_OPTIONS[index]

            update(ref(db, `rooms/${roomId}`), {
                isSpinning: false,
                spinResult: newResult
            })
        }, 4000)
    }

    return (
        <div className="game-container animate-fade">
            <button className="back-button" onClick={onBack}>← Sảnh chờ</button>
            <h2 className="gold-text">Vòng Quay Nhấp Môi</h2>

            <div className="wheel-wrapper">
                <div className="wheel-pointer"></div>
                <div
                    className="wheel"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {WHEEL_OPTIONS.map((opt, i) => (
                        <div
                            key={i}
                            className="wheel-segment"
                            style={{ transform: `rotate(${i * (360 / WHEEL_OPTIONS.length)}deg)` }}
                        >
                            <span className="segment-text">{opt}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="wheel-controls">
                {isAdmin && (
                    <button
                        className="premium-button spin-btn"
                        onClick={spinWheel}
                        disabled={isSpinning}
                    >
                        {isSpinning ? 'Đang quay...' : 'Quay Vòng Quay'}
                    </button>
                )}
                {!isAdmin && isSpinning && <p className="subtitle">Vòng quay đang quay...</p>}
            </div>

            {result && !isSpinning && (
                <div className="result-display animate-fade">
                    <h3 className="gold-text">{result}</h3>
                </div>
            )}

            <style jsx>{`
        .wheel-wrapper {
          position: relative;
          width: 300px;
          height: 300px;
          margin: 2rem 0;
        }
        .wheel {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 10px solid var(--gold);
          position: relative;
          overflow: hidden;
          transition: transform 4s cubic-bezier(0.15, 0, 0.15, 1);
          background: #333;
        }
        .wheel-pointer {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-top: 30px solid var(--gold-light);
          z-index: 10;
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));
        }
        .wheel-segment {
          position: absolute;
          width: 50%;
          height: 2px;
          background: var(--gold-dark);
          top: 50%;
          left: 50%;
          transform-origin: left center;
        }
        .segment-text {
          position: absolute;
          left: 60px;
          top: -10px;
          width: 100px;
          font-size: 0.7rem;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .wheel-controls { margin-top: 1rem; }
        .result-display { margin-top: 2rem; }
        .result-display h3 { font-size: 2rem; text-shadow: 0 0 10px var(--gold); }
      `}</style>
        </div>
    )
}
