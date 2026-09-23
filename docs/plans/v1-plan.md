# WP Translation Checker v1 implementation plan

## References

- Requirements: [docs/requirements/v1-requirements.md](../requirements/v1-requirements.md)
- Design: [docs/design/v1-design.md](../design/v1-design.md)
- Architecture: [docs/architecture/v1-architecture.md](../architecture/v1-architecture.md)

## Goal

完成済みの v1 Requirements、Design、Architecture を、現在の Vite / React / TypeScript の初期実装から、レビュー可能な段階に分けて実装する。

最終的には、利用者がブラウザー上でローカルの `.po` ファイルを選択し、日本語向け v1 ルールによる確認結果または確認不能理由を理解できる状態まで到達する。

この Plan は Architecture が定義した責務、境界、状態所有、契約、不変条件を変更せず、実装順序、具体的な実装単位、検証方法、Issue 分割を定める。

## Scope

### Included

- 現在の Vite starter UI を WTC v1 の Presentation へ置き換える。
- Validation Core の責務を、Architecture の境界に沿って React / DOM から独立した TypeScript モジュールとして実装する。
- PO Interpretation、Locale Resolution、Locale Rule Selection、Rule Evaluation、Finding Coordination、Check Orchestration を実装する。
- v1 Requirements で対象とした日本語ルールを実装する。
- 最終 Finding が問題箇所、Severity、説明、理由、スタイルガイド参照を Presentation へ渡せるデータ契約を実装する。
- 正常完了、解析不能、ロケール判定不能、未対応ロケールを意味として区別する。
- 確認中に入力が差し替えられた場合、古い結果を現在入力へ適用しない Presentation lifecycle を実装する。
- Design で定義した結果概要、Finding 表示、長文展開、重要なフィードバックへの focus を実装する。
- Validation Core と重要な Presentation lifecycle を検証できる Vitest ベースのテスト基盤を導入する。
- 実装に伴って `docs/development/testing.md` を実際の検証コマンドへ更新する。

### Not included

- `.po` ファイルの編集、自動修正、修正版ファイル生成。
- 確認結果の export。
- translate.wordpress.org または GlotPress との直接統合。
- 日本語以外のロケールルール。WTC 全体は将来の locale 追加を許容するが、v1 実装では追加しない。
- 利用者によるロケール選択または上書き。
- AI による翻訳品質評価。
- 将来ロケール向けの plugin system、DI container、動的ロード、永続化、queue。
- v1 のために必要性が確立していない状態管理ライブラリや汎用基盤の導入。

## Current implementation and implementation gap

現在の `src/App.tsx`、`src/App.css`、`src/index.css` は Vite starter の内容であり、Architecture で定義された Validation Core と WTC Presentation はまだ実装されていない。

現在の `package.json` に test runner はなく、検証コマンドは formatting、lint、build が中心である。そのため、ルール判定や Finding Coordination のような決定論的なドメインロジックを実装する前に、テスト基盤を追加する。

実装では既存 starter 構造を温存するための互換層は作らず、必要な責務を直接導入し、不要になった starter asset と UI を段階的に削除する。

## Approach

### Validation Core module direction

Validation Core は `src/validation/` 配下に置き、Architecture の責務ごとに変更理由を分離する。

想定する主な実装単位は以下とする。具体的なファイル分割は各 Issue で、責務が明確な最小構成に調整してよい。

- `src/validation/po/`
  - PO Interpretation。
  - parser 固有の型や表現を後続責務へ漏らさず、翻訳エントリとメタデータへ正規化する。
- `src/validation/locale/`
  - Locale Resolution。
  - Locale Rule Selection。
- `src/validation/rules/`
  - Rule contract、Rule-specific detection、Problem location の実装表現。
  - 複数ルールで必要な技術的文字列、placeholder、文字範囲、文字間境界の共有概念。
- `src/validation/rules/ja/`
  - v1 日本語ルールとその rule set。
  - 日本語固有の項目番号、Severity、説明、理由、スタイルガイド参照はこのロケール境界内に置く。
- `src/validation/findings/`
  - Finding model。
  - 重複抑制、具体的ルール優先、同一ルール内の複数箇所集約、決定論的順序。
- `src/validation/check/`
  - Check Orchestration。
  - Presentation から利用する Validation Core の入口。

境界を横断する型は、所有責務が分かる場所に定義する。単に複数箇所から使われるという理由だけで `utils/` や汎用 `shared/` を作らない。

