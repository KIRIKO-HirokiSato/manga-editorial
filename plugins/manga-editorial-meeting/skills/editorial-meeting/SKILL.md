---
name: editorial-meeting
description: |
  漫画の企画メモを渡すだけで、AI編集者チームが自動で編集会議を開催し、
  4軸スコア評価・改善提案・掲載判断まで出力する。
  AgentTeams による複数エージェントのリアルタイム議論で、
  編集会議の臨場感を再現する。
  引数なし or 「demo」で企画を自動生成するデモモードあり。
user-invocable: true
context: fork
agent: editorial-lead
---

漫画の企画メモに対して AI 編集会議を実行してください。
企画メモが空、または「demo」「デモ」「おまかせ」等のキーワードのみの場合はデモモードで動作してください。

## NFD メモリ状況（動的コンテキスト）

!`${CLAUDE_PLUGIN_ROOT}/scripts/check-crystallization.sh`

## 企画メモ

$ARGUMENTS
