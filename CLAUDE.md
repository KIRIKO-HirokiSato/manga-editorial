# Manga Editorial Meeting — Claude Code Plugin

AGIラボハッカソン2026 提出作品。漫画の企画メモを渡すだけで AI 編集会議を自動実行し、掲載判断まで出力する Claude Code Skill。
AIは答えを渡さない。問いを投げて、漫画家を育てる。

## プロジェクト構造

```
manga/
├── .claude-plugin/marketplace.json     # Marketplace 定義
├── plugins/manga-editorial-meeting/
│   ├── .claude-plugin/plugin.json      # Plugin 定義
│   ├── agents/                         # 6体のエージェント
│   │   ├── editorial-lead.md           # 編集長（Opus）
│   │   ├── character-editor.md         # 熱血編集者（Sonnet）
│   │   ├── story-editor.md             # 鬼軍曹編集者（Sonnet）
│   │   ├── market-analyst.md           # 目利き編集者（Sonnet）
│   │   ├── output-bundler.md           # 成果物パッケージャー（Sonnet）
│   │   └── crystallizer.md             # NFD ナレッジ化（Sonnet）
│   └── skills/editorial-meeting/
│       └── SKILL.md                    # ← Skill 本体（最重要）
├── mock/                               # UI デモ・設計書（開発参考用、提出物ではない）
├── HACKATHON_REQUIREMENTS.md           # ハッカソン要件整理
└── HANDOFF_ASSESSMENT.md               # ギャップ分析
```

## 開発で守ること

- **提出形式は Claude Code Plugin Marketplace**。審査員は `/plugin marketplace add` → `/plugin install` でインストールして試す
- Skill の本体は `plugins/manga-editorial-meeting/skills/editorial-meeting/SKILL.md`。ここが核
- 設計書は [mock/manga-editorial-meeting-design-v4.md](manga-editorial-meeting-design-v4.md) を参照
- 外部フレームワーク依存なし。1つのプロンプト内でロールを切り替える設計
- `mock/` 配下は開発参考資料。直接の提出物ではない

## コンセプト

- AIはストーリーを作らない。問いを投げて、漫画家を育てる
- 却下・保留時は改善案ではなく「問い」を出す。答えは含めない
- 改稿はユーザー自身が行う。AIは考え方だけを渡す
- 面白い企画には Round 1 でも「掲載」を出す。茶番はしない

## エージェント構成（6体）

| エージェント | 役割 | 人格 |
|---|---|---|
| editorial-lead | 編集長・統括進行 | 落ち着いて本質を突く |
| character-editor | 熱血編集者 | 感情的、共感ベース |
| story-editor | 鬼軍曹編集者 | 冷厳、論理的、容赦なし |
| market-analyst | 目利き編集者 | 業界通、具体例で語る |
| output-bundler | 成果物生成 | - |
| crystallizer | NFD ナレッジ化 | - |

## 評価4軸

1. コアの面白さ（What's the hook?）
2. 第1話の力（Does page 1 grab you?）
3. 連載の持続力（Can it run for 10+ volumes?）
4. 時代との接点（Why now?）

## 掲載判断（5段階）

掲載 / 条件付き通過 / 保留（問い付き）/ 却下（問い付き）/ 見送り

## 会議フロー

企画メモ受け取り → 構造化・推測補完 → 3編集者の独立評価（並列）→ 議論 → 編集長の総括・判定 → 問いの提示（該当時）→ 噛み砕き解説 → 成果物出力

再持込時は前回の問い・スコアとの差分を自動検出して議論の焦点を変える。

## 審査基準（配点順）

1. **自律性 40%** — 追加プロンプトなしで自己完結。エラー回復・不足情報の自主収集
2. **クオリティ 35%** — プロダクションレベルの出力品質と UX
3. **インパクト 25%** — 他の人にも役立つか

## 締切

- 提出: 2026-03-22（日）23:59
- Demo Day: 2026-03-23（日）

## 要件・仕様の参照先

- ハッカソン要件 → [HACKATHON_REQUIREMENTS.md](HACKATHON_REQUIREMENTS.md)
- 設計書 → [manga-editorial-meeting-design-v4.md](manga-editorial-meeting-design-v4.md)
- テンプレ repo → https://github.com/KaishuShito/agi-lab-skills-marketplace
- FAQ → https://kaishushito.github.io/agi-lab-hackathon-2026-kickoff-slides/faq.html
