#!/bin/bash
# 結晶化トリガーチェック
# SKILL.md の動的コンテキスト (!`command`) から呼び出される。
# 三層（memory → patterns → crystals）の蓄積状況を確認し、
# 結晶化が必要なら指示を出力する。
#
# 未処理計算: LLM が書く source-count に依存せず、
# ファイルの更新日時（find -newer）で堅牢に判定する。

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
MEMORY_DIR="$PLUGIN_ROOT/nfd/memory"
PATTERNS_DIR="$PLUGIN_ROOT/nfd/patterns"
CRYSTALS_DIR="$PLUGIN_ROOT/nfd/crystals"

# .md ファイル数をカウント（.gitkeep を除外）
count_md() {
  local dir="$1"
  if [ -d "$dir" ]; then
    find "$dir" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' '
  else
    echo "0"
  fi
}

# memory 層
CE_COUNT=$(count_md "$MEMORY_DIR/character-editor")
SE_COUNT=$(count_md "$MEMORY_DIR/story-editor")
MA_COUNT=$(count_md "$MEMORY_DIR/market-analyst")
EL_COUNT=$(count_md "$MEMORY_DIR/editorial-lead")
CM_COUNT=$(count_md "$MEMORY_DIR/common")
MEM_TOTAL=$((CE_COUNT + SE_COUNT + MA_COUNT + EL_COUNT + CM_COUNT))

# patterns 層
PAT_COUNT=$(count_md "$PATTERNS_DIR")

# crystals 層
CRY_COUNT=$(count_md "$CRYSTALS_DIR")

# --- 未処理 memory の算出（find -newer ベース） ---
# crystals/common.md が存在すれば、それより新しい memory ファイルを未処理とみなす。
# 存在しなければ（結晶化未実施）、全 memory が未処理。
LAST_CRYSTALLIZED="未実施"
UNPROCESSED="$MEM_TOTAL"

# 基準ファイル: crystals/ 内で最も新しい .md ファイル
REFERENCE_FILE=""
if [ -d "$CRYSTALS_DIR" ]; then
  REFERENCE_FILE=$(find "$CRYSTALS_DIR" -name "*.md" -type f -print0 2>/dev/null \
    | xargs -0 ls -t 2>/dev/null | head -1)
fi

if [ -n "$REFERENCE_FILE" ]; then
  # 最終結晶化日をファイルの更新日時から取得（LLM の書く値に依存しない）
  LAST_CRYSTALLIZED=$(date -r "$REFERENCE_FILE" "+%Y-%m-%d" 2>/dev/null || echo "不明")

  # 基準ファイルより新しい memory ファイルの数 = 未処理数
  UNPROCESSED=$(find "$MEMORY_DIR" -name "*.md" -type f -newer "$REFERENCE_FILE" 2>/dev/null | wc -l | tr -d ' ')
fi

# 閾値: 未処理 memory 3件以上で結晶化を推奨
# 1会議 = 最大5件の memory（4ロール + common）
# → 初回会議後の2回目で確実にトリガーされる（デモで「学習」が見える）
THRESHOLD=3

if [ "$MEM_TOTAL" -eq 0 ]; then
  # memory がまだない場合は何も出力しない（初回実行）
  exit 0
fi

echo "## NFD 三層メモリ状況"
echo ""
echo "### memory 層（生の経験記録）"
echo "| ロール | 蓄積数 |"
echo "|--------|--------|"
echo "| character-editor | ${CE_COUNT}件 |"
echo "| story-editor | ${SE_COUNT}件 |"
echo "| market-analyst | ${MA_COUNT}件 |"
echo "| editorial-lead | ${EL_COUNT}件 |"
echo "| common | ${CM_COUNT}件 |"
echo "| **合計** | **${MEM_TOTAL}件** |"
echo ""
echo "### patterns 層（抽出済みパターン）: ${PAT_COUNT}件"
echo "### crystals 層（確定知識）: ${CRY_COUNT}件"
echo ""
echo "最終結晶化: ${LAST_CRYSTALLIZED}"
echo "未処理 memory: ${UNPROCESSED}件"

if [ "$UNPROCESSED" -ge "$THRESHOLD" ]; then
  echo ""
  echo "---"
  echo ""
  echo "**⚡ 結晶化推奨**: 未処理の memory が ${UNPROCESSED}件 蓄積されています。"
  echo "会議開始前に crystallizer エージェントを spawn して結晶化を実行してください。"
  echo "結晶化プロセス: memory → patterns 抽出 → crystals 昇格 の二段階で処理されます。"
fi
