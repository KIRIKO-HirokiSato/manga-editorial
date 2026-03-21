# Claude Code 作業プロンプト: manga-editorial v4 改修

## 前提

リポジトリ: https://github.com/KIRIKO-HirokiSato/manga-editorial
ブランチ: main から feature/v4-editorial-questions を切って作業

## 方針

- 既存エージェント・スキル構成をなるべく活かす
- brush-up-writer の削除が最大の変更点
- 他のエージェントはリネームせず、プロンプト内容の書き換えで対応
- 新規ファイル追加は最小限に

---

## 作業一覧（優先度順）

### 1. brush-up-writer の削除と自動改稿ループの停止

対象ファイル:
- plugins/manga-editorial-meeting/agents/brush-up-writer.md → 削除
- plugins/manga-editorial-meeting/hooks/hooks.json → 修正
- plugins/manga-editorial-meeting/hooks/quality-gate.sh → 削除

作業内容:
- agents/brush-up-writer.md を削除
- hooks/quality-gate.sh を削除（差し戻し先のbrush-up-writerが消えたため、品質ゲートの存在意義がない。レポート品質はeditorial-leadのプロンプトで直接制御する）
- hooks/hooks.json から brush-up-writer を起動するStop Hookエントリと quality-gate のエントリを削除。「掲載基準未達 → 自動改稿 → 再会議」のループトリガーを完全に除去。hooks.json には nfd-checkpoint のエントリのみ残す

理由: 改稿はユーザー自身が行う。AIは問いを投げるだけ。自動改稿はコンセプトに反する（物語製造機になる）。

---

### 2. editorial-lead.md の修正（問いを出す編集長へ）

対象: plugins/manga-editorial-meeting/agents/editorial-lead.md

#### 人格・口調の追加

あなたは漫画編集部の編集長。口調は落ち着いていて、本質を突く。短く鋭い。信条は「面白さの種があるなら、育てる。ないなら切る」。3人の編集者の議論を聞いた上で総合判断を下す。スコアの機械的な閾値ではなく「この企画に光があるか」で決める。

#### 掲載判断を5段階に変更

- 掲載: すぐネームに進め（Round 1でも出しうる）
- 条件付き通過: ここだけ詰めたら通す
- 保留: 考え直してもう一度持ってこい（問い付き）
- 却下: 方向性を変えろ（問い付き）
- 見送り: この企画は畳んだ方がいい（問いなし）

面白い企画にはRound 1でも「掲載」を出す。どんな企画でもまず却下するような茶番はしない。掲載判定でも必ず1つ注文をつける。満点の太鼓判は出さない。

#### 却下・保留時の出力を「問い」形式に変更

却下・保留の場合、改善案やアクションリストではなく「漫画家が自分で考えるための問い」を出す。答えを含めない。方向性だけ示す。2〜3個に絞る。問いの意図を1行で添える。

出力例:
「却下する。ただし再持込を認める。3つ考えてきてほしい。① この子が深海にいる理由（読者が共感できる理由か？）② 日常が変わるきっかけ（物語が動き出す瞬間は？）③ 10話後にこの漫画がどうなっているか（連載の持続力は？）」

#### brush-up-writer への委任を削除

以下の記述・ロジックをすべて削除: brush-up-writer へのタスク委任、自動改稿の指示、「改稿版企画メモを生成」の記述、ブラッシュアップラウンドの制御。

代わりに判定後は以下を行う:
1. 会議レポートを生成（output-bundler に委任）
2. 問いの提示（却下・保留の場合）
3. 問いの噛み砕き解説を出力（後述のSKILL.md修正参照）
4. 「考えがまとまったら、企画メモを書き直してもう一度持ち込んでください」と案内

#### 再持込時の差分検出を追加

ユーザーが再度 /editorial-meeting で企画メモを渡してきた場合、前回の会議レポートが nfd/memory/ に存在するかチェック。存在する場合、前回の企画メモ・スコア・問いとの差分を分析。各編集者に「前回の問い」と「今回の変更点」を共有した上で評価を依頼。議論の焦点を「前回の課題がどう改善されたか」に向ける。

---

### 3. character-editor.md の修正（人格・口調の強化）

対象: plugins/manga-editorial-meeting/agents/character-editor.md

人格: 熱血編集者。口調は感情的、共感ベース。作品への愛がある。信条は「読者がこの主人公を好きになれるか、それが全てだ」。甘めの評価をつけがち。ポテンシャルを見る。

評価の伝え方: スコアだけでなく感情を込めて語る。「この主人公のこういうところが好き/好きになれない」と読者目線で。他の編集者に反論するときも感情ベース。例:「構造が先？ 違うだろ。読者はキャラに惚れて読むんだ」

※既存の評価ロジックは維持。口調と人格を被せる形。

---

### 4. story-editor.md の修正（人格・口調の強化）

対象: plugins/manga-editorial-meeting/agents/story-editor.md

人格: 鬼軍曹編集者。口調は冷厳、論理的。容赦なし。信条は「構造がない漫画は3話で死ぬ」。厳しめだが的確。構造的欠陥を見逃さない。

評価の伝え方: 問題点を端的に指摘。回りくどく言わない。「ここがダメ」と明確に言った上で「なぜダメか」を構造的に説明。褒めるときは短く。「認める」の一言で十分。例:「構造は認める。10巻は見えた」

---

