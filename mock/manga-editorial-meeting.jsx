import { useState, useEffect, useRef, useCallback } from "react";

const EDITORS = [
  {
    id: "character",
    name: "主人公担当",
    role: "Character Agent",
    color: "#E85D3A",
    bgColor: "#FEF0EC",
    emoji: "🔥",
    axis: "主人公エンジン",
  },
  {
    id: "conflict",
    name: "対立構造担当",
    role: "Conflict Agent",
    color: "#6C5CE7",
    bgColor: "#F0EEFE",
    emoji: "⚔️",
    axis: "対立構造",
  },
  {
    id: "hook",
    name: "フック担当",
    role: "Hook Agent",
    color: "#00B894",
    bgColor: "#ECFDF5",
    emoji: "🎣",
    axis: "読者フック",
  },
  {
    id: "serial",
    name: "連載担当",
    role: "Serialization Agent",
    color: "#0984E3",
    bgColor: "#EBF5FF",
    emoji: "📚",
    axis: "連載エンジン",
  },
];

const CHIEF = {
  id: "chief",
  name: "編集長",
  role: "Editorial Judge",
  color: "#2D3436",
  emoji: "👔",
};

const REVIEWER = {
  id: "reviewer",
  name: "セルフレビュー",
  role: "Self Review Agent",
  color: "#D63031",
  emoji: "🔍",
};

// Simulated meeting script
const MEETING_SCRIPT = [
  { phase: "opening", speaker: "chief", text: "では、編集会議を始めます。企画「」の検討に入ります。", delay: 800 },
  { phase: "opening", speaker: "chief", text: "各担当、分析を報告してください。", delay: 1200 },
  { phase: "analysis", speaker: "character", text: "主人公の分析を開始します…", delay: 600, typing: true },
  { phase: "analysis", speaker: "character", text: "主人公に明確な目標があり、物語を駆動する力がある。ただし弱点の設定が薄い。成長余地は確保されている。", delay: 2000, score: 7 },
  { phase: "analysis", speaker: "conflict", text: "対立構造を検証中…", delay: 600, typing: true },
  { phase: "analysis", speaker: "conflict", text: "メインの敵対関係は成立している。ただしライバルポジションが不在で、中盤のテンション維持に不安がある。", delay: 2200, score: 6 },
  { phase: "analysis", speaker: "hook", text: "第1話のフック要素を評価中…", delay: 600, typing: true },
  { phase: "analysis", speaker: "hook", text: "冒頭の事件は弱い。読者が「次も読みたい」と思う引きが第1話に不足している。ここは要改善。", delay: 2400, score: 4 },
  { phase: "analysis", speaker: "serial", text: "連載可能性を計算中…", delay: 600, typing: true },
  { phase: "analysis", speaker: "serial", text: "世界観の拡張性はある。ただし敵の階層が1段しかなく、10話以降のエンジンが見えない。", delay: 2000, score: 5 },
  { phase: "judge", speaker: "chief", text: "なるほど。各担当の報告を総合すると…", delay: 1500 },
  { phase: "judge", speaker: "chief", text: "掲載判断：保留。読者フックと連載エンジンに構造的課題あり。", delay: 2000, verdict: "保留" },
  { phase: "review", speaker: "reviewer", text: "…ちょっと待ってください。判定を再検証します。", delay: 1800, interrupt: true },
  { phase: "review", speaker: "reviewer", text: "読者フックのスコア4は妥当か？ 企画文を再読すると、主人公の過去の謎が伏線として機能する可能性がある。", delay: 2500 },
  { phase: "review", speaker: "reviewer", text: "フックを5に修正。ただし掲載保留の判断は維持。連載エンジンの弱さが依然としてボトルネック。", delay: 2200, scoreUpdate: { hook: 5 } },
  { phase: "search", speaker: "reviewer", text: "類似ジャンルの成功作を調査中… 🔎", delay: 1500, searching: true },
  { phase: "search", speaker: "reviewer", text: "同ジャンルの成功例では「敵組織の階層化」と「仲間の段階的加入」が連載エンジンとして機能していた。この方向の強化を提案。", delay: 2500 },
  { phase: "final", speaker: "chief", text: "セルフレビューの修正を反映。最終判定を出します。", delay: 1500 },
  { phase: "final", speaker: "chief", text: "掲載判断：条件付き通過。連載エンジンの設計を補強した上で、第1話ネームに進むこと。", delay: 2000, verdict: "条件付き通過" },
];

