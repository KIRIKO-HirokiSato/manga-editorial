# AGIラボ ハッカソン 2026 — プロジェクト要件まとめ

**テーマ**: 「一度命じたら、あとは任せろ。」 — 自律的に動くAIエージェントの開発

---

## 開発制約

| 項目 | 内容 |
|------|------|
| 開発期間 | 2026-03-07（土）〜 2026-03-22（日）23:59 |
| チーム | 1〜3名 |
| ツール制約 | **なし**（Claude Code, GPT, Gemini, Cursor, OpenClaw 等すべて利用可） |
| ドメイン制約 | **なし**（業務自動化、コンテンツ作成、リサーチ等 自由） |

## 成果物の形式

**Claude Code Plugin Marketplace 形式** が推奨。審査員は以下の手順でインストール・テストする:

```bash
/plugin marketplace add <user>/<repo>
/plugin install <plugin-name>@<marketplace-name>
```

### 必須リポジトリ構造

```
your-repo/
├── .claude-plugin/
│   └── marketplace.json            # marketplace 全体情報
├── plugins/
│   └── your-plugin/
│       ├── .claude-plugin/
│       │   └── plugin.json         # plugin 名・説明
│       └── skills/
│           └── your-skill/
│               └── SKILL.md        # skill 本体（核）
└── README.md                       # 審査員・参加者が最初に読む入口
```

### 提出物チェックリスト

- [ ] 公開 GitHub リポジトリ
- [ ] Plugin が 1 つ以上入っている
- [ ] SKILL.md が自分の作品内容に置き換わっている
- [ ] README にセットアップと使い方が書いてある
- [ ] 3 分以内のデモ動画

### テンプレートリポジトリ

- fork 元: https://github.com/KaishuShito/agi-lab-skills-marketplace
- `plugins/hackathon-starter/` を自分の作品に書き換えて使う

## 審査基準

1〜5点スケールで各軸を採点し、加重合計で順位を決定。上位5チームが Demo Day で発表。

| 基準 | 配点 | 評価ポイント |
|------|------|-------------|
| **自律性 (Autonomy)** | **40%** | 追加プロンプトなしでタスクを自己完結できるか。エラー回復・自己修正・不足情報の自主収集を含む |
| **クオリティ (Quality)** | **35%** | プロダクションレベルの出力品質とユーザー体験 |
| **インパクト (Impact)** | **25%** | 作者以外にも役立つか。スケーラビリティの可能性 |

## 自律性で求められる具体的な能力

テーマの核心である「自律性」で高得点を得るために、エージェントは以下を示す必要がある:

- **End-to-End 完走**: 初回指示のみでタスクを最後まで遂行できる
- **エラー回復・自己修正**: 途中で問題が起きても自力で立て直せる
- **自主的な情報収集**: 不足情報があれば自ら調べに行く

bypass permissions モードでの実行は OK。評価されるのは設定ではなく「その中でどれだけ自走できるか」。（運営確認済み）

## 成果物の範囲

| 形式 | 可否 |
|------|------|
| Skill 単体 | ◯ OK（最小構成） |
| Skill + それを呼ぶエージェント | ◯ OK |
| 1作品に複数 Skill を含める | ◯ OK（1 repo にまとまっていれば） |
| チームで別々の作品を複数提出 | ✗ NG（1チーム1作品） |
| Claude Code 以外のツールで作った Skill | ◯ OK（技術制限なし） |

## 情報ソース

| ソース | URL |
|--------|-----|
| イベントページ | https://luma.com/wt6baxlt |
| キックオフスライド | https://kaishushito.github.io/agi-lab-hackathon-2026-kickoff-slides/ |
| FAQ | https://kaishushito.github.io/agi-lab-hackathon-2026-kickoff-slides/faq.html |
| テンプレ repo | https://github.com/KaishuShito/agi-lab-skills-marketplace |
| 提出フォーム | https://docs.google.com/forms/d/e/1FAIpQLSd7x_-z19TFii6kiB5nOdhcPseVdfDVWGjjkUdl6qliUXBKzw/viewform |

<!-- authored-by: claude-code -->