### Check result representation

Check Orchestration の公開結果は discriminated union とし、少なくとも次の意味を型で区別できるようにする。

- 正常完了。Finding 配列が空でも正常完了であることが分かる。
- PO 解析不能。
- ロケール判定不能。
- 未対応ロケール。

成功結果内の Finding 件数によって「指摘あり / 指摘なし」を表現できるが、確認不能状態を空の Finding 配列で表現しない。

### Input-result identity

Presentation はファイル選択が変わるたびに単調増加する selection version を持つ。

確認開始時に version を capture し、非同期処理完了時に現在 version と一致する場合だけ結果を採用する。これにより、旧入力の処理を queue や cancel token で管理せず、Architecture の input-result identity を満たす。

別ファイルの選択自体では focus を移動せず、採用された確認結果または確認不能状態が確定したときだけ Design に従って focus を移動する。

### Test direction

Validation Core は React / DOM なしでテストできる構造とし、Vitest を test runner として導入する。

Presentation で lifecycle を自動検証する必要がある箇所だけ React 向けの DOM test utilities を追加する。特に以下を対象とする。

- 入力差し替え後に古い結果が採用されない。
- 正常完了時に結果概要へ到達できる。
- 確認不能時に重要なフィードバックへ到達できる。
- ファイル選択だけでは予期しない focus 移動が起きない。

実装詳細をテストするための production export は追加しない。

## Implementation phases

### Phase 1: Validation contracts and test foundation

- Outcome:
  - Validation Core を段階的に実装できる最小の module boundary と test runner がある。
  - Check Result、Finding、Problem Location、Rule-specific detection など、Architecture の責務間で必要な実装上の型表現を定義できる。
- Tasks:
  - Vitest を導入し、非対話の test script を追加する。
  - 必要になった時点でのみ React DOM test utilities を追加する。
  - Architecture の責務に対応した `src/validation/` の最小構成を作る。
  - Check Result を discriminated union として定義する。
  - Problem Location が原文側 / 翻訳側、文字範囲 / 文字間境界を表現できる型にする。
  - `docs/development/testing.md` を新しい test command に合わせて更新する。
- Validation:
  - 型の unit test または contract を利用する最小テストが Vitest で実行できる。
  - format、lint、test、build が同じ構成で実行可能である。

### Phase 2: PO Interpretation

- Outcome:
  - ローカル PO 内容を Validation Core が利用する翻訳エントリとメタデータへ変換でき、不正 PO を成功扱いしない。
- Tasks:
  - ブラウザー bundle で利用可能な PO parser を選定する。
  - parser の戻り値を責務内で正規化し、parser 固有型を後続へ公開しない。
  - 原文、翻訳、plural 等、v1 のルール評価に必要な情報を保持する翻訳エントリを作る。
  - locale 判定に必要な PO header metadata を保持する。
  - malformed input を解析不能として返す。
- Validation:
  - 正常な日本語 PO、複数 entry、plural を含む PO、不正 PO の fixture で contract を確認する。
  - 入力文字列が変更されないことを確認する。

### Phase 3: Locale Resolution and Locale Rule Selection

- Outcome:
  - PO metadata から locale を解決し、判定不能と未対応を区別できる。
  - `ja` の場合だけ日本語 rule set を選択できる。
- Tasks:
  - Locale Resolution を実装し、accepted Design と PO metadata に基づく locale 正規化を行う。
  - Locale Rule Selection を実装し、`ja` rule set と unsupported locale を区別する。
  - 日本語 rule set の登録点を `src/validation/rules/ja/` 内に置く。
  - Check Orchestration や Presentation に日本語固有条件を埋め込まない。
- Validation:
  - `ja`、判定不能、判定可能だが未対応の locale を独立してテストする。
  - 未対応 locale に `ja` rule set が返らないことを確認する。

### Phase 4: Shared rule concepts

- Outcome:
  - 複数の日本語ルールが同じ意味で利用する技術的文字列、placeholder、問題箇所表現を一貫して扱える。
- Tasks:
  - URL、メールアドレス、ファイルパス、コード、識別子など、Design 上で誤検出抑制に必要な共通概念を実装する。
  - 数値 placeholder と文字列 placeholder を区別する。
  - 文字範囲と文字間境界を Rule-specific detection へ渡せるようにする。
  - 共通概念は補助的な contract に留め、日本語固有の判定条件を共通化しすぎない。
