#!/bin/bash
# 漫画編集会議 品質ゲート + ブラッシュアップループ
# Stop イベントで呼び出され、以下を順にチェックする:
#   Stage 1: レポートの必須項目の存在（品質チェック）
#   Stage 2: 掲載判断が「掲載」かどうか（ループ判定）
# 品質未達またはループ継続の場合、exit 2 でブロックする。
# 品質未達 + 掲載未達が同時の場合は、両方の指示をまとめて返す。

INPUT=$(cat)

# stop_hook_active チェック（無限ループ防止）
ACTIVE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('stop_hook_active', False))
except:
    print('False')
" 2>/dev/null)

if [ "$ACTIVE" = "True" ] || [ "$ACTIVE" = "true" ]; then
  exit 0
fi

# last_assistant_message を抽出
MSG=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('last_assistant_message', ''))
except:
    print('')
" 2>/dev/null)

# メッセージが空 or 短すぎる場合はスキップ（編集会議以外の応答）
if [ ${#MSG} -lt 200 ]; then
  exit 0
fi

# 編集会議レポートかどうかを判定（レポート以外の応答はスキップ）
if ! echo "$MSG" | grep -q "編集会議レポート"; then
  exit 0
fi

# === Stage 1: 品質チェック（必須項目の存在） ===
MISSING=""

echo "$MSG" | grep -qE "主人公エンジン.*/10" || MISSING="${MISSING}
- 主人公エンジンのスコア（X/10 形式）"

echo "$MSG" | grep -qE "対立構造.*/10" || MISSING="${MISSING}
- 対立構造のスコア（X/10 形式）"

echo "$MSG" | grep -qE "読者フック.*/10" || MISSING="${MISSING}
- 読者フックのスコア（X/10 形式）"

echo "$MSG" | grep -qE "連載エンジン.*/10" || MISSING="${MISSING}
- 連載エンジンのスコア（X/10 形式）"

echo "$MSG" | grep -qE "(掲載判[断定]|条件付き通過|保留|却下)" || MISSING="${MISSING}
- 掲載判断（掲載/条件付き通過/保留/却下のいずれか）"

echo "$MSG" | grep -qE "(改善|アクション|提案)" || MISSING="${MISSING}
- 改善アクションリスト"

echo "$MSG" | grep -qE "根拠" || MISSING="${MISSING}
- 各スコアの根拠"

echo "$MSG" | grep -qE "(企画サマリー|サマリー|ログライン)" || MISSING="${MISSING}
- 企画サマリー"

# === Stage 2: 掲載判断チェック（ブラッシュアップループ） ===
NEED_BRUSHUP=false
NEXT_ROUND=""

# 「掲載」判定かどうか（macOS 互換: PCRE 不使用）
# 「条件付き通過」「保留」「却下」のいずれかが含まれている = 掲載ではない
IS_PUBLISHED=false
if echo "$MSG" | grep -qE "掲載判[断定]" && \
   ! echo "$MSG" | grep -qE "(条件付き通過|保留|却下)"; then
  IS_PUBLISHED=true
fi

if [ "$IS_PUBLISHED" = "false" ]; then
  # ラウンド数を検出（macOS 互換: grep -oE + sed）
  ROUND=$(echo "$MSG" | grep -oE '(Round *[0-9]+|第[0-9]+回|第[0-9]+周)' | tail -1 | grep -oE '[0-9]+')
  if [ -z "$ROUND" ]; then
    ROUND=1
  fi

  MAX_ROUNDS=3

  if [ "$ROUND" -ge "$MAX_ROUNDS" ]; then
    # 最大ラウンド到達 → ループしない
    NEED_BRUSHUP=false
  else
    NEED_BRUSHUP=true
    NEXT_ROUND=$((ROUND + 1))
  fi
fi

# === 結果出力 ===

# 両方OKなら通過
if [ -z "$MISSING" ] && [ "$NEED_BRUSHUP" = "false" ]; then
  exit 0
fi

# いずれかが未達 → exit 2 で統合フィードバック
{
  # 品質未達がある場合
  if [ -n "$MISSING" ]; then
    cat <<EOF
🔍 品質チェック: 未達項目あり

編集会議レポートに以下の必須項目が不足しています:
${MISSING}

レポートテンプレートに従って、不足項目を補完してください。
テンプレートは references/report-template.md を参照してください。
EOF
  fi

  # ブラッシュアップが必要な場合
  if [ "$NEED_BRUSHUP" = "true" ]; then
    # 品質未達もある場合は区切りを入れる
    if [ -n "$MISSING" ]; then
      echo ""
      echo "---"
      echo ""
    fi

    cat <<EOF
🔄 掲載基準未達 — ブラッシュアップ Round ${NEXT_ROUND} を開始してください。

現在の掲載判断は「掲載」ではありません。以下の手順で企画を改善して再会議を実行してください:

1. まずレポートの不足項目があれば補完してください。

2. NFD メモリを保存してください（会議記録 + 振り返り）。

3. crystallizer エージェントを spawn して結晶化を実行してください。
   結晶化により、次ラウンドの編集者チームが最新の知見を参照できます。

4. brush-up-writer エージェントを spawn し、以下を渡してください:
   - 元の構造化企画メモ（structured_proposal）
   - 今回の編集会議レポート全文（4軸スコア・改善アクションリスト）
   - ラウンド番号: Round ${NEXT_ROUND}

5. brush-up-writer から改稿版企画メモを受け取ったら、
   その改稿版で **新しい編集会議（Phase 0 から）** を開始してください。
   - 新しい TeamCreate で新チームを作成
   - 改稿版の structured_proposal を全 teammate に渡す
   - レポートには「Round ${NEXT_ROUND}」を明記する

6. 前回スコアとの差分比較を必ずレポートに含めてください。
EOF
  fi
} >&2
exit 2
