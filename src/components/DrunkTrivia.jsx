import { useState, useEffect } from 'react'

const TRIVIA_DATA = [
    { q: "Which cocktail is made with gin, lemon juice, sugar, and carbonated water?", a: ["Tom Collins", "Gin Fizz", "Negroni", "Martini"], correct: 0 },
    { q: "What is the main ingredient of Japanese Sake?", a: ["Wheat", "Potato", "Rice", "Barley"], correct: 2 },
    { q: "In which country did the Mojito originate?", a: ["Mexico", "Cuba", "Brazil", "Spain"], correct: 1 },
    { q: "Which spirit is known as 'The Green Fairy'?", a: ["Chartreuse", "Midori", "Absinthe", "Jägermeister"], correct: 2 },
    { q: "What is the standard volume of a bottle of wine (ml)?", a: ["500ml", "700ml", "750ml", "1000ml"], correct: 2 },
]

export default function DrunkTrivia({ onBack }) {
    const [currentQ, setCurrentQ] = useState(null)
    const [timer, setTimer] = useState(10)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [feedback, setFeedback] = useState(null)

    useEffect(() => {
        nextQuestion()
    }, [])

    useEffect(() => {
        if (timer > 0 && currentQ && !feedback) {
            const t = setTimeout(() => setTimer(timer - 1), 1000)
            return () => clearTimeout(t)
        } else if (timer === 0 && !feedback) {
            handleAnswer(-1) // Time out
        }
    }, [timer, currentQ, feedback])

    const nextQuestion = () => {
        const randomIndex = Math.floor(Math.random() * TRIVIA_DATA.length)
        setCurrentQ(TRIVIA_DATA[randomIndex])
        setTimer(10)
        setFeedback(null)
    }

    const handleAnswer = (index) => {
        const isCorrect = index === currentQ.correct
        setFeedback(isCorrect ? 'Correct!' : 'Wrong! Drink Up.')
        if (isCorrect) setScore(score + 1)

        setTimeout(() => {
            nextQuestion()
        }, 2000)
    }

    return (
        <div className="game-container animate-fade">
            <button className="back-button" onClick={onBack}>← Lobby</button>
            <h2 className="gold-text">Drunk Trivia</h2>

            {currentQ && (
                <div className="trivia-screen">
                    <div className="timer-bar">
                        <div className="timer-fill" style={{ width: `${(timer / 10) * 100}%` }}></div>
                    </div>

                    <div className="premium-card trivia-card">
                        <p className="question-text">{currentQ.q}</p>
                        <div className="options-grid">
                            {currentQ.a.map((opt, i) => (
                                <button
                                    key={i}
                                    className={`option-btn ${feedback ? (i === currentQ.correct ? 'correct' : 'wrong') : ''}`}
                                    onClick={() => !feedback && handleAnswer(i)}
                                    disabled={!!feedback}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {feedback && (
                        <div className="feedback-overlay animate-fade">
                            <h3 className={feedback.startsWith('Correct') ? 'gold-text' : ''}>{feedback}</h3>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        .trivia-screen { width: 100%; max-width: 400px; margin-top: 1rem; }
        .timer-bar {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          margin-bottom: 2rem;
          overflow: hidden;
        }
        .timer-fill {
          height: 100%;
          background: var(--gold);
          transition: width 1s linear, background-color 0.3s ease;
        }
        .trivia-card { min-height: 250px; }
        .question-text { font-size: 1.2rem; margin-bottom: 2rem; font-weight: 400; }
        .options-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .option-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--glass-border);
          color: white;
          padding: 15px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-body);
        }
        .option-btn:hover:not(:disabled) { background: rgba(212, 175, 55, 0.1); border-color: var(--gold); }
        .option-btn.correct { background: #2e7d32; border-color: #4caf50; }
        .option-btn.wrong { background: #c62828; border-color: #ef5350; }
        .feedback-overlay { margin-top: 2rem; text-align: center; }
        .feedback-overlay h3 { font-size: 1.5rem; }
      `}</style>
        </div>
    )
}
