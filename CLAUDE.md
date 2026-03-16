# Manga Editorial Meeting — Claude Code Plugin

AGIラボハッカソン2026 提出作品。漫画の企画メモを渡すだけで AI 編集会議を自動実行し、掲載判断まで出力する Claude Code Skill。

## プロジェクト構造

```
manga/
├── .claude-plugin/marketplace.json     # Marketplace 定義
├── plugins/manga-editorial-meeting/
│   ├── .claude-plugin/plugin.json      # Plugin 定義
│   └── skills/editorial-meeting/
│       └── SKILL.md                    # ← Skill 本体（最重要）
├── mock/                               # UI デモ・設計書（開発参考用、提出物ではない）
├── HACKATHON_REQUIREMENTS.md           # ハッカソン要件整理
└── HANDOFF_ASSESSMENT.md               # ギャップ分析
```

## 開発で守ること

- **提出形式は Claude Code Plugin Marketplace**。審査員は `/plugin marketplace add` → `/plugin install` でインストールして試す
- Skill の本体は `plugins/manga-editorial-meeting/skills/editorial-meeting/SKILL.md`。ここが核
- 設計書は [mock/manga-editorial-meeting-design-v2.md](mock/manga-editorial-meeting-design-v2.md) を参照
- 外部フレームワーク依存なし。1つのプロンプト内でロールを切り替える設計（設計書 §3）
- `mock/` 配下は開発参考資料。直接の提出物ではない

## 審査基準（配点順）

1. **自律性 40%** — 追加プロンプトなしで自己完結。エラー回復・不足情報の自主収集
2. **クオリティ 35%** — プロダクションレベルの出力品質と UX
3. **インパクト 25%** — 他の人にも役立つか

## 締切

- 提出: 2026-03-22（日）23:59
- Demo Day: 2026-03-23（日）

## 要件・仕様の参照先

- ハッカソン要件 → [HACKATHON_REQUIREMENTS.md](HACKATHON_REQUIREMENTS.md)
- 設計書 → [mock/manga-editorial-meeting-design-v2.md](mock/manga-editorial-meeting-design-v2.md)
- テンプレ repo → https://github.com/KaishuShito/agi-lab-skills-marketplace
- FAQ → https://kaishushito.github.io/agi-lab-hackathon-2026-kickoff-slides/faq.html
