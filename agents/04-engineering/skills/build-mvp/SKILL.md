---
name: build-mvp
description: PRDに沿ってMVPを最短実装し、課金と計測を組み込んで公開するまでの手順。
---

# スキル: MVP構築

## 前提
- pipeline.md でG1(需要検証)通過を確認。

## 手順
1. `stages/02_prd/PRD.md` と `knowledge/playbooks` を読む。
2. MVP「必須」スコープだけを実装（後回し/やらないは触らない）。
3. 課金導線を実装。
4. 計測（ファネル用イベント、PostHog等）を仕込む。
5. デプロイ・公開。計測が動作することを確認。
6. release_notes と既知課題を記録。

## 出力
- 実装コード（アプリ用ディレクトリ）
- `stages/06_launch/release_notes.md`

## アップデート運用（⑨）
ミオの `funnel_analysis.md` を読み、離脱ポイント順に改善を反復。
