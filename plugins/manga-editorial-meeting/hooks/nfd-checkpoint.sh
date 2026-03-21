#!/bin/bash
# NFD メモリ状況チェックポイント
# Stop イベントで呼び出され、NFD 三層メモリの蓄積状況を報告する。
# レポート内容の機械検証は行わない（採点軸・問いの品質は editorial-lead のプロンプト側）。
# 結晶化が必要な場合のみ exit 2 で指示を返す。

INPUT=$(cat)

# stop_hook_active チェック
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

# 編集会議レポート以外はスキップ
if [ ${#MSG} -lt 200 ] || ! echo "$MSG" | grep -q "編集会議レポート"; then
  exit 0
fi

# check-crystallization.sh を呼び出して NFD 状況を集計
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NFD_STATUS=""
if [ -x "${SCRIPT_DIR}/scripts/check-crystallization.sh" ]; then
  NFD_STATUS=$(CLAUDE_PLUGIN_ROOT="$SCRIPT_DIR" "${SCRIPT_DIR}/scripts/check-crystallization.sh" 2>/dev/null)
fi

# 出力がなければ（memory 0件 = 初回）スキップ
if [ -z "$NFD_STATUS" ]; then
  exit 0
fi

# 結晶化推奨が含まれているかチェック
if echo "$NFD_STATUS" | grep -q "結晶化推奨"; then
  cat >&2 <<EOF
📊 NFD メモリチェックポイント

${NFD_STATUS}

会議終了前に、NFD メモリの保存と結晶化を実行してください。
EOF
  exit 2
fi

# 結晶化不要だが状況は報告（exit 0 = ブロックしない）
# stderr に出力しても exit 0 なら Claude には渡されないため、ここでは何もしない
exit 0
