import { db } from '../firebase'
import { ref, update } from 'firebase/database'

export default function AdminPanel({ players, onSelectMode, onRemovePlayer, onOpenEditor, isAdmin, isModerator, roomState, roomId }) {
    const modes = [
        { id: 'party-room', name: 'Phòng Tiệc', editable: false },
        { id: 'wild-cards', name: 'Lá Bài Hoang Dã', editable: true },
        { id: 'truth-or-dare', name: 'Sự thật hay Thách thức', editable: true },
        { id: 'spotlight', name: 'Tâm Điểm', editable: true },
        { id: 'spin-sip', name: 'Vòng Quay Nhấp Môi', editable: false },
        { id: 'trivia', name: 'Đố Vui Nhậu Nhẹt', editable: true },
    ]

    const handleUpdatePasscode = (newPasscode) => {
        if (!isAdmin) return
        update(ref(db, `rooms/${roomId}`), { joinPasscode: newPasscode })
    }

    return (
        <div className="admin-panel animate-fade">
            <div className="admin-header">
                <h2 className="gold-text">{isAdmin ? 'Bảng Điều Khiển Admin' : 'Bảng Điều Khiển Moderator'}</h2>
                {isAdmin && (
                    <div className="passcode-config">
                        <label>Mã vào phòng: </label>
                        <input
                            type="text"
                            className="passcode-input"
                            value={roomState?.joinPasscode || 'ForeverAlone'}
                            onChange={(e) => handleUpdatePasscode(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="admin-grid">
                <section className="mode-selector premium-card">
                    <h3>Chọn trò chơi</h3>
                    <div className="mode-buttons">
                        {modes.map(mode => (
                            <div key={mode.id} className="mode-btn-group">
                                <button
                                    className="premium-button mode-btn"
                                    onClick={() => onSelectMode(mode.id)}
                                >
                                    {mode.name}
                                </button>
                                {mode.editable && (
                                    <button
                                        className="edit-content-btn"
                                        onClick={() => onOpenEditor(mode.id)}
                                        title="Chỉnh sửa nội dung"
                                    >
                                        ✎
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="player-management premium-card">
                    <h3>Người chơi ({players.length})</h3>
                    <div className="player-list-admin">
                        {players.map(player => (
                            <div key={player.id} className="player-row">
                                <span>
                                    {player.nickname}
                                    {player.isAdmin ? ' (Admin)' : player.isModerator ? ' (Mod)' : ''}
                                </span>
                                {isAdmin && !player.isAdmin && (
                                    <button
                                        className="remove-btn"
                                        onClick={() => onRemovePlayer(player.id)}
                                    >
                                        Đuổi
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <style jsx>{`
                .admin-panel { margin-top: 2rem; width: 100%; max-width: 800px; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
                .passcode-config { background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 8px; border: 1px solid var(--gold-dark); display: flex; align-items: center; gap: 10px; }
                .passcode-config label { font-size: 0.8rem; color: var(--gold-light); }
                .passcode-input { background: transparent; border: none; color: white; border-bottom: 1px solid var(--gold); outline: none; width: 120px; font-weight: bold; }
                .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .mode-buttons { display: flex; flex-direction: column; gap: 10px; margin-top: 1rem; }
                .mode-btn-group { display: flex; gap: 5px; width: 100%; }
                .mode-btn { flex: 1; text-align: left; }
                .edit-content-btn { 
                    background: rgba(255,255,255,0.05); 
                    border: 1px solid var(--gold-dark); 
                    color: var(--gold); 
                    width: 40px; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 1.2rem;
                    transition: all 0.2s;
                }
                .edit-content-btn:hover { background: var(--gold); color: #1a1a1a; }
                .player-list-admin { display: flex; flex-direction: column; gap: 10px; margin-top: 1rem; }
                .player-row { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; }
                .remove-btn { background: #c62828; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
                @media (max-width: 600px) {
                    .admin-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    )
}
