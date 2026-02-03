import { useState } from 'react'

export default function Lobby({ onJoin }) {
    const [nickname, setNickname] = useState('')
    const [roomId, setRoomId] = useState('')

    const handleAction = (isAdmin) => {
        if (!nickname.trim()) return alert('Vui lòng nhập biệt danh!')
        if (!isAdmin && !roomId.trim()) return alert('Vui lòng nhập Mã phòng!')

        const generatedRoomId = isAdmin ? Math.random().toString(36).substring(2, 8).toUpperCase() : roomId.trim().toUpperCase()
        onJoin({ nickname, roomId: generatedRoomId, isAdmin })
    }

    return (
        <div className="game-container animate-fade lobby-screen">
            <header className="hero">
                <h1 className="gold-text">Nhung & Rượu</h1>
                <p className="subtitle">Phòng chờ Đa người chơi</p>
            </header>

            <div className="setup-card premium-card">
                <input
                    type="text"
                    placeholder="Biệt danh của bạn"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="premium-input"
                />

                <div className="divider"><span>HOẶC</span></div>

                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Mã phòng (để tham gia)"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="premium-input"
                    />
                    <button className="premium-button" onClick={() => handleAction(false)}>Tham gia</button>
                </div>

                <button className="premium-button create-btn" onClick={() => handleAction(true)}>
                    Tạo phòng mới (Quản trị viên)
                </button>
            </div>

            <style jsx>{`
                .lobby-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; }
                .setup-card { width: 100%; max-width: 400px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .premium-input { background: rgba(255,255,255,0.05); border: 1px solid var(--gold-dark); color: white; padding: 12px; border-radius: 8px; font-size: 1rem; }
                .divider { text-align: center; position: relative; margin: 0.5rem 0; }
                .divider::before { content: ""; position: absolute; left: 0; top: 50%; width: 100%; height: 1px; background: rgba(212,175,55,0.2); }
                .divider span { position: relative; background: #1a1a1a; padding: 0 10px; color: var(--text-muted); font-size: 0.7rem; letter-spacing: 2px; }
                .input-group { display: flex; gap: 10px; }
                .create-btn { background: transparent; border: 1px dashed var(--gold); color: var(--gold); }
                .create-btn:hover { background: rgba(212,175,55,0.05); }
            `}</style>
        </div>
    )
}
