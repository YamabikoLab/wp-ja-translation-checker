# WP Japanese Translation Checker v1 アーキテクチャ設計書

## Context and Scope

本書は、`docs/requirements/v1-requirements.md` と `docs/design/v1-design.md` で確定した WJTC v1 を実現するための、内部責務、境界、所有、契約、依存方向を定義する。

対象は、利用者がローカルの `.po` ファイルを選択し、対象ロケールに対応する翻訳スタイルルールで確認し、結果を理解できるところまでとする。

本書では、実装ファイル、React component、具体的な TypeScript 型、PO parser、正規表現、DOM 手順、状態管理ライブラリは定義しない。

v1 では日本語（`ja`）のみを確認対象とするが、ロケール固有のルールが検証フロー本体や Presentation に混在しない境界を持つ。

## System Boundary

WJTC v1 の確認処理はブラウザー内で完結する。

システム境界の外側にあるものは以下とする。

- 利用者が選択するローカルの `.po` ファイル
- ブラウザーが提供するファイル読み取り能力
- 利用者が任意に参照する WordPress 日本語翻訳スタイルガイド

WJTC の内部にあるものは以下とする。

- Check Orchestration
- PO Interpretation
- Locale Resolution
- Locale Rule Selection
- Rule Evaluation
- Finding Coordination
- Result Presentation Boundary
- Presentation

WordPress 日本語翻訳スタイルガイドへのリンクは一次情報への導線であり、確認処理を成立させるための外部依存ではない。

確認対象の翻訳内容は、確認のために外部 API、外部サービス、telemetry へ送信しない。

## Solution Strategy

確認処理を、入力解釈、ロケール判断、ロケール固有ルール、結果整形、表示へ分離する。

概念上の流れは以下とする。

```text
Selected PO file
  ↓
Check Orchestration
  ↓
PO Interpretation
  ↓
Locale Resolution
  ↓
Locale Rule Selection
  ↓
Rule Evaluation
  ↓
Finding Coordination
  ↓
Check Result
  ↓
Result Presentation Boundary
  ↓
Presentation
```

検証コアは React / DOM に依存しない。Presentation は検証結果を表示するが、ルール判定、Severity 決定、重複解決、問題箇所の推測を行わない。

## Responsibilities and Boundaries

### Check Orchestration

**Purpose**

1回の確認要求について、入力から最終結果までの処理順序を調整する。

**Owns**

- 確認開始時点の入力を、その確認の対象として扱うこと
- 各責務を正しい順序で利用すること
- 継続不能な結果を受けた場合に後続処理を開始しないこと
- 最終的な確認結果を Presentation 側へ渡すこと

**Does not own**

- PO 構文の解釈
- ロケールの判定
- ロケールの対応可否
- 個別ルールの判定
- Finding の競合解決
- 画面表示

1回の確認は、確認開始時点の入力を対象として完結する。確認開始後に別のファイルが選択された場合、以前の確認結果を新しい入力の結果として採用してはならない。

この不変条件を満たす具体的方法は固定しない。

### PO Interpretation

**Purpose**

選択されたファイルを、検証可能な翻訳エントリとメタデータへ解釈する。

**Owns**

- 入力を PO として解釈できるかの判断
- 原文、翻訳、PO メタデータなど、後続責務が利用する意味情報の提供
- 解析不能を成功した空結果と区別して返すこと

**Does not own**

- 対象ロケールの決定
- 翻訳スタイルルールの判定
- 利用者向けエラーメッセージの表示

PO Interpretation が解析不能を返した場合、ロケール判定やルール評価は開始しない。

### Locale Resolution

**Purpose**

PO Interpretation が提供したメタデータから、確認対象の翻訳ロケールを判定する。

**Owns**

- ロケールを判定できたかどうか
- 判定できた場合のロケール

**Does not own**

- そのロケールを WJTC がサポートしているかの判断
- ロケール固有ルールの内容

「ロケールを判定できない」と「ロケールは判定できたが未対応」は別の結果として扱う。

### Locale Rule Selection

**Purpose**

判定されたロケールに対応するルール集合を選択する。

**Owns**

- 対象ロケールに対応するルール集合の有無
- 対応する場合、そのロケール固有ルール集合を Rule Evaluation へ提供すること
- ルール間の優先関係など、そのロケール固有ルール集合に属する調整情報

**Does not own**

- ロケール自体の判定
- 個別ルールの判定結果
- Finding の表示

