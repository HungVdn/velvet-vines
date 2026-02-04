import { useState, useEffect } from 'react'
import './App.css'
import WildCards from './components/WildCards'
import Spotlight from './components/Spotlight'
import SpinSip from './components/SpinSip'
import DrunkTrivia from './components/DrunkTrivia'
import TruthOrDare from './components/TruthOrDare'
import Lobby from './components/Lobby'
import AdminPanel from './components/AdminPanel'
import PartyRoom from './components/PartyRoom'
import ContentEditor from './components/ContentEditor'
import { db } from './firebase'
import { ref, onValue, set, update, onDisconnect, remove } from 'firebase/database'
import { WILD_CARDS_DEFAULT, SPOTLIGHT_DEFAULT, TRIVIA_DEFAULT, GAME_SCHEMAS } from './data/defaults'
import { TRUTH_OR_DARE_DATA } from './data/truthOrDare'

function App() {
  const [userData, setUserData] = useState(null) // { nickname, roomId, isAdmin, isModerator, id }
  const [gameMode, setGameMode] = useState(null)
  const [players, setPlayers] = useState([])
  const [roomState, setRoomState] = useState(null)
  const [editorGameId, setEditorGameId] = useState(null)

  useEffect(() => {
    if (!userData?.roomId) return

    const roomRef = ref(db, `rooms/${userData.roomId}`)

    // Listen for room changes (gameMode, current card, etc.)
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setRoomState(data)
        setGameMode(data.gameMode)
      } else if (!userData.isAdmin && !userData.isModerator) {
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
      isAdmin: userData.isAdmin || false,
      isModerator: userData.isModerator || false
    })
    onDisconnect(myPlayerRef).remove()

    return () => {
      unsubscribeRoom()
      unsubscribePlayers()
    }
  }, [userData?.roomId, userData?.id, userData?.isAdmin, userData?.isModerator, userData?.nickname])

  const handleJoin = async (data) => {
    const { nickname, passcode } = data
    const userId = Math.random().toString(36).substring(2, 9)
    const fixedRoomId = 'VELVET_VINES_PARTY'

    let isAdmin = false
    let isModerator = false

    // Fetch dynamic join code from Firebase
    const roomRef = ref(db, `rooms/${fixedRoomId}`)
    const roomSnapshot = await new Promise((resolve) => onValue(roomRef, (s) => resolve(s), { onlyOnce: true }))
    const currentPasscode = roomSnapshot.val()?.joinPasscode || 'ForeverAlone'

    if (passcode === '230502') {
      isAdmin = true
    } else if (passcode === 'capnong' || passcode === 'capnia') {
      isModerator = true
    } else if (passcode === currentPasscode) {
      isAdmin = false
      isModerator = false
    } else {
      return alert('Mã truy cập không chính xác!')
    }

    const newUser = { nickname, roomId: fixedRoomId, isAdmin, isModerator, id: userId }

    if (isAdmin) {
      // Initialize/Reset room if admin enters
      update(ref(db, `rooms/${fixedRoomId}`), {
        gameMode: null,
        adminId: userId
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

  const openEditor = (gameId) => {
    setEditorGameId(gameId)
    setGameMode('content-editor')
  }

  const renderGame = () => {
    const commonProps = {
      onBack: () => {
        setGameMode(null)
        if (userData.isAdmin || userData.isModerator) {
          update(ref(db, `rooms/${userData.roomId}`), { gameMode: null })
        }
      },
      isAdmin: userData.isAdmin,
      isModerator: userData.isModerator,
      roomId: userData.roomId,
      roomState: roomState
    }

    if (gameMode === 'content-editor') {
      const gameNames = {
        'wild-cards': 'Lá Bài Hoang Dã',
        'truth-or-dare': 'Sự thật hay Thách thức',
        'spotlight': 'Tâm Điểm',
        'trivia': 'Đố Vui Nhậu Nhẹt'
      }
      const gameDefaults = {
        'wild-cards': WILD_CARDS_DEFAULT,
        'truth-or-dare': TRUTH_OR_DARE_DATA,
        'spotlight': SPOTLIGHT_DEFAULT,
        'trivia': TRIVIA_DEFAULT
      }

      return (
        <ContentEditor
          gameId={editorGameId}
          gameName={gameNames[editorGameId]}
          onBack={() => setGameMode(null)}
          defaultData={gameDefaults[editorGameId]}
          schema={GAME_SCHEMAS[editorGameId]}
        />
      )
    }

    switch (gameMode) {
      case 'party-room': return <PartyRoom {...commonProps} players={players} />
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
            <p className="subtitle">Phiên bản Đặc biệt dành cho Tiệc tùng</p>
          </header>

          <main className="mode-grid">
            {(userData.isAdmin || userData.isModerator) ? (
              <AdminPanel
                players={players}
                onSelectMode={setGlobalMode}
                onRemovePlayer={removePlayer}
                onOpenEditor={openEditor}
                isAdmin={userData.isAdmin}
                isModerator={userData.isModerator}
                roomState={roomState}
                roomId={userData.roomId}
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
