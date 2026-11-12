# Habit Town — 競合分析（G0判定材料）

- 作成: ハヤテ（01 discovery） / 2026-11-12
- 対象ゲート: G0（判定はソラ。本書はGO/NO-GOを判定しない）
- 着手前に参照した knowledge: `knowledge/README.md`（索引は「まだありません」。insights / playbooks に参照できる既存知見なし）
- 数字の扱い: **【公式】**＝運営元・本人の発表（第三者の検証なし）、**【推計】**＝アプリ分析サービスや報道の推計。推計同士で数倍ずれるものは幅で書く。不明なものは「不明」と書く。
- 調査上の制約: AppGoblin のページは今回の環境から直接開けなかった（ネットワーク許可外）。AppGoblin の数値は検索結果の抜粋からの引用で、ページ上で再確認はできていない。

---

## 0. 結論サマリ

1. **司令塔の仮説は「おおむね支持、ただし一部修正」**。
   - 「75 Hard 系は小さい」→ **支持**。ただし「公式アプリで約16万インストール」は Android 版のみの推計（約14万）に近い。iOS 版は約36万の推計もあり、合計すると約50万。それでも Finch（約4,200万）より2桁小さいことは変わらない。
   - 「友達の今が見える町を看板に」→ **支持。ただし言い方を修正**。whoo / NauNau の勢いは**中高生の「現在地」共有**の文化で、ターゲットの20〜30代にそのまま当てはまる根拠はない。Zenly は4,000万MAUでも収益化できずに終了した。看板は「友達が**どこにいるか**」ではなく「友達が**いま何をがんばっているか**」に寄せるべき。
2. **空いている場所**: 「友達と使う」×「キャラ・世界観」×「習慣（行動）の可視化」。Finch はキャラと世界観は強いが1人用が中心。みんチャレは仲間がいるがチャットとチェックで見た目が地味。whoo は友達がいて地図もあるが習慣の要素がない。Pikmin Bloom は世界観と位置情報があるが「歩く」ことしか扱わない。**友達の習慣が、キャラの行動として1画面の町に並ぶ**ものは今回の調査では見つからなかった。
3. **トップ3のリスク**: ①最初の1人問題（友達がいないと町が空。看板の価値が出ない）、②習慣アプリの継続率の低さ（Health & Fitness の30日継続率は推計で約3〜8%。G5の基準は15%）、③プライバシーとOSの制約（位置情報は流出事故の前例あり。iOS の Screen Time のデータは原則として端末の外に出せない）。

---

## 1. 競合一覧（主要12）

