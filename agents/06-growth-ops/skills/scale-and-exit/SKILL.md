---
name: scale-and-exit
description: ユニットエコノミクス成立後にスケール計画・運用自動化・Exit準備を行う手順。
---

# スキル: スケール & Exit

## 前提
- pipeline.md でG6基準(LTV≥CPA×3)の達成を確認。

## 手順
1. `stages/08_pmf/` と最新 metrics_report を読む。
2. スケール計画：予算拡大の段階、追加チャネル、LTV向上施策。
3. 運用自動化：サポート/請求/監視の省力化 runbook。
4. Exit検討：安定運用が実現したら売却指標を整理（収益・継続率・成長率・引き継ぎ資料）。

## 出力
- `stages/09_scale/scale_plan.md`
- `stages/09_scale/ops_runbook.md`
- `stages/09_scale/exit_memo.md`（該当時）