- Validation:
  - 共通概念ごとに代表例と境界例を table-driven test で確認する。
  - ルール固有条件が共通処理へ吸収されていないことを review する。

### Phase 5: Japanese v1 rules

- Outcome:
  - Requirements の v1 scope にある全12ルールが、Design の判定仕様、例外、Severity、利用者向け説明、スタイルガイド根拠に従って Rule-specific detection を生成する。
- Tasks:
  - 句読点・全角半角系: 1-1、1-2。
  - スペース・括弧系: 1-4、1-5、1-6、1-7、1-8、1-9。
  - 原文パターンを伴う Warning: 3-2、3-3、3-4。
  - 推奨表記: 3-6。
  - 各ルールの metadata と評価を `src/validation/rules/ja/` に閉じ込める。
  - 1翻訳内の複数一致を Rule-specific detection として保持し、最終集約は Finding Coordination に委ねる。
- Validation:
  - 各ルールについて Design にある正常例、NG例、例外を test case 化する。
  - Error / Warning、説明、理由、style guide item、problem location が期待どおりであることを確認する。
  - 誤検出しやすい技術的文字列と placeholder の境界例を確認する。

### Phase 6: Finding Coordination

- Outcome:
  - Rule-specific detection を Presentation がそのまま表示できる最終 Finding へ決定論的に変換できる。
- Tasks:
  - 同じ文字位置・同じ原因の重複を抑制する。
  - より具体的なルールを優先する。
  - 同じ翻訳内の同一ルールによる複数箇所を1 Finding に集約する。
  - 別原因または別ルールは独立した Finding として保持する。
  - source entry order、rule set order、problem location を用いる明示的で安定した ordering rule を実装し、テストで固定する。
- Validation:
  - 重複、優先、複数箇所集約、独立保持を個別にテストする。
  - 同じ detection 集合を繰り返し処理して同じ Finding 集合と順序になることを確認する。

### Phase 7: Check Orchestration

- Outcome:
  - Presentation が1つの入口へ確認対象を渡し、Architecture が定義した確認全体の結果を受け取れる。
- Tasks:
  - PO Interpretation → Locale Resolution → Locale Rule Selection → Rule Evaluation → Finding Coordination の順序を接続する。
  - 解析不能時は locale 以降を実行しない。
  - locale 判定不能時は rule selection 以降を実行しない。
  - 未対応 locale 時は rule evaluation を実行しない。
  - 正常完了では Finding が0件でも success を返す。
  - 日本語固有 metadata や Presentation 処理を orchestration に持ち込まない。
- Validation:
  - Architecture の Runtime View にある success with findings、success without findings、invalid PO、unresolved locale、unsupported locale を統合テストする。

### Phase 8: Presentation and browser input

- Outcome:
  - Vite starter UI が WTC v1 の利用フローへ置き換わり、利用者がファイル選択、確認、結果理解まで行える。
- Tasks:
  - `src/App.tsx` を薄い application entry とし、意味のある UI 責務を Presentation component へ分ける。
  - file input、確認開始、checking state、result state を実装する。
  - selection version により旧入力の結果を現在入力へ採用しない。
  - 結果概要、Error / Warning 件数、問題なし表示を実装する。
  - Finding ごとに問題概要、Severity、原文、翻訳、問題箇所、理由、style guide item と link を表示する。
  - 問題箇所は Validation Core の location data を使って表示し、UI 側で再解析しない。
  - 長文の省略と全文表示を実装する。
  - Design の wide / narrow 配置を実装する。
  - accepted result の確定時だけ、正常完了は結果概要、確認不能は重要なフィードバックへ focus を移す。
  - starter asset、starter UI、不要な CSS を削除する。
- Validation:
  - valid PO with findings、valid PO without findings、invalid PO、unresolved locale、unsupported locale をブラウザーで確認する。
  - 確認中に別ファイルを選択し、旧結果が表示されないことを自動テストする。
  - keyboard だけで file selection、確認、結果確認、全文展開、style guide link まで操作できることを手動確認する。
  - focus 移動が Design と一致することを確認する。

### Phase 9: v1 integration and release-readiness validation

- Outcome:
  - Requirements、Design、Architecture の v1 scope が統合された状態で再現可能に確認できる。