| # | アプリ（国） | ターゲット | コア体験 | 課金モデル・価格 | 規模（区分・出典） | 強み | 弱み（＝差別化の余地） |
|---|---|---|---|---|---|---|---|
| 1 | **Finch: Self-Care Pet**（米） | セルフケアをしたい若年層。女性が多いと言われる（比率は未確認） | 自分の小鳥キャラを、セルフケアの目標を達成して育てる | フリーミアム＋サブスク「Finch Plus」。月$5.99〜9.99／年$39.99〜69.99【推計・Adapty調べ】 | 累計約4,210万インストール【推計・AppGoblin】／月の売上 約$1M、月の新規DL 約60万【推計・Adapty】／直近90日で234万DL、米国が61.8%【推計・FoxData。時期不明】 | キャラへの愛着で続く。罪悪感を与えないトーン。収益化が実証済み | 1人用が中心（友達機能はあるが体験の中心ではない。詳細は要確認）。2Dで、友達の「いま」は見えない |
| 2 | **Habitica**（米） | ゲーム好きの生産性層 | タスク・習慣をこなすとピクセルRPGのアバターが成長。パーティーで一緒にボスと戦う | 無料＋サブスク・課金アイテム（価格は未確認）。Androidは広告比率が高い推計 | 「400万人以上」・売上$5.2M【推計・出典の質が低い集計記事】／Android MAU 約19万【推計・AppGoblin】 | 「友達とクエスト」の先行事例。熱心なファンがいる | UIが古くて複雑。1秒では伝わらない。信頼性への不満のレビュー |
| 3 | **みんチャレ**（日） | 習慣化したい社会人（勉強・ダイエット・運動） | 同じ目標の**匿名5人チーム**で、写真付きで報告し合う | 月500円／年4,700円【公式・AppBank 2025/10】 | 「累計30万人以上の習慣化をサポート」【公式・時期が古い可能性】 | 知らない人同士で「最初の1人問題」を解いている。2015年から続く | チャットとチェックリスト中心で見た目が地味。友達（リアルな知り合い）との体験ではない |
| 4 | **75 Hard 公式**（米） | 自己啓発・筋トレ層（Andy Frisella のファン） | 75日間の厳しいルールを毎日チェック | 有料／課金（価格は未確認） | iOS 約35.6万／Android 約14.1万インストール【推計・AppGoblin】／月の売上は <$10K（AppGoblin）〜$50K〜65K（ScreensDesign）と推計がばらつく | 明確なルール＝1秒で分かる | 市場が小さく、1人で根性勝負。2Dのチェックリスト。類似アプリが乱立 |
| 5 | **whoo**（日・LinQ） | 中高生（開発元によると利用者の8割が中高生世代【公式・2023年】） | 友達の現在地・電池残量・滞在などを地図で共有 | 無料（収益モデルは不明） | 3か月で1,000万DL【公式・2023/4報道】／1,500万DL以上【博報堂の調査発表・2024/4】／高校生の利用経験42.7%（新SNSで1位）【ペンマーク調査・2023/8】 | Zenly 後継として若年層の「常時接続」を獲得 | 20〜30代への浸透は不明。習慣・自己成長の要素なし。収益化が見えない |
| 6 | **NauNau**（日・モバイルファクトリー子会社） | 若年層 | 友達の位置・状態を共有。ゴーストモードなど | 無料（収益モデルは不明） | ユーザー数は不明（公開情報なし） | 上場企業グループの運営。プライバシー機能 | 個人情報が閲覧可能になっていた件が報道された（ScanNetSecurity）＝位置共有の怖さの実例 |
| 7 | **Opal**（米） | スマホ依存を減らしたい人。現在は高校生・大学生がDAUの約3分の2【公式・RevenueCat 記事】 | アプリのブロック・集中時間・スクリーンタイムのスコア | ハードペイウォールでARR $5Mに到達後、コア機能を無料化【公式発言・RevenueCat】。価格は未確認 | 累計1,000万インストール【公式】／DAU 100万【公式・報道】／月の売上 $400K〜500K【推計】 | Screen Time APIを使った製品の代表格 | 「我慢させる」体験。友達・世界観は弱い |
| 8 | **one sec**（独・個人開発） | SNSを開きすぎる人 | SNSを開く前に深呼吸を挟む | 無料（1アプリ）＋年額のPro（価格は未確認） | MAU 約8.9万・月の売上 <$10K【推計・AppGoblin】〜月$80K【推計・ScreensDesign】で大きくずれる／マックス・プランク研究所と効果を研究 | 個人開発でも成立する例。研究の裏付け | 1人用。可視化や共有はない |
| 9 | **BeReal**（仏・Voodoo傘下） | Z世代 | 1日1回の通知で、同時に前後カメラで撮って友達と共有 | 広告（米国で広告基盤を開始） | MAU 約4,000万（米国約500万）【公式・2025】／ピーク7,350万（2022/8）／2025年の売上 €30M【Voodoo幹部のLinkedIn投稿＝自己申告】／日本は主要3市場の1つ【公式】 | 「友達の今」を毎日1回だけ見せる設計 | 一度大きく落ちた（ピークから減少）。習慣の要素なし |
| 10 | **Locket Widget**（米） | Z世代・α世代、カップル | 友達の写真がホーム画面のウィジェットに届く | 課金（Locket Gold）＋広告。IAP 55%／広告 45%【推計・AppGoblin】 | 8,000万DL超・DAU 900万超【公式・TechCrunch 2025/8】／2024年に黒字化【公式】／調達額 $12.5M【報道】 | 「アプリを開かずに友達の今が見える」。少額調達で黒字 | 写真の共有のみ。習慣・継続の文脈なし |
| 11 | **Pikmin Bloom**（日米・Niantic→Scopely／任天堂IP） | 散歩する大人・ファミリー。売上の約半分が日本【推計】 | 歩くと花が咲き、ピクミンが増える。友達と花の地図を共有 | F2P＋アイテム課金 | 2025年の売上 $34.8M（11か月時点）、累計 $100M 超（2025/12）【推計・AppMagic via PocketGamer.biz】／2025/11の新規DL 66.7万【推計】 | 世界観・位置情報・日本で強い。「歩く」が自動で記録される | 扱える習慣は歩くことだけ。友達の存在感は薄い |
| 12 | **Strava**（米） | ランナー・サイクリスト | GPSで活動を記録し、フォロワーとフィードで称え合う（Kudos） | サブスク（価格は未確認） | 登録1億5,000万人超【公式】／2025年の売上 約$415M〜490M【推計・Business of Apps／Sacra】／評価額 約$2.2B（2025/5）【報道】 | 「友達が走った」を見て称える文化。GPSの計測 | 本気の運動層向けで、キャラや世界観はない。ラン以外の習慣は弱い |

