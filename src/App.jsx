import { useState, useEffect } from 'react'
import './App.css'
import WildCards from './components/WildCards'
import Spotlight from './components/Spotlight'
import DrunkTrivia from './components/DrunkTrivia'
import TruthOrDare from './components/TruthOrDare'
import Lobby from './components/Lobby'
import AdminPanel from './components/AdminPanel'
import PartyRoom from './components/PartyRoom'
import ContentEditor from './components/ContentEditor'
import SacredContract from './components/SacredContract'
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

  // 1. Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('velvet_vines_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.roomId) {
          setUserData(parsed)
        }
      } catch (e) {
        console.error("Failed to parse saved user", e)
      }
    }
  }, [])

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
      // Sync adminId but don't force-clear gameMode if it already exists
      update(ref(db, `rooms/${fixedRoomId}`), {
        adminId: userId
      })
    }
    setUserData(newUser)
    localStorage.setItem('velvet_vines_user', JSON.stringify(newUser))
  }

  const resetGameStates = {
    wildCardsRevealed: false,
    todRevealed: false,
    spotlightRevealed: false,
    spotlightCountdownStartTime: null,
    spinResult: '',
    isSpinning: false,
    triviaFeedback: null,
    contractAccepted: false
  }

  const setGlobalMode = (mode) => {
    update(ref(db, `rooms/${userData.roomId}`), {
      gameMode: mode,
      signatures: null,
      ...resetGameStates
    })
  }

  const advanceTurn = () => {
    if (!userData.isAdmin && !userData.isModerator) return
    const currentSlot = roomState?.activeTurnSlot || 0
    const direction = roomState?.turnDirection || 'cw'
    const isAutoMode = roomState?.autoMode || false
    const numPlayers = players.length
    if (numPlayers === 0) return

    const occupiedSlots = players.map(p => {
      const slot = roomState?.playerSlots?.[p.id]
      return slot !== undefined ? slot : players.findIndex(pl => pl.id === p.id)
    }).sort((a, b) => a - b)

    if (occupiedSlots.length === 0) return

    let nextSlotIndex
    const currentIdxInOccupied = occupiedSlots.indexOf(currentSlot)

    // Check if we finished a round (reaching the end/start of the occupied list)
    let finishedRound = false
    if (direction === 'cw') {
      const isLast = currentIdxInOccupied === occupiedSlots.length - 1
      nextSlotIndex = occupiedSlots[(currentIdxInOccupied + 1) % occupiedSlots.length]
      if (isLast) finishedRound = true
    } else {
      const isFirst = currentIdxInOccupied === 0
      nextSlotIndex = occupiedSlots[(currentIdxInOccupied - 1 + occupiedSlots.length) % occupiedSlots.length]
      if (isFirst) finishedRound = true
    }

    const updates = {
      activeTurnSlot: nextSlotIndex,
      ...resetGameStates
    }

    if (finishedRound && isAutoMode) {
      const gameOrder = ['wild-cards', 'truth-or-dare', 'spotlight', 'trivia']
      const currentIndex = gameOrder.indexOf(gameMode)
      if (currentIndex !== -1) {
        const nextGame = gameOrder[(currentIndex + 1) % gameOrder.length]
        updates.gameMode = nextGame
      }
    }

    update(ref(db, `rooms/${userData.roomId}`), { ...updates })
  }

  const handleSkip = () => {
    if (!userData) return
    const myPlayer = players.find(p => p.id === userData.id)
    const currentSkips = myPlayer?.skipCount || 0
    const nextSkips = currentSkips + 1

    update(ref(db, `rooms/${userData.roomId}/players/${userData.id}`), {
      skipCount: nextSkips
    })

    advanceTurn()
  }

  const removePlayer = (playerId) => {
    remove(ref(db, `rooms/${userData.roomId}/players/${playerId}`))
  }

  const openEditor = (gameId) => {
    setEditorGameId(gameId)
    setGameMode('content-editor')
  }

  // Define commonProps here so they are available to both renderGame and the main return block
  const commonProps = userData ? {
    onBack: () => {
      setGameMode(null)
      if (userData.isAdmin || userData.isModerator) {
        update(ref(db, `rooms/${userData.roomId}`), { gameMode: null })
      }
    },
    isAdmin: userData.isAdmin,
    isModerator: userData.isModerator,
    userId: userData.id,
    roomId: userData.roomId,
    roomState: roomState,
    players: players,
    advanceTurn: advanceTurn,
    onSkip: handleSkip,
    userSkipCount: players.find(p => p.id === userData.id)?.skipCount || 0
  } : {};


  const renderGame = () => {
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

    // Skill: scroll-experience - Grimoire Page Flip
    return (
      <div key={gameMode} className="grimoire-page-container animate-page-flip">
        {(() => {
          switch (gameMode) {
            case 'wild-cards': return <WildCards {...commonProps} />
            case 'truth-or-dare': return <TruthOrDare {...commonProps} />
            case 'trivia': return <DrunkTrivia {...commonProps} />
            case 'spotlight': return <Spotlight {...commonProps} />
            default: return null
          }
        })()}
      </div>
    )
  }

  if (!userData) {
    return <Lobby onJoin={handleJoin} />
  }

  const currentSignatures = roomState?.signatures?.[gameMode] || {}
  const everyoneSigned = players.length > 0 && players.every(p => currentSignatures[p.id] === true)
  const iHaveSigned = currentSignatures[userData.id] === true

  return (
    <div className="app-container">
      {gameMode === 'content-editor' ? (
        renderGame()
      ) : (
        <div className="lobby-experience animate-fade">
          <PartyRoom
            {...commonProps}
            players={players}
            activeGame={(gameMode && gameMode !== 'party-room' && everyoneSigned) ? renderGame() : null}
          />

          {gameMode && gameMode !== 'party-room' && !everyoneSigned && (
            <SacredContract
              gameMode={gameMode}
              onSign={() => set(ref(db, `rooms/${userData.roomId}/signatures/${gameMode}/${userData.id}`), true)}
              players={players}
              signatures={currentSignatures}
              currentUserId={userData.id}
              hasSigned={iHaveSigned}
            />
          )}

          {(!gameMode || gameMode === 'party-room') && (
            <div className={`menu-overlay ${gameMode === 'party-room' ? 'mini' : ''}`}>
              {(userData.isAdmin || userData.isModerator) ? (
                <div className="admin-dock animate-slide-up sacred-grimoire">
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
                  <div className="turn-controls" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      className="premium-button"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '8px' }}
                      onClick={() => update(ref(db, `rooms/${userData.roomId}`), { activeTurnSlot: 0 })}
                    >
                      Về vị trí 0
                    </button>
                    <button
                      className="premium-button"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '8px', background: 'var(--gold-dark)' }}
                      onClick={() => advanceTurn()}
                    >
                      Chuyển lượt (Skip)
                    </button>
                  </div>
                  {gameMode === 'party-room' && (
                    <button className="premium-button close-menu-btn" onClick={() => update(ref(db, `rooms/${userData.roomId}`), { gameMode: null })}>
                      Ẩn Bảng Điều Khiển
                    </button>
                  )}
                </div>
              ) : (
                <div className="waiting-dock animate-fade">
                  <div className="premium-card info-card">
                    <h2 className="gold-text">Chào {userData.nickname}!</h2>
                    <p>Hãy cùng ngồi vào bàn và đợi chủ xị chọn trò nhé.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
            .lobby-experience { position: relative; width: 100%; height: 100vh; height: 100dvh; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .menu-overlay { 
              position: absolute; 
              inset: 0;
              width: 100%; 
              height: 100%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              background: radial-gradient(circle, rgba(20,10,30,0.4) 0%, rgba(5,2,8,0.95) 100%);
              backdrop-filter: blur(15px);
              -webkit-backdrop-filter: blur(15px);
              z-index: 100; 
              pointer-events: none; 
            }
            .menu-overlay > div { pointer-events: all; width: 95%; max-width: 500px; }
            .menu-overlay.mini { background: radial-gradient(circle at bottom, rgba(30,15,50,0.6) 0%, rgba(5,2,8,0.98) 100%); align-items: flex-end; padding-bottom: 2rem; }
            .admin-dock { max-width: 550px !important; width: 95%; max-height: 85vh; overflow-y: auto; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem; box-shadow: 0 40px 100px rgba(0,0,0,0.9); scrollbar-width: thin; }
            .waiting-dock { padding: 1.5rem; width: 100%; max-width: 450px; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 12px; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
            .info-card { text-align: center; padding: 2rem; border: none; }
            .close-menu-btn { width: 100%; margin-top: 1.5rem; background: var(--gold-gradient); color: #000; font-weight: 800; padding: 15px; border: none; border-radius: 4px; text-transform: uppercase; letter-spacing: 2px; }
      `}</style>
    </div>
  )
}

export default App
