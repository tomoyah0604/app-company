---
name: handoff-template
description: エージェント間の引き継ぎ共通書式。すべてのハンドオフはこれに従う。
type: template
project: global
date: 2026-07-12
---

# HANDOFF
from: <エージェント>
to: <エージェント>
project: <案件名>
stage: <G0〜G6>
status: DONE | BLOCKED | NEEDS_DECISION
## 成果物
- <リンク/数値>
## 判定材料（該当ゲート基準に対して）
- 基準 <xxx> → 達成✅ / 未達❌
## 次アクション提案（次エージェントへのプロンプト）
> <相手> へ: 「<具体的な依頼文>」
## 学び（knowledge登録候補）
- <一言知見>