### 参考（主要12以外）
- **Pokémon Sleep**（日・ポケモン）: 睡眠×キャラ。累計 $234.9M【推計・Outlook Respawn】。最初の1年の売上の約7割、DLの37%が日本【推計・Sensor Tower】。→「キャラ×セルフケア」は**日本で特にお金になる**ことの根拠。
- **Forest**（台）: 集中すると木が育つ。Android 約4,790万インストール【推計・AppGoblin】。「続けると世界が育つ」体験の先行事例。
- **Duolingo のフレンドストリーク**: 友達ストリークが1つ以上ある学習者は、その日のレッスンを終える確率が22%高い【公式・相関であり因果ではない】。友達は最大5人。→「少人数の友達」で継続が上がる根拠。
- **Zenly**（Snap）: 4,000万MAUで2023/2/3に終了【Pragmatic Engineer／Life360】。収益化できなかったと指摘されている。→**位置共有は集客には強いが、それだけでは稼げない**。
- **新しい「友達と習慣」アプリ**（HabitForge、HabitFriend、Habidoo、CTRL Habits、HabitLink など）: 2025〜2026年にProduct Hunt やApp Storeで多数公開。調べた範囲では**どれもリスト・ランキング型で、キャラや世界観は見当たらなかった**（各アプリの詳細な機能は未確認）。→「友達と習慣」自体はレッドオーシャン化しつつある。差別化は見た目と体験でしか作れない。

---

## 2. 司令塔の仮説の検証

| 仮説の要素 | 結果 | コメント |
|---|---|---|
| Finch 累計約4,200万インストール・月約$1M | ✅ 一致（ともに推計） | 4,210万（AppGoblin）、月$1M（Adapty／ScreensDesign）。公式値はない |
| whoo の8割が中高生 | ⚠️ 古い | 2023年の開発元の説明。最新の比率は不明 |
| みんチャレ 月500円 | ✅ 一致【公式】 | 年4,700円もある |
| 75 Hard 公式 約16万インストール | ⚠️ 一部のみ | 約16万に近いのは Android 版の約14.1万。iOS 版は約35.6万の推計。合計約50万。「小さい」という結論は変わらない |
| 「75週チャレンジ」を看板にするのは弱い | ✅ 支持 | 市場が小さい＋「75」は 75 Hard 由来で日本では知られていない（日本での認知度のデータはない＝不明） |
| 「友達の今が見える町」を看板に | ✅ 支持（修正あり） | 「現在地」を連想させると、20〜30代は「監視」と感じるおそれ。**「場所」ではなく「がんばっていること」**を見せる言い方にする |

**追加の示唆（3市場の役割分担）**
- ①Finch型（キャラ×セルフケア）＝**お金を生む部分**（着せ替えサブスクは実証済み。¥480/月は Finch の月$5.99〜、みんチャレの500円と同じ価格帯）
- ②whoo型（友達の今）＝**広がる部分**（招待で増える。ただしこれだけでは稼げない＝Zenly）
- ③みんチャレ型（仲間と習慣化）＝**続く部分**（Duolingo の+22%も同じ方向）
- Habit Town はこの3つを「町」という1つの画面にまとめるところに価値がある。

---