- Tasks:
  - 12ルールを含む representative PO fixtures を使って end-to-end の Validation Core 結果を確認する。
  - 同一入力の繰り返し確認で Finding 集合と順序が同一であることを確認する。
  - privacy boundary を review し、翻訳内容を外部送信する処理がないことを確認する。
  - UI と mock の差分を確認し、mock 固有装飾ではなく Design 上必要な挙動が満たされているかを確認する。
  - Requirements の FR-01〜FR-10、QR-01〜QR-03 を実装・テストへ trace する。
- Validation:
  - repository-wide の format、lint、test、build を実行する。
  - `git diff --check origin/main...HEAD` を実行する。
  - v1 の主要操作を desktop / narrow viewport で手動確認する。

## Decisions and validation questions

### Decide before implementation

- Test runner は Vitest とする。Vite / TypeScript と同じ toolchain 上で Validation Core を高速に検証できるようにする。
- Check Result は discriminated union とし、正常完了と3種類の確認不能状態を型で区別する。
- Input-result identity は Presentation の selection version で実現し、v1 では queue、cancel token、外部 state manager を導入しない。
- 日本語ルールは locale rule set 配下へ直接配置し、将来向け plugin system や DI container は作らない。
- Finding の安定順序は Finding Coordination 内で明示的な comparator として実装し、test で固定する。

### Validate during implementation

- PO parser dependency は Phase 2 で候補を確認し、ブラウザー bundle で動作すること、必要な PO metadata / plural entry を取得できること、不正入力を識別できること、parser 固有型を境界内へ閉じ込められることを evidence として選定する。
- 技術的文字列と placeholder の共有処理は、複数ルールで実際に同じ意味の処理が必要になった範囲だけ共通化する。ルール実装が進む前に先回りして一般化しない。
- Presentation の component 分割は、file input、result summary、finding display、focus lifecycle など明確な UI 責務が現れた単位で行い、単なる行数削減のためには分割しない。

## Issue breakdown

Plan review 後、以下の順で child Issue を作成する。各 Issue はこの Plan と上位ドキュメントを参照し、全体仕様を本文へ複製しない。

- [ ] Test foundation and Validation Core contracts
- [ ] PO Interpretation
- [ ] Locale Resolution and Locale Rule Selection
- [ ] Shared rule concepts for technical strings, placeholders, and locations
- [ ] Japanese rules 1-1 and 1-2
- [ ] Japanese rules 1-4, 1-5, 1-6, 1-7, 1-8, and 1-9
- [ ] Japanese Warning rules 3-2, 3-3, and 3-4
- [ ] Japanese recommended-expression rule 3-6
- [ ] Finding Coordination
- [ ] Check Orchestration
- [ ] Presentation and browser file input
- [ ] v1 integration and release-readiness validation

Implementation dependency is primarily top-to-bottom. Japanese rule Issues may be implemented independently after Shared rule concepts and the rule contract are stable, but Finding Coordination and Check Orchestration should consume the stabilized rule output contract rather than duplicate temporary adapters.

## Validation

実装完了時の repository-wide validation は `docs/development/testing.md` を source of truth とする。Phase 1 で test runner を追加した時点で同文書を更新する。

最低限、最終状態では以下を実行する。

- `npm run format:check`
  - repository formatting が通る。
- `npm run lint`
  - ESLint error がない。
- `npm run test`
  - Validation Core と対象 Presentation lifecycle の test が通る。
- `npm run build`
  - TypeScript build と Vite production build が通る。
- `git diff --check origin/main...HEAD`
  - whitespace error がない。
- Manual browser validation
  - 正常完了、指摘なし、解析不能、ロケール判定不能、未対応ロケール、入力差し替え、responsive layout、keyboard / focus を確認できる。

## Completion criteria

- Architecture の7責務が、現在の repository 内で明確な実装責務として存在する。
- Validation Core が React / DOM に依存しない。
- v1 Requirements の12ルールが Design の判定仕様と例外を含む test 付きで実装されている。
- `ja` 以外へ日本語ルールを適用しない。
- 正常完了と解析不能、ロケール判定不能、未対応ロケールを意味として区別できる。
- Finding が Presentation の再解析なしに必要な表示情報を提供する。
- Finding Coordination が重複、優先、集約、安定順序を一元的に処理する。
- 入力変更後に旧入力の結果が現在入力へ適用されない。
- Design で定義した結果概要、Finding 表示、長文表示、focus behavior が実装されている。
- 同じ入力と同じ rule conditions から同じ Finding 集合と順序が得られる。
- 翻訳内容を validation のために外部サービスへ送信しない。
- repository-wide validation と v1 manual checks が完了している。
