---
name: metrics-report
description: 課金率・ファネル・継続率・ユニットエコノミクスを集計し、各ゲート基準に対する達成/未達を示すレポート手順。
---

# スキル: 指標レポート

## 手順
1. 計測データ源（PostHog等）と `knowledge/metrics` のベンチマークを確認。
2. フェーズに応じ集計：
   - G4: CVR = 課金者 ÷ DL。100〜300DL時点。
   - ⑨: ファネル各段の離脱率、継続率カーブ。
   - G5: D30継続率、または残念度アンケート(40%基準)。
   - G6: LTV = 平均課金額×継続期間、CPAと比較（×3基準）。
3. 各指標を「基準に対して達成✅/未達❌」で明記。
4. 次アクションの示唆（改善優先度）を添える。

## 出力
- `stages/07_analytics/metrics_report.md`
- `stages/07_analytics/funnel_analysis.md`
- `stages/08_pmf/pmf_report.md`（PMFフェーズ時）