v1 では `ja` のみが対応対象である。未対応ロケールへ日本語ルールを代替適用してはならない。

検証フロー本体は、日本語固有の項目番号、文言、ルール間優先関係を直接知らない。

### Rule Evaluation

**Purpose**

選択されたロケール固有ルールを翻訳エントリへ適用し、ルール固有の検出結果を生成する。

**Owns**

- 各ルールの判定条件
- 基本設計で定義された Severity
- 問題概要と判定理由
- スタイルガイド上の根拠
- 検出した問題箇所

**Does not own**

- 他ルールの内部判定
- 複数ルール間の競合解決
- 最終的な表示順序
- React / DOM 表示

各ルールは他ルールの実装詳細へ依存しない。

### Shared Validation Semantics

複数ルールで同じ意味解釈が必要な場合、その解釈を矛盾なく共有できる境界を持つ。

対象になり得る意味は以下とする。

- URL、メールアドレス、ファイルパス、コードなど、技術的文字列として扱う範囲
- 数値プレースホルダーと文字列プレースホルダーの区別
- 問題箇所を既存文字の範囲として扱うか、文字間境界として扱うか

この責務は、将来用途のための一般 tokenizer や解析基盤を意味しない。現在のルール間で実際に共有が必要な意味だけを扱う。

ロケール固有のスタイル判断そのものは Locale Rule Selection / Rule Evaluation 側に残し、共有処理へ日本語固有ルールを押し出さない。

### Finding Coordination

**Purpose**

ルール固有の検出結果を、利用者へ提示可能な一貫した Finding 集合へ整える。

**Owns**

- 同一原因の重複指摘抑制
- ロケール側から与えられた優先関係の適用
- 同じ翻訳内で同じルールに複数の該当箇所がある場合の1 Findingへの集約
- 別原因または別ルールの Finding を分離して保持すること
- 決定論的な Finding 集合と順序

**Does not own**

- 日本語固有の優先関係そのもの
- 個別ルールの判定条件
- UI 表示

Finding Coordination は、ロケール固有のルール番号や意味をハードコードせず、Locale Rule Selection が提供する調整情報を一般的に適用する。

### Result Presentation Boundary

**Purpose**

Presentation がルールロジックを再構築せず、利用者向け設計を実現できる意味情報を渡す。

各 Finding は少なくとも以下の意味情報を持てる。

- Severity
- 問題概要
- 原文
- 翻訳
- 1つ以上の問題箇所
- 各問題箇所が原文側 / 翻訳側のどちらに属するか
- 既存文字の範囲、または不足スペースなどの文字間境界
- 判定理由
- スタイルガイド項目
- 一次情報への参照情報
- 必要に応じた補助的な対象特定情報

1つの Finding は、原文側と翻訳側の両方に問題箇所を持てる。

Presentation は原文・翻訳を再解析して問題箇所を推測しない。強調表示に必要な意味は、この境界までに確定している。

### Presentation

**Purpose**

確認要求を受け付け、利用者向け状態と確認結果を表示する。

**Owns**

- ファイル未選択、ファイル選択済み、確認中、完了などの利用者向け interaction state
- 確認結果に応じた画面表示
- Error / Warning の視覚的・文字的な区別
- 基本設計で定義されたフォーカス遷移
- 長文の展開・折りたたみなど表示上の interaction

**Does not own**

- PO の意味解釈
- ロケール判定
- ルール判定
- Severity の決定
- Finding の競合解決
- 問題箇所の再判定

## Conceptual Contracts

### Parsed Translation Data

PO Interpretation から後続責務へ渡す概念データは、少なくとも次を表現できる。

- 翻訳エントリ
- 原文
- 翻訳
- ロケール判定に必要なメタデータ
- 対象箇所の特定に利用できる補助情報が存在する場合、その情報

確認処理は入力翻訳を変更しない。

### Locale Resolution Result

ロケール判定結果は、少なくとも以下を区別する。

- 判定成功
- 判定不能

判定成功時のロケールがサポート対象かどうかは Locale Rule Selection が判断する。

### Rule Selection Result

ルール選択結果は、少なくとも以下を区別する。

- 対応ルール集合あり
- 未対応ロケール

未対応ロケールは空のルール集合による正常確認として扱わない。

### Check Result

確認全体の結果は、少なくとも以下を意味的に区別する。

- 入力を正常に解析できない
- ロケールを判定できない
- ロケールは判定できたが未対応
- 正常に確認でき、Finding がある
- 正常に確認でき、Finding がない