## 3. ポジショニングマップ

### マップA: 横軸＝1人用 ↔ 友達と使う／縦軸＝チェックリスト・2D ↔ キャラ・世界観

```
              キャラ・世界観（3D/箱庭/育成）
                         ▲
   Finch    Pokémon Sleep│                ★ Habit Town
   Forest                │               （友達の習慣が町に並ぶ）
          Pikmin Bloom   │
                         │      Habitica（ピクセル・古いUI）
 1人用 ◀─────────────────┼─────────────────▶ 友達と使う
                         │
   75 Hard公式  one sec   │   みんチャレ（匿名5人）  Strava
   Opal                  │   HabitForge等の新興
                         │   whoo / NauNau（地図）  BeReal / Locket（写真）
                         ▼
              チェックリスト・2D・地図・写真
```

### マップB: 横軸＝「どこにいるか」を共有 ↔ 「何をしているか」を共有／縦軸＝その場の共有 ↔ 積み重ね（継続）

```
                    積み重ね（連続日数・成長）
                         ▲
   （空白）               │   みんチャレ  Strava  Duolingo友達ストリーク
                         │           ★ Habit Town
 どこにいるか ◀───────────┼───────────▶ 何をしているか
   whoo / NauNau          │   BeReal / Locket
   Zenly(終了)            │
   Pikmin Bloom（花の地図）│
                         ▼
                    その場（いま）だけの共有
```

### 空いている場所（言葉にすると）
> **「友達のがんばりが、かわいいキャラの“行動”として町に並び、何日続いているかが一目で分かる場所」**

- Finch・Pokémon Sleep は世界観の強さで稼いでいるが、**友達は主役ではない**。
- みんチャレ・Strava・新興の「友達と習慣」アプリは仲間がいるが、**見た目はリストやフィード**で、「眺めて楽しい」画面がない。
- whoo・BeReal・Locket は「友達の今」を見せる力が強いが、**積み重ね（継続）の意味がない**。
- Habit Town は「いま（何をしているか）」と「積み重ね（何日連続か）」を、1画面の町で同時に見せる。マップBの右上、マップAの右上はどちらも、調べた範囲では埋まっていない。

---

## 4. 1秒理解テスト（一言サマリ案）

評価: ◎=強い ○=普通 △=弱い。「SNSのタイムラインで流れてきたとき」を想定。

| # | 一言サマリ案 | 1秒で分かるか | 共感 | 差別化 | 動画にしやすいか | コメント |
|---|---|---|---|---|---|---|
| A | **友達の“がんばり”が見える、ちいさな町** | ◎ | ◎ | ◎ | ◎ | 看板の候補「友達の今が見える町」を、監視の印象が出ないよう言い換えたもの。**推奨** |
| B | 友達の今が見える町（原案そのまま） | ◎ | ○ | ◎ | ◎ | 分かりやすいが「今」＝現在地（whoo）と受け取られやすい。20〜30代は抵抗を感じるおそれ |
| C | 習慣をこなすと、キャラがジムへ歩いていく | ○ | ○ | ○ | ◎ | brief の現行案。動画の冒頭3秒としては強い。ただ1人用の体験に見え、Finch との違いが伝わりにくい |
| D | キャラと続ける習慣トラッカー | ◎ | ○ | △ | △ | Finch・Habitica と区別がつかない |
| E | 75週チャレンジを、友達と町で | △ | △ | ○ | ○ | 「75週」に説明が要る。日本では 75 Hard の文脈が通じにくい。1秒テストで不合格 |

**推奨の組み合わせ**
- 看板（アプリ名の下・LP の見出し）: **A「友達の“がんばり”が見える、ちいさな町」**
- SNS動画の冒頭: **C の映像**（キャラがトコトコジムへ歩く→カメラが引いて、友達のキャラもそれぞれ図書館・公園でがんばっている町全体）
- 「75週チャレンジ」はアプリ内のイベント（期間限定の挑戦）に格下げする

---

## 5. UI/UXの差別化（G0基準に対して言葉にする）