const PhaseLabel = ({ phase }) => {
  const labels = {
    opening: "開会",
    analysis: "構造分析",
    judge: "掲載判断",
    review: "セルフレビュー",
    search: "類似作品調査",
    final: "最終判定",
  };
  const colors = {
    opening: "#636E72",
    analysis: "#0984E3",
    judge: "#E85D3A",
    review: "#D63031",
    search: "#6C5CE7",
    final: "#2D3436",
  };
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 12px",
      borderRadius: 20,
      backgroundColor: colors[phase] + "15",
      border: `1px solid ${colors[phase]}30`,
      fontSize: 11,
      fontWeight: 700,
      color: colors[phase],
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      margin: "16px 0 8px",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        backgroundColor: colors[phase],
      }} />
      {labels[phase]}
    </div>
  );
};

const MessageBubble = ({ message, isNew }) => {
  const allSpeakers = { ...Object.fromEntries(EDITORS.map(e => [e.id, e])), chief: CHIEF, reviewer: REVIEWER };
  const speaker = allSpeakers[message.speaker];

  const isInterrupt = message.interrupt;
  const isSearching = message.searching;
  const isTyping = message.typing;

  return (
    <div style={{
      display: "flex",
      gap: 12,
      padding: "10px 16px",
      borderRadius: 12,
      backgroundColor: isInterrupt ? "#FFF5F5" : isSearching ? "#F8F0FF" : "#FFFFFF",
      border: isInterrupt ? "1px solid #FECACA" : isSearching ? "1px solid #E9D5FF" : "1px solid #F1F1F1",
      animation: isNew ? "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
      transition: "all 0.3s ease",
      boxShadow: isInterrupt ? "0 2px 8px rgba(214,48,49,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
        backgroundColor: speaker.bgColor || (speaker.color + "15"),
        border: `2px solid ${speaker.color}30`,
      }}>
        {speaker.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
        }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: speaker.color }}>
            {speaker.name}
          </span>
          <span style={{ fontSize: 10, color: "#999", fontWeight: 500 }}>
            {speaker.role}
          </span>
        </div>
        <div style={{
          fontSize: 14, lineHeight: 1.65, color: "#2D3436",
          fontWeight: isInterrupt ? 600 : 400,
        }}>
          {isTyping ? (
            <span style={{ color: "#999" }}>
              <span className="typing-dot">●</span>
              <span className="typing-dot" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="typing-dot" style={{ animationDelay: "0.4s" }}>●</span>
            </span>
          ) : message.text}
        </div>
        {message.score !== undefined && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 8, padding: "4px 10px", borderRadius: 8,
            backgroundColor: speaker.color + "12",
            border: `1px solid ${speaker.color}25`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: speaker.color }}>
              {speaker.axis}
            </span>
            <span style={{
              fontSize: 18, fontWeight: 800, color: speaker.color,
              fontFamily: "'DM Mono', monospace",
            }}>
              {message.score}/10
            </span>
          </div>
        )}
        {message.verdict && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 10, padding: "8px 16px", borderRadius: 10,
            backgroundColor: message.verdict === "条件付き通過" ? "#00B89415" : "#F0AD4E15",
            border: `2px solid ${message.verdict === "条件付き通過" ? "#00B894" : "#F0AD4E"}40`,
          }}>
            <span style={{ fontSize: 18 }}>
              {message.verdict === "条件付き通過" ? "✅" : "⏸️"}
            </span>
            <span style={{
              fontSize: 15, fontWeight: 800,
              color: message.verdict === "条件付き通過" ? "#00B894" : "#F0AD4E",
            }}>
              {message.verdict}
            </span>
          </div>
        )}
        {message.scoreUpdate && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 8, padding: "4px 10px", borderRadius: 8,
            backgroundColor: "#D6303112",
            border: "1px solid #D6303125",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D63031" }}>
              読者フック 修正
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600, color: "#999",
              textDecoration: "line-through",
            }}>4</span>
            <span style={{ fontSize: 13, color: "#D63031" }}>→</span>
            <span style={{
              fontSize: 18, fontWeight: 800, color: "#D63031",
              fontFamily: "'DM Mono', monospace",
            }}>5/10</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ScoreGauge = ({ label, score, maxScore, color, previousScore }) => {
  const pct = (score / maxScore) * 100;
  const prevPct = previousScore !== undefined ? (previousScore / maxScore) * 100 : null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {previousScore !== undefined && previousScore !== score && (
            <>
              <span style={{
                fontSize: 12, color: "#BBB", textDecoration: "line-through",
                fontFamily: "'DM Mono', monospace",
              }}>{previousScore}</span>
              <span style={{ fontSize: 10, color: "#D63031" }}>→</span>
            </>
          )}
          <span style={{
            fontSize: 16, fontWeight: 800, color,
            fontFamily: "'DM Mono', monospace",
          }}>
            {score !== null ? score : "—"}
          </span>
        </div>
      </div>
      <div style={{
        height: 8, borderRadius: 4,
        backgroundColor: "#F1F2F6",
        overflow: "hidden",
        position: "relative",
      }}>
        {prevPct !== null && prevPct !== pct && (
          <div style={{
            position: "absolute", top: 0, left: 0,
            height: "100%", width: `${prevPct}%`,
            backgroundColor: color + "30",
            borderRadius: 4,
          }} />
        )}
        <div style={{
          height: "100%",
          width: score !== null ? `${pct}%` : "0%",
          backgroundColor: color,
          borderRadius: 4,
          transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }} />
      </div>
    </div>
  );
};