確認不能を空の Finding 集合だけで表現しない。

## Invariants

- 確認対象の翻訳内容は、確認のために外部サービスへ送信しない。
- 確認処理は入力された翻訳内容を変更しない。
- 1回の確認結果は、その確認開始時点の入力に対応する。
- 入力変更後に完了した古い確認結果を、新しい入力の結果として採用しない。
- 未対応ロケールへ別ロケールのルールを代替適用しない。
- 検証フロー本体と Presentation は日本語固有ルールの判定内容を再実装しない。
- Presentation は問題箇所を再解析して推測しない。
- 同じ入力と同じルール条件では、同じ Finding 集合、Severity、説明、根拠、順序を得る。
- 同一原因の重複指摘は、ロケール固有の優先関係に従って一貫して解決する。

## Runtime Flow

### Successful check

1. Presentation が、現在選択されている入力について確認を開始する。
2. Check Orchestration が、その確認開始時点の入力を確認対象として扱う。
3. PO Interpretation が入力を翻訳エントリとメタデータへ解釈する。
4. Locale Resolution が対象ロケールを判定する。
5. Locale Rule Selection が対象ロケールのルール集合を選択する。
6. Rule Evaluation が各翻訳エントリへ対象ルールを適用する。
7. Finding Coordination が検出結果を集約し、重複と優先関係を解決し、決定論的な Finding 集合へ整える。
8. Check Orchestration が正常な Check Result として Presentation 側へ渡す。
9. Presentation が結果概要と Finding、または問題なしの完了状態を表示する。

### Invalid PO input

1. PO Interpretation が入力を確認可能な PO として解釈できないことを返す。
2. Check Orchestration は Locale Resolution 以降を開始しない。
3. Presentation は正常結果とは別の確認不能状態として表示する。

### Locale cannot be resolved

1. PO Interpretation は成功する。
2. Locale Resolution がロケール判定不能を返す。
3. Check Orchestration は Locale Rule Selection 以降を開始しない。
4. Presentation は未対応ロケールや問題なしとは別の状態として表示する。

### Unsupported locale

1. Locale Resolution はロケールを判定する。
2. Locale Rule Selection が、そのロケールに対応するルール集合がないことを返す。
3. Rule Evaluation は開始しない。
4. Presentation は判定されたロケールが未対応であることを表示する。
5. 日本語ルールは代替適用しない。

### Input changes while an earlier check is in progress

1. ある入力について確認が開始される。
2. その確認が完了する前に、利用者が別のファイルを選択する。
3. 新しいファイルが現在の入力となる。
4. 以前の確認が後から完了しても、その結果を現在の入力の結果として採用しない。
5. 具体的な識別、取消、無視の方式は実装に委ねる。

## Dependency Direction

構造上の依存方向は、以下を基本とする。

```text
Presentation
  ↓
Check Orchestration
  ↓
PO Interpretation
  ↓
Locale Resolution
  ↓
Locale Rule Selection
  ↓
Rule Evaluation
  ↓
Finding Coordination
```

Result Presentation Boundary は、検証側で確定した意味情報を Presentation へ返す境界である。

依存方向について以下を禁止する。

- Rule Evaluation から React / DOM への依存
- Finding Coordination から Presentation への依存
- Presentation から個別ルール内部への依存
- 検証フロー本体から日本語固有ルール実装への直接依存
- あるロケールのルールから別ロケールのルールへの暗黙依存

## Architecture Decisions

### AD-1: Translation validation stays in the browser

**Context**

QR-01 では、確認対象の翻訳内容を明示された要件なしに外部サービスへ送信しないことが求められる。

**Decision**

PO の読み取り、解析、ロケール判定、ルール評価、結果生成をブラウザー内で完結させる。

**Rationale**

翻訳内容の privacy を守り、v1 の確認処理を外部サービスの可用性や API に依存させないため。

**Consequences**

スタイルガイドへのリンクは利用者が参照する外部導線として扱えるが、確認実行そのものの依存にはしない。

### AD-2: Validation core is independent from React and DOM

**Context**

検証ルールは UI 表示とは異なる責務であり、基本設計の変更と判定ロジックの変更を不要に結合させるべきではない。

**Decision**

PO Interpretation から Finding Coordination までの検証責務は React / DOM を知らない。

**Rationale**

ルール判定と表示を分離し、UI がルールロジックを再実装することを防ぐため。

**Consequences**

フォーカス、長文展開、レイアウトなどは Presentation 側に残る。