1. **記録＝キャラが「その場所へ行く」**: チェックボックスを押すと、キャラがジム・図書館・カフェ・公園へ歩いていく。他社は「チェックが付く」「数字が増える」止まり。記録した結果が**目で見える行動**になる。
2. **友達の状態が「地図のピン」ではなく「キャラの行動」で分かる**: whoo は位置のピン、みんチャレはチャットの文字。Habit Town は「ハルは図書館で読書中、88日連続」が**名札とポーズ**で1秒で読める（DESIGN.md の aria-label 例がそのままコピーになる）。
3. **1画面で全員が見える**: フィードを下にスクロールしなくても、町を見るだけで友達全員の状況が分かる。BeReal・Strava はスクロール前提。
4. **色で習慣と場所がつながる**: ジム＝ティール、読書＝オレンジなど、3DとUIで同じ色（DESIGN.md）。説明なしで対応が分かる。
5. **続けた分だけ町が育つ**: 花が増え、建物が変わる。Forest・Pikmin Bloom で実証された「世界が育つ」報酬を、**友達と共有する町**に持ち込む。
6. **応援が軽い**: 拍手・ハートを1タップ。受け取ったキャラが跳ねる。Strava の Kudos と同じ「軽い承認」を、かわいい形で返す。
7. **時間帯で町が変わる**: 朝・昼・夕・夜の光。夜に友達の家の窓が光る＝「みんな今日も終えた」が雰囲気で伝わる。

**一文にすると**: 他社が「リスト・地図・写真」で見せている「友達の習慣」を、Habit Town は**箱庭の町でキャラが動く様子**として見せる。眺めるだけで楽しく、1秒で状況が分かる。

**注意（差別化の持続性）**: 見た目による差別化は真似されやすい。守りになるのは「友達の関係（ネットワーク）」と「町に積み上がった履歴（花・建物）」なので、MVP からこの2つが貯まる設計にする。

---

## 6. リスクと対策

| # | リスク | 根拠 | 重大度 | 対策案 |
|---|---|---|---|---|
| 1 | **最初の1人問題**（友達がいないと町が空で、看板の価値が出ない） | 看板が「友達の〜」である以上、招待できないと価値ゼロ。みんチャレは匿名マッチングでこれを回避している | 高 | ①**少人数の町**から始める（Duolingo の友達ストリークは最大5人）。「2人から町ができる」 ②招待されると、相手の町に**自分の家が建つ**演出を招待リンクのプレビューに ③友達が来るまでは、町に**住人（NPC）**がいて、自分の過去の記録で動く ④予備策としてみんチャレ型の**匿名の町**（同じ習慣の知らない人と相部屋）。G1の LP で「友達と」「匿名で」どちらが反応が良いか比べる |
| 2 | **習慣アプリの継続率が低い** | Health & Fitness の30日継続率は約7%（Adjust 2022）、他の推計で3〜8%。G5基準は15% | 高 | ①友達が動くと通知（「ハルがジムに着いた」）＝**自分のための通知ではなく友達の通知**で開かせる ②連続日数の「おやすみ」（ストリークの凍結）で、1日休んでも心が折れないようにする ③最初の習慣は1〜2個に絞る ④30日継続率はミオが G4 前から計測（PostHog は G3前に必須＝DESIGN.md） |
| 3 | **プライバシー（位置情報）** | NauNau で個人情報が閲覧可能になっていた件の報道。App Store 5.1.1／5.1.5 で同意と撤回の手段が必要。「友達の今が見える」は監視と受け取られやすい | 高 | ①**正確な位置は送らない**。端末内でジオフェンスを判定し、サーバーには「ジムでチェックイン」という**イベントだけ**を送る ②表示は「場所の種類（ジム）」のみ。地図・住所・店名は出さない ③公開は数分遅らせる・ゴーストモード ④位置での自動判定は**オプトイン**、手動記録が既定。課金機能を位置の許可に依存させない（5.1.1 の要求） |
| 4 | **iOS の Screen Time API の制約**（ドパガキ度） | Apple の開発者フォーラムでは、DeviceActivityReport の拡張機能のデータは読み取り専用のサンドボックスにあり、**アプリ本体やサーバーに出せない**と説明されている。集計したスコアを外に出してよいかは公式の回答がない（フォーラム、未解決） | 中〜高（機能の前提が崩れる） | ①**MVP には入れない** ②入れるなら、端末内の DeviceActivityMonitor のしきい値イベントで「今日はSNS 1時間以内を達成した／しなかった」という**達成イベントだけ**を共有する設計を、Apple DTS に事前に確認する ③Family Controls の利用許可（entitlement）の申請が必要かも要確認 ④Android は仕組みが別（UsageStatsManager）で、対応を分ける必要あり |
| 5 | **飲み会の回数機能（年齢・ストアの規約）** | App Store 1.4.3「過度の飲酒を勧めるアプリは不可。未成年に飲酒を勧めるアプリはリジェクト」（公式の文言）。日本は20歳未満の飲酒が禁止。年齢レーティングは2025/7に4+〜18+の5段階に変更された（報道） | 中 | ①**MVP には入れない** ②入れる場合も連続日数・ランキング・お祝いの紙吹雪の対象にしない（「たくさん飲むほど褒められる」は 1.4.3 に抵触するおそれ） ③「友達と会った回数」に含め、飲酒と書かない ④入れるなら年齢確認とレーティングの見直し。whoo のように若年層に広がった場合の衝突にも注意 |
| 6 | （追加）**3Dの重さ・電池** | DESIGN.md の実測: ドローコール558（予算100）、JS 434KB（予算300KB）。実機のfpsは未計測 | 中 | タクミ側の既知課題。キャラのインスタンス描画化で約120まで下がる見込み（DESIGN.md）。G2 前に実機で計測 |
| 7 | （追加）**「友達と習慣」の新興アプリの乱立** | 2025〜2026年に Product Hunt で多数公開 | 中 | 見た目の差は真似される。友達の関係と町の履歴という「乗り換えにくさ」を MVP から貯める |