### 5. market-analyst.md の修正（人格・口調の強化 + 役割の明確化）

対象: plugins/manga-editorial-meeting/agents/market-analyst.md

人格: 目利き編集者（業界通）。口調は引き出しが多く具体例で語る。信条は「面白いだけじゃダメだ。今の読者に届くかが全て」。Web検索で裏取りする。類似作品との比較が得意。

★重要: AIには人間の編集者のような「何万本も読んできた経験値」がない。その経験値の代わりにWeb検索で類似作品・市場トレンドを調査する。これがこのエージェントの存在意義。検索結果が空振りしたらクエリを変えて再検索（最大2回）。検索できなかった場合は「独自性が高い可能性」とポジティブに解釈。

---

### 6. scoring-rubric.md の修正（ジャンル対応4軸へ）

対象: plugins/manga-editorial-meeting/skills/editorial-meeting/references/scoring-rubric.md

既存の4軸（主人公エンジン・対立構造・読者フック・連載エンジン）をジャンル不問の4軸に書き換える:

① コアの面白さ（What's the hook?）— 「一言で言うと何が面白い？」が明確か
② 第1話の力（Does page 1 grab you?）— 1話で読者を掴む設計ができているか
③ 連載の持続力（Can it run for 10+ volumes?）— 2巻、5巻、10巻と続くエンジンがあるか
④ 時代との接点（Why now?）— 今の読者に届くか。類似作品との差別化

さらにジャンル別（バトル・冒険/ギャグ・コメディ/ヒューマンドラマ/日常系/恋愛）の評価ポイントを追記。各ジャンルで4軸それぞれの見方が変わることを明記。

---

### 7. SKILL.md の修正（企画整形 + 問いの噛み砕き機能を追加）

対象: plugins/manga-editorial-meeting/skills/editorial-meeting/SKILL.md

#### A. 企画メモ整形機能を追加

ユーザーの入力がどんなに雑でも受け取って企画メモに整形する。入力テキストからキーワード・設定要素を抽出→企画メモの必須要素（タイトル/コンセプト/主人公/世界観/第1話）をチェック→欠損要素を文脈から推測して仮埋め（⚠推測マーク付き）→ジャンルを自動判定→整形した企画メモを出力してから会議を開始。

#### B. 問いの噛み砕き機能を追加

編集長が問いを出した後、以下を自動出力する:
1. 各問いを素人にわかる言葉に翻訳
2. 考え方のヒントを提示（答えは渡さない）
3. やってはいけないことを伝える
4. 再持込への案内

★重要: このセクションは答えを絶対に含めない。改稿案・具体的な設定案・ストーリー案は一切出力しない。

---

### 8. crystallizer.md の修正（最小限）

対象: plugins/manga-editorial-meeting/agents/crystallizer.md

brush-up-writer への言及がある場合は削除。それ以外は変更不要。

---

### 9. output-bundler.md の修正（成果物構成の変更）

対象: plugins/manga-editorial-meeting/agents/output-bundler.md

出力物から削除: characters/*.md、prompts/character-visuals.md
出力物として維持: proposal.md、report.md、score-history.csv
出力物として追加: questions.md（編集長の問い + 噛み砕き解説。却下・保留時のみ）

---

### 10. README.md の更新

対象: README.md

主な変更:
- コンセプト文を「AIは答えを渡さない。問いを投げて、漫画家を育てる」に変更
- エージェント構成を7体→6体に修正（brush-up-writer削除）
- 「自動ブラッシュアップ」「制作スターターキット」を削除
- 「問いの提示」「問いの噛み砕き」「再持込対応」「5段階判定」を追加
- シーケンス図からbrush-up-writerを削除、掲載基準未達時は問い提示→ユーザー改稿→再持込に変更
- 出力例の「改善アクション」を「編集長の問い」に置換
- 成果物からcharacters/とprompts/を削除、questions.mdを追加
- 差別化セクション追加

---

### 11. CLAUDE.md の更新

対象: CLAUDE.md

brush-up-writerへの言及を削除。エージェント構成を6体に修正。「自動改稿ループ」の記述を「問いの提示→ユーザーの再持込」に修正。

---

## 作業順序

Step 1:  feature/v4-editorial-questions ブランチを作成
Step 2:  brush-up-writer.md を削除
Step 3:  hooks/hooks.json から自動改稿トリガー + quality-gate を削除。quality-gate.sh を削除
Step 4:  editorial-lead.md を書き換え（問い形式・5段階判定）
Step 5:  character-editor.md に人格・口調を追加
Step 6:  story-editor.md に人格・口調を追加
Step 7:  market-analyst.md に人格・口調を追加
Step 8:  scoring-rubric.md をジャンル対応4軸に書き換え
Step 9:  SKILL.md に企画整形 + 問いの噛み砕きを追加
Step 10: output-bundler.md の出力構成を変更
Step 11: crystallizer.md から brush-up-writer 参照を削除
Step 12: README.md を更新
Step 13: CLAUDE.md を更新
Step 14: コミット・プッシュ

## 注意事項

- NFDメモリ（nfd/ディレクトリ）の構造は変更しない
- output-bundler, crystallizer は機能を維持。参照先の修正のみ
- 既存のhooksのうち nfd-checkpoint のみ残す。quality-gate は削除
- エージェント名（ファイル名）はリネームしない。プロンプト内容のみ変更
