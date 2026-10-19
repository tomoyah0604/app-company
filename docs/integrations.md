# 外部ツール連携（プラグイン / MCP）

`.claude/settings.json` で以下3つのプラグインをプロジェクト共通で有効化している。
このリポジトリを Claude Code で開くと、マーケットプレイスの追加とプラグインのインストールを促される（初回のみ承認）。

| プラグイン | 提供元 | 中身 | 主な利用者 | 用途 |
|---|---|---|---|---|
| `playwright@claude-plugins-official` | Microsoft（Anthropic公式ディレクトリ） | MCPサーバー（`npx @playwright/mcp@latest`） | タクミ / カエデ | MVPのE2E確認・ローンチ前の画面チェック、LPのスクショ取得、競合LPの観察 |
| `skill-creator@claude-plugins-official` | Anthropic | スキル | ソラ / 全員 | `knowledge/playbooks/` の定型業務をスキル化・評価・改善 |
| `chatcut@chatcut-inc` | ChatCut | MCPサーバー（`https://api.chatcut.io/api/external-mcp/mcp`）＋スキル | カエデ | Build in Public 用の開発動画・広告クリエイティブの編集（字幕・カット・書き出し） |

## セットアップ手順（ローカルの Claude Code）

自動で入らない場合は手動で：

```bash
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin marketplace add https://github.com/ChatCut-Inc/agent-plugin.git
claude plugin install playwright@claude-plugins-official
claude plugin install skill-creator@claude-plugins-official
claude plugin install chatcut@chatcut-inc
```

### ChatCut のログイン（必須・初回のみ）

```bash
claude mcp login plugin:chatcut:chatcut   # ブラウザでChatCutアカウントにOAuthサインイン
claude mcp get plugin:chatcut:chatcut     # Connected になっていればOK
```

インストール後は Claude Code を再起動（新しいセッション）しないとツールが見えない。

### Playwright

追加設定不要。初回起動時に `npx` でMCPサーバーを取得する（Node.js 18+ が必要）。

## 運用ルール

- **ChatCut はクレジット消費・クラウドレンダリングがある**。書き出し・生成・プロジェクト削除の前は必ず創業者に確認する。
- Playwright で取得したスクショ・検証結果は `projects/<案件名>/stages/` 配下に保存する（会社憲法ルール2）。
- skill-creator で作ったスキルは `.claude/skills/<スキル名>/` に置き、`knowledge/` 登録案と同様に承認後に確定する。