---

## 7. スコアリング（看板の候補ごと）

5点満点。根拠は上の各節。

| 看板の候補 | 共感 | 差別化 | 収益化しやすさ | 実装容易性 | 合計 | コメント |
|---|---|---|---|---|---|---|
| **友達の“がんばり”が見える町**（推奨） | 5 | 5 | 4 | 3 | **17** | 友達の機能（同期・招待）が必要で実装は重め。収益は Finch 型の着せ替え |
| キャラと続く習慣 | 4 | 2 | 4 | 4 | 14 | 1人用でも成立し作りやすいが、Finch と区別がつかない |
| 75週チャレンジ | 2 | 2 | 3 | 4 | 11 | 市場が小さく、1秒では伝わらない |

---

## 8. 創業者の「今後やりたいこと」への所見（参考）

| 機能 | 所見 | 推奨タイミング |
|---|---|---|
| ジムの位置での自動判定 | 端末内のジオフェンスでイベントだけ送るなら実現しやすく、プライバシーも守れる | MVP の次（v1.1）。MVP は手動記録 |
| ランのGPS計測（走るとキャラも走る） | Strava・Pikmin Bloom と重なる。「キャラが走る」は動画映えする | v1.x。バックグラウンドの位置情報は 2.5.4 の用途内で |
| ドパガキ度（SNS・YouTubeの使用時間） | 共感は強いが iOS の制約が大きい（リスク4） | Apple DTS に確認してから判断 |
| 友達と会った回数（写真付き） | Locket・BeReal の「友達の写真」と近い。町に思い出が残る演出と相性が良い | v1.x |
| 飲み会の回数 | 規約リスク（リスク5） | 当面は見送り |

---

## 出典

