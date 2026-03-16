#!/bin/bash
# 漫画編集会議 品質ゲート
# Stop イベントで呼び出され、レポートの必須項目をチェックする。
# 不足があれば exit 2 でブロックし、Claude に補完を指示する。

INPUT=$(cat)

# stop_hook_active チェック（無限ループ防止）
# 品質ゲートによる再実行中は再度ブロックしない
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

# === 品質チェック開始 ===
MISSING=""

# 1. 4軸スコアの存在チェック
echo "$MSG" | grep -qE "主人公エンジン.*/10" || MISSING="${MISSING}
- 主人公エンジンのスコア（X/10 形式）"

echo "$MSG" | grep -qE "対立構造.*/10" || MISSING="${MISSING}
- 対立構造のスコア（X/10 形式）"

echo "$MSG" | grep -qE "読者フック.*/10" || MISSING="${MISSING}
- 読者フックのスコア（X/10 形式）"

echo "$MSG" | grep -qE "連載エンジン.*/10" || MISSING="${MISSING}
- 連載エンジンのスコア（X/10 形式）"

# 2. 掲載判断の存在チェック
echo "$MSG" | grep -qE "(掲載|条件付き通過|保留|却下)" || MISSING="${MISSING}
- 掲載判断（掲載/条件付き通過/保留/却下のいずれか）"

# 3. 改善アクションの存在チェック
echo "$MSG" | grep -qE "(改善|アクション|提案)" || MISSING="${MISSING}
- 改善アクションリスト"

# 4. 根拠の存在チェック
echo "$MSG" | grep -qE "根拠" || MISSING="${MISSING}
- 各スコアの根拠"

# 5. 企画サマリーの存在チェック
echo "$MSG" | grep -qE "(企画サマリー|サマリー|ログライン)" || MISSING="${MISSING}
- 企画サマリー"

# === 結果判定 ===
if [ -n "$MISSING" ]; then
  cat >&2 <<EOF
🔍 品質チェック: 未達項目あり

編集会議レポートに以下の必須項目が不足しています:
${MISSING}

レポートテンプレートに従って、不足項目を補完してください。
テンプレートは references/report-template.md を参照してください。
EOF
  exit 2
fi

# 全項目OK
exit 0
