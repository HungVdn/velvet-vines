import { useState, useEffect } from 'react'
import './App.css'
import WildCards from './components/WildCards'
import Spotlight from './components/Spotlight'
import SpinSip from './components/SpinSip'
import DrunkTrivia from './components/DrunkTrivia'
import TruthOrDare from './components/TruthOrDare'
import Lobby from './components/Lobby'
import AdminPanel from './components/AdminPanel'
import { db } from './firebase'
import { ref, onValue, set, update, onDisconnect, remove } from 'firebase/database'

function App() {
  const [userData, setUserData] = useState(null) // { nickname, roomId, isAdmin, id }
  const [gameMode, setGameMode] = useState(null)
  const [players, setPlayers] = useState([])
  const [roomState, setRoomState] = useState(null)

  useEffect(() => {
    if (!userData?.roomId) return

    const roomRef = ref(db, `rooms/${userData.roomId}`)

    // Listen for room changes (gameMode, current card, etc.)
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setRoomState(data)
        setGameMode(data.gameMode)
      } else if (!userData.isAdmin) {
        alert('Phòng đã bị đóng hoặc không tồn tại!')
        setUserData(null)
      }
    })

    // Sync players
    const playersRef = ref(db, `rooms/${userData.roomId}/players`)
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const playerList = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        setPlayers(playerList)

        // Check if I was removed
        if (!playerList.find(p => p.id === userData.id)) {
          setUserData(null)
        }
      }
    })

    // Register myself
    const myPlayerRef = ref(db, `rooms/${userData.roomId}/players/${userData.id}`)
    set(myPlayerRef, {
      nickname: userData.nickname,
      isAdmin: userData.isAdmin
    })
    onDisconnect(myPlayerRef).remove()

    return () => {
      unsubscribeRoom()
      unsubscribePlayers()
    }
  }, [userData?.roomId])

  const handleJoin = (data) => {
    const userId = Math.random().toString(36).substring(2, 9)
    const newUser = { ...data, id: userId }

    if (data.isAdmin) {
      // Initialize room if admin
      set(ref(db, `rooms/${data.roomId}`), {
        gameMode: null,
        createdAt: Date.now()
      })
    }
    setUserData(newUser)
  }

  const setGlobalMode = (mode) => {
    update(ref(db, `rooms/${userData.roomId}`), { gameMode: mode })
  }

  const removePlayer = (playerId) => {
    remove(ref(db, `rooms/${userData.roomId}/players/${playerId}`))
  }

  const renderGame = () => {
    const commonProps = {
      onBack: () => setGlobalMode(null),
      isAdmin: userData.isAdmin,
      roomId: userData.roomId,
      roomState: roomState
    }

    switch (gameMode) {
      case 'wild-cards': return <WildCards {...commonProps} />
      case 'truth-or-dare': return <TruthOrDare {...commonProps} />
      case 'spotlight': return <Spotlight {...commonProps} />
      case 'spin-sip': return <SpinSip {...commonProps} />
      case 'trivia': return <DrunkTrivia {...commonProps} />
      default: return null
    }
  }

  if (!userData) {
    return <Lobby onJoin={handleJoin} />
  }

  return (
    <div className="app-container">
      {!gameMode ? (
        <div className="menu-screen animate-fade">
          <header className="hero">
            <h1 className="gold-text">Nhung & Rượu</h1>
            <p className="subtitle">Mã phòng: <span className="gold-text">{userData.roomId}</span></p>
          </header>

          <main className="mode-grid">
            {userData.isAdmin ? (
              <AdminPanel
                roomId={userData.roomId}
                players={players}
                onSelectMode={setGlobalMode}
                onRemovePlayer={removePlayer}
              />
            ) : (
              <div className="waiting-screen premium-card">
                <h3>Chào {userData.nickname}!</h3>
                <p>Đang đợi Quản trị viên chọn trò chơi...</p>
                <div className="player-list-mini">
                  {players.map(p => (
                    <span key={p.id} className="player-tag">{p.nickname}</span>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="game-screen animate-fade">
          {renderGame()}
        </div>
      )}
    </div>
  )
}

export default App