- Finch: [Adapty Paywall Library](https://adapty.io/paywall-library/finch/) / [AppGoblin](https://appgoblin.info/apps/1528595748) / [FoxData](https://foxdata.com/en/blogs/finch-as-app-store-editors-choice-a-self-care-companion/) / [ScreensDesign](https://screensdesign.com/apps/finch-self-care-pet/)
- Habitica: [HelloLeads（集計記事）](https://www.helloleads.io/blog/?p=3909) / [AppGoblin Android](https://appgoblin.info/apps/com.habitrpg.android.habitica)
- みんチャレ: [AppBank 2025/10](https://www.appbank.net/2025/10/31/iphone-application/2856086.php) / [English Hub](https://englishhub.jp/news/minchalle-polyglots.html)
- 75 Hard: [AppGoblin iOS](https://appgoblin.info/apps/1502228408) / [AppGoblin Android](https://appgoblin.info/apps/com.media44seven.seventyfivehard) / [ScreensDesign](https://screensdesign.com/apps/75-hard/)
- whoo: [Business Insider Japan](https://www.businessinsider.jp/article/269370/) / [Web担当者Forum（ペンマーク調査）](https://webtan.impress.co.jp/n/2023/09/11/45585) / [財経新聞（博報堂の発表）](https://www.zaikei.co.jp/releases/2448593/)
- NauNau: [ScanNetSecurity](https://scan.netsecurity.ne.jp/article/img/2023/12/25/50397/43586.html) / [AirDroid](https://www.airdroid.com/ja/parent-control/what-is-naunau/)
- Opal: [RevenueCat Sub Club](https://www-docs.revenuecat.com/blog/growth/kenneth-schlenker-sub-club-podcast-2026/) / [Runtime Wire](https://runtimewire.com/article/opal-raises-10m-unveils-new-opal-attention-os-kenneth-schlenker) / [ScreensDesign](https://screensdesign.com/apps/opal-screen-time-control/)
- one sec: [RevenueCat](https://www.revenuecat.com/blog/growth/frederik-riedel-expected-12-his-app-cut-screen-time-by-57) / [AppGoblin](https://appgoblin.info/apps/1532875441) / [ScreensDesign](https://screensdesign.com/discover/apps/one-sec-screen-time-focus/)
- BeReal: [Voodoo 2025](https://voodoo.io/news/2025-a-year-of-growth-and-transformation-for-voodoo) / [Marketing Brew](https://www.marketingbrew.com/stories/2025/07/16/bereal-comeback-strategy) / [Konvoy](https://www.konvoy.vc/content/voodoo-gets-real)
- Locket: [TechCrunch 2025/8](https://techcrunch.com/2025/08/06/photo-sharing-app-locket-is-banking-on-a-new-celebrity-focused-feature-to-fuel-its-growth) / [TechCrunch 2025/11](https://techcrunch.com/2025/11/03/lockets-social-app-is-picking-up-steam-with-gen-alpha) / [AppGoblin](https://appgoblin.info/apps/1600525061)
- Pikmin Bloom: [PocketGamer.biz](https://www.pocketgamer.biz/pikmin-bloom-hits-100m-after-four-years-as-2025-becomes-its-best-year-yet)
- Strava: [Sacra](https://sacra.com/c/strava/) / [Built In](https://builtin.com/articles/strava-achieves-2b-valuation-20250523)
- Pokémon Sleep: [Sensor Tower（1周年）](https://sensortower.com/ja/blog/pokemon-sleep-1st-anniversary) / [Outlook Respawn](https://respawn.outlookindia.com/gaming/gaming-news/pok%C3%A9mon-sleep-hits-2349m-revenue-on-3rd-anniversary)
- Forest: [AppGoblin](https://appgoblin.info/apps/cc.forestapp)
- Duolingo: [Duolingo Blog: Friend Streak](https://blog.duolingo.com/friend-streak/)
- Zenly: [The Pragmatic Engineer](https://blog.pragmaticengineer.com/zenly/) / [Life360](https://www.life360.com/?p=209231)
- 新興の「友達と習慣」アプリ: [Product Hunt: HabitForge](https://www.producthunt.com/products/habitforge/launches) / [Product Hunt: HabitFriend](https://www.producthunt.com/products/habitfriend-social-habit-tracker-app)
- 継続率: [Adjust: What makes a good retention rate](https://www.adjust.com/blog/what-makes-a-good-retention-rate/) / [Business of Apps](https://businessofapps.com/data/health-fitness-app-benchmarks) / [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- Screen Time API: [Apple Developer Forums 817516](https://developer.apple.com/forums/thread/817516) / [727958](https://developer.apple.com/forums/thread/727958) / [848997](https://developer.apple.com/forums/thread/848997)
- App Store の規約: [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)（1.4.3／2.5.4／5.1.1／5.1.5） / [年齢レーティングの変更（iClarified）](https://www.iclarified.com/60892/apple-updates-its-app-store-review-guidelines-heres-all-the-changes)
