import { useState } from 'react'

export default function Lobby({ onJoin }) {
    const [nickname, setNickname] = useState('')
    const [passcode, setPasscode] = useState('')

    const handleAction = () => {
        if (!nickname.trim()) return alert('Vui lòng nhập biệt danh!')
        if (!passcode.trim()) return alert('Vui lòng nhập Mã truy cập!')

        onJoin({ nickname, passcode })
    }

    return (
        <div className="game-container animate-fade lobby-screen">
            <header className="hero">
                <h1 className="gold-text">Nhung & Rượu</h1>
                <p className="subtitle">Phiên bản Đặc biệt dành cho Tiệc tùng</p>
            </header>

            <div className="setup-card premium-card">
                <div className="input-group-vertical">
                    <label>Biệt danh</label>
                    <input
                        type="text"
                        placeholder="VD: Nhung, Minh..."
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="premium-input"
                    />
                </div>

                <div className="input-group-vertical">
                    <label>Mã truy cập</label>
                    <input
                        type="password"
                        placeholder="Nhập mã vào đây..."
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="premium-input"
                    />
                </div>

                <button className="premium-button join-btn" onClick={handleAction}>
                    Tiến vào Cuộc vui
                </button>
            </div>

            <style jsx>{`
                .lobby-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; }
                .setup-card { width: 100%; max-width: 400px; padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .input-group-vertical { display: flex; flex-direction: column; gap: 8px; text-align: left; }
                .input-group-vertical label { font-size: 0.8rem; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
                .premium-input { background: rgba(255,255,255,0.05); border: 1px solid var(--gold-dark); color: white; padding: 12px; border-radius: 8px; font-size: 1rem; }
                .join-btn { margin-top: 1rem; padding: 15px; font-size: 1.1rem; }
            `}</style>
        </div>
    )
}