export default function MangaEditorialMeeting() {
  const [messages, setMessages] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [scores, setScores] = useState({ character: null, conflict: null, hook: null, serial: null });
  const [previousScores, setPreviousScores] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const [showInput, setShowInput] = useState(true);
  const chatRef = useRef(null);

  const sampleInput = `タイトル：炎の錬金術師
コンセプト：禁じられた錬金術で妹を救う旅
主人公：16歳の少年、天才だが傲慢。妹の病を治すため禁術に手を出す
世界観：錬金術が科学の代わりに発展した中世ヨーロッパ風
第1話：妹が倒れ、禁術の書を求めて王都を出る
対立キャラ：錬金術を取り締まる教会の騎士団長
ゴール：妹を救い、禁術の真実を世界に明かす`;

  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isRunning || scriptIndex >= MEETING_SCRIPT.length) {
      if (scriptIndex >= MEETING_SCRIPT.length && isRunning) setIsRunning(false);
      return;
    }

    const step = MEETING_SCRIPT[scriptIndex];
    const timer = setTimeout(() => {
      if (step.phase !== currentPhase) setCurrentPhase(step.phase);

      if (step.typing) {
        setMessages(prev => [...prev, { ...step, isNew: true }]);
        setTimeout(() => {
          setMessages(prev => prev.filter((m, i) => i !== prev.length - 1));
          setScriptIndex(i => i + 1);
        }, 800);
        return;
      }

      setMessages(prev => [...prev, { ...step, isNew: true }]);

      if (step.score !== undefined) {
        const editorId = step.speaker;
        setScores(prev => ({ ...prev, [editorId]: step.score }));
      }
      if (step.scoreUpdate) {
        setPreviousScores(prev => ({ ...prev, hook: scores.hook || 4 }));
        setScores(prev => ({ ...prev, hook: step.scoreUpdate.hook }));
      }

      setScriptIndex(i => i + 1);
    }, step.delay);

    return () => clearTimeout(timer);
  }, [isRunning, scriptIndex, currentPhase, scores]);

  const handleStart = () => {
    setMessages([]);
    setScores({ character: null, conflict: null, hook: null, serial: null });
    setPreviousScores({});
    setScriptIndex(0);
    setCurrentPhase(null);
    setShowInput(false);
    setIsRunning(true);
  };

  const totalScore = Object.values(scores).filter(s => s !== null);
  const avg = totalScore.length > 0 ? (totalScore.reduce((a, b) => a + b, 0) / totalScore.length).toFixed(1) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .typing-dot {
          animation: pulse 1s infinite;
          font-size: 10px;
          margin-right: 2px;
          color: #999;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        textarea:focus { outline: none; border-color: #2D3436 !important; }
      `}</style>

      <div style={{
        fontFamily: "'Noto Sans JP', sans-serif",
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#F8F9FA",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #E8E8E8",
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg, #2D3436, #636E72)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>📝</div>
            <div>
              <div style={{
                fontSize: 15, fontWeight: 800, color: "#2D3436",
                letterSpacing: "-0.02em",
              }}>
                AI Manga Editorial Meeting
              </div>
              <div style={{ fontSize: 11, color: "#999", fontWeight: 500 }}>
                漫画編集会議エージェント
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isRunning && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 20,
                backgroundColor: "#FF634720",
                animation: "pulse 2s infinite",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: "#FF6347",
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#FF6347" }}>
                  LIVE
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}>
          {/* Main Chat Area */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            <div
              ref={chatRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {showInput && (
                <div style={{
                  maxWidth: 560,
                  margin: "40px auto",
                  animation: "fadeUp 0.5s ease",
                }}>
                  <div style={{
                    textAlign: "center",
                    marginBottom: 32,
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                    <h2 style={{
                      fontSize: 22, fontWeight: 800, color: "#2D3436",
                      marginBottom: 6,
                    }}>
                      漫画企画を提出してください
                    </h2>
                    <p style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>
                      企画プロットを入力すると、AI編集会議が自動で開始されます
                    </p>
                  </div>

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={sampleInput}
                    style={{
                      width: "100%",
                      minHeight: 220,
                      padding: 16,
                      borderRadius: 12,
                      border: "2px solid #E8E8E8",
                      fontSize: 14,
                      lineHeight: 1.7,
                      fontFamily: "'Noto Sans JP', sans-serif",
                      resize: "vertical",
                      backgroundColor: "#FAFAFA",
                      transition: "border-color 0.2s",
                    }}
                  />

                  <div style={{
                    display: "flex", gap: 8, marginTop: 12,
                    justifyContent: "flex-end",
                  }}>
                    <button
                      onClick={() => setInputText(sampleInput)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 10,
                        border: "1px solid #DDD",
                        backgroundColor: "#FFF",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        color: "#666",
                        fontFamily: "'Noto Sans JP', sans-serif",
                      }}
                    >
                      サンプルを使う
                    </button>
                    <button
                      onClick={handleStart}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #2D3436, #636E72)",
                        color: "#FFF",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "'Noto Sans JP', sans-serif",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      編集会議を開始 →
                    </button>
                  </div>
                </div>
              )}

              {!showInput && (
                <>
                  {messages.map((msg, idx) => {
                    const prevPhase = idx > 0 ? messages[idx - 1].phase : null;
                    const showPhaseLabel = msg.phase !== prevPhase;
                    return (
                      <div key={idx}>
                        {showPhaseLabel && <PhaseLabel phase={msg.phase} />}
                        <MessageBubble message={msg} isNew={msg.isNew} />
                      </div>
                    );
                  })}
                  {!isRunning && messages.length > 0 && scriptIndex >= MEETING_SCRIPT.length && (
                    <div style={{
                      textAlign: "center",
                      padding: "24px 0",
                      animation: "fadeUp 0.5s ease",
                    }}>
                      <button
                        onClick={() => {
                          setShowInput(true);
                          setMessages([]);
                          setScores({ character: null, conflict: null, hook: null, serial: null });
                          setPreviousScores({});
                          setScriptIndex(0);
                          setInputText("");
                        }}
                        style={{
                          padding: "10px 24px",
                          borderRadius: 10,
                          border: "2px solid #2D3436",
                          backgroundColor: "transparent",
                          color: "#2D3436",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "'Noto Sans JP', sans-serif",
                        }}
                      >
                        別の企画で再会議
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar - Scores */}
          <div style={{
            width: 260,
            borderLeft: "1px solid #E8E8E8",
            backgroundColor: "#FFFFFF",
            padding: "20px 16px",
            overflowY: "auto",
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: "#999",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}>
              評価スコア
            </div>

            <ScoreGauge label="🔥 主人公エンジン" score={scores.character} maxScore={10} color="#E85D3A" />
            <ScoreGauge label="⚔️ 対立構造" score={scores.conflict} maxScore={10} color="#6C5CE7" />
            <ScoreGauge
              label="🎣 読者フック"
              score={scores.hook}
              maxScore={10}
              color="#00B894"
              previousScore={previousScores.hook}
            />
            <ScoreGauge label="📚 連載エンジン" score={scores.serial} maxScore={10} color="#0984E3" />

            <div style={{
              marginTop: 20,
              padding: "16px 12px",
              borderRadius: 12,
              backgroundColor: "#F8F9FA",
              border: "1px solid #F1F1F1",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#999", marginBottom: 4 }}>
                総合スコア
              </div>
              <div style={{
                fontSize: 36, fontWeight: 900, color: "#2D3436",
                fontFamily: "'DM Mono', monospace",
                lineHeight: 1,
              }}>
                {avg || "—"}
              </div>
              <div style={{ fontSize: 11, color: "#BBB", marginTop: 2 }}>/10</div>
            </div>

            {/* Editor Roster */}
            <div style={{
              marginTop: 24,
              fontSize: 12, fontWeight: 700, color: "#999",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}>
              編集委員
            </div>

            {EDITORS.map((editor) => (
              <div key={editor.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 0",
                borderBottom: "1px solid #F5F5F5",
              }}>
                <span style={{ fontSize: 16 }}>{editor.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: editor.color }}>
                    {editor.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#BBB" }}>{editor.role}</div>
                </div>
              </div>
            ))}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 0",
              borderBottom: "1px solid #F5F5F5",
            }}>
              <span style={{ fontSize: 16 }}>{CHIEF.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: CHIEF.color }}>{CHIEF.name}</div>
                <div style={{ fontSize: 10, color: "#BBB" }}>{CHIEF.role}</div>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 0",
            }}>
              <span style={{ fontSize: 16 }}>{REVIEWER.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: REVIEWER.color }}>{REVIEWER.name}</div>
                <div style={{ fontSize: 10, color: "#BBB" }}>{REVIEWER.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