### AD-3: Locale resolution and locale rule selection are separate

**Context**

ロケールを判定できない状態と、ロケールは判定できるが未対応の状態は、利用者向けにも異なる。

**Decision**

Locale Resolution はロケール判定だけを所有し、対応可否は Locale Rule Selection が所有する。

**Rationale**

判定不能と未対応を内部でも混同せず、別ロケールのルール誤適用を防ぐため。

**Consequences**

v1 では `ja` だけを選択できるが、他ロケール追加時も同じ境界を保てる。

### AD-4: Locale-specific rules stay inside the locale boundary

**Context**

v1 は日本語だけを扱うが、FR-09 は異なるロケールのルールを混在させないことを要求する。

**Decision**

日本語固有の判定、メッセージ、スタイルガイド根拠、ルール間優先関係はロケール側に閉じ込める。

**Rationale**

将来のロケール追加時に、既存の日本語条件分岐を検証フロー本体へ積み重ねないため。

**Consequences**

将来用途だけの plugin system、DI container、dynamic loading は導入しない。

### AD-5: Unsuccessful checks are distinct from an empty successful result

**Context**

「確認できなかった」と「正常に確認して Finding がなかった」は利用者にとって意味が異なる。

**Decision**

解析不能、ロケール判定不能、未対応ロケール、正常完了を別の Check Result として表現する。

**Rationale**

Presentation が空配列の意味を推測せず、基本設計どおりの状態を表示できるようにするため。

### AD-6: Findings carry presentation-ready meaning, not presentation behavior

**Context**

基本設計では、問題概要、理由、根拠、複数の問題箇所、文字間境界を表示する必要がある。

**Decision**

Finding は表示に必要な意味情報を保持するが、React component、DOM、CSS の情報は持たない。

**Rationale**

Presentation が文字列を再解析せずに表示でき、同時に検証コアを UI 技術から独立させるため。

### AD-7: Finding coordination is deterministic

**Context**

QR-02 は同じ入力と同じルール条件に対する同じ結果を要求する。

**Decision**

Finding の集約、競合解決、順序は、実行時刻、過去の確認、非決定的な評価順序に依存させない。

**Rationale**

同じ入力を再確認したときに、利用者から見える結果を安定させるため。

### AD-8: Validation never mutates the input

**Context**

v1 は確認結果の提示までを責務とし、翻訳編集や修正版生成は対象外である。

**Decision**

PO Interpretation 以降の確認処理は入力翻訳を読み取り専用の検証対象として扱う。

**Rationale**

確認と編集の責務を混在させず、v1 のスコープを保つため。

### AD-9: A check result belongs to the input that started the check

**Context**

ファイル読み取りを含む処理は非同期になり得て、確認中に別ファイルが選択される可能性がある。

**Decision**

1回の確認結果は、その確認開始時点の入力にだけ対応する。現在の入力が変わった後に完了した古い結果を、新しい入力へ適用しない。

**Rationale**

過去の結果を現在の入力の結果と誤認させないため。

**Consequences**

具体的な request ID、queue、cancel token などはアーキテクチャでは固定しない。

## Quality Considerations

### Privacy

翻訳内容の解析と判定はブラウザー内で完結し、検証のための外部 API、remote processing、telemetry を前提にしない。

### Determinism

同じ入力と同じルール条件では、Finding 集合、Severity、説明、スタイルガイド根拠、表示順序が同じになる責務境界を保つ。

### Comprehensibility

Presentation がルール番号だけを受け取って意味を再構築するのではなく、問題概要、判定理由、問題箇所、根拠を結果境界から受け取れるようにする。

### Security

選択されたファイルとその内容は untrusted input として扱う。

解析責務は入力を信頼せず、Presentation は検証結果に含まれる原文・翻訳・補助情報を、その表示文脈に適した安全な方法で扱う。

## Scope Boundaries

本アーキテクチャには以下を含めない。

- `.po` ファイルの編集や自動修正
- 修正版 `.po` ファイル生成
- 確認結果のエクスポート
- translate.wordpress.org / GlotPress との直接統合
- 利用者によるロケール選択
- 日本語以外の実ルール
- AI による翻訳品質評価
- 将来用途だけの service、adapter、DI、plugin system、永続化
- 具体的な source file / directory 構成
- React component 構成
- TypeScript の具体的な型定義
- PO parser ライブラリ
- 正規表現や文字走査などの判定アルゴリズム
- test implementation

DSL や生成図は本書の成立条件としない。
