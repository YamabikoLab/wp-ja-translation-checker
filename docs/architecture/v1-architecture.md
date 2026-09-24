# WP Translation Checker v1 Architecture

## 1. Introduction and Goals

本書は、WP Translation Checker（WTC）v1 の基本設計を実現するための内部責務、境界、契約、依存方向、不変条件を定義する。

v1 の主なアーキテクチャ目標は以下とする。

- 利用者が選択した `.po` ファイルをブラウザー内で解釈し、日本語向け v1 ルールで確認する。
- PO 解釈、ロケール判定、ロケール別ルール選択、個別ルール評価、指摘調整、Presentation を分離する。
- 日本語固有ルールを確認フロー本体および UI から隔離する。
- 正常完了と確認不能を異なる結果として扱う。
- UI が文字列を再解析せずに問題箇所、理由、Severity、スタイルガイド根拠を表示できる結果契約を持つ。
- 同じ入力と同じルール条件から、同じ指摘集合と順序を得る。
- 確認開始時の入力と結果の対応関係を維持し、入力変更後に古い結果を現在の入力へ適用しない。

本書は source file、React component、具体的な TypeScript 型、parser ライブラリ、正規表現や tokenizer などの実装詳細を定義しない。

## 2. Architecture Constraints

- WTC 全体は特定ロケールに限定しない。v1 の確認対象ロケールは日本語（`ja`）のみとする。
- 検証処理はブラウザー内で完結し、確認対象の翻訳内容を検証のために外部サービスへ送信しない。
- 入力 `.po` の内容を確認処理で変更しない。
- 検証コアは React、DOM、focus API に依存しない。
- Presentation はルール判定、Severity 決定、重複解消、問題箇所推測を再実装しない。
- 正常に確認できなかった状態を空の指摘集合だけで表現しない。
- 日本語固有のルール、項目番号、文言を Check Orchestration や Presentation に埋め込まない。
- 未対応ロケールへ日本語ルールを代替適用しない。
- 将来用途だけの DI container、plugin system、動的ロード、永続化、queue を導入する前提にしない。
- 入力は untrusted input として扱い、Presentation は最終表示文脈に適した安全な出力を行う。

## 3. Context and Scope

WTC v1 は、利用者がローカルで選択した `.po` ファイルを、ブラウザーが提供する能力を用いて読み取り、内部で確認し、React UI へ結果を返す。

WordPress 日本語翻訳スタイルガイドは指摘根拠を利用者が確認するための一次情報であり、確認実行時に取得・解析する依存先ではない。

### External Context

| ID                          | Name                                       | Type                | Summary                                                                  |
| --------------------------- | ------------------------------------------ | ------------------- | ------------------------------------------------------------------------ |
| EXT_USER_PO_FILE            | Local PO File                              | External System     | 利用者が確認対象として選択するローカルの `.po` ファイル。                |
| EXT_BROWSER_FILE_CAPABILITY | Browser File Capability                    | External Capability | 選択されたローカルファイルの内容をブラウザー内で読み取る能力を提供する。 |
| EXT_STYLE_GUIDE             | WordPress Japanese Translation Style Guide | External System     | 各指摘の根拠として利用者が任意に参照する一次情報。                       |

## 4. Solution Strategy

WTC v1 は、確認要求を調整する責務と、PO Interpretation、Locale Resolution、日本語 v1 Check、Presentation を分離する。

PO Interpretation は入力を翻訳 entry と metadata へ変換し、Locale Resolution は対象 locale を解決する。Check Orchestration は解決済み locale が `ja` の場合だけ日本語 v1 Check の `check(entries)` を呼ぶ。日本語 v1 Check は12ルールを内部で実行し、問題のある entry だけを Error / Warning として返す。

Locale Rule Selection / RuleSet / Rule は設けない。Finding Coordination も独立責務として設けず、同一原因の重複回避や具体的ルール優先は日本語 v1 Check 内の各判定条件で扱う。

Presentation は利用者向け interaction state と表示を所有し、個別ルールの判定を再実行しない。

### Process Flow Views

#### Validation End-to-End {#PV_VALIDATION_END_TO_END kind=normal}

| From                     | To                       | Kind   | Meaning                                                 |
| ------------------------ | ------------------------ | ------ | ------------------------------------------------------- |
| EXT_USER_PO_FILE         | RESP_PRESENTATION        | normal | 利用者が確認対象の `.po` ファイルを選択する。           |
| RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION | normal | 確認要求を Validation Core へ渡す。                     |
| RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION   | normal | PO を翻訳 entry と metadata へ解釈する。                |
| RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION   | normal | metadata から locale を解決する。                       |
| RESP_CHECK_ORCHESTRATION | RESP_JAPANESE_CHECK      | normal | locale が `ja` の場合、日本語 `check(entries)` を呼ぶ。 |
| RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | normal | 正常結果または確認不能理由を Presentation へ返す。      |

#### Validation Failure Boundaries {#PV_VALIDATION_FAILURE_BOUNDARIES kind=failure-recovery}

| From                     | To                       | Kind     | Meaning                                                            |
| ------------------------ | ------------------------ | -------- | ------------------------------------------------------------------ |
| RESP_PO_INTERPRETATION   | RESP_CHECK_ORCHESTRATION | failure  | PO を確認可能な入力として解釈できない。                            |
| RESP_LOCALE_RESOLUTION   | RESP_CHECK_ORCHESTRATION | failure  | 対象 locale を判定できない。                                       |
| RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | recovery | 解決済み locale が未対応、またはその他の確認不能理由を表示へ返す。 |

## 5. Building Block View

### Responsibility Inventory

| ID                       | Responsibility      | Summary                                                             |
| ------------------------ | ------------------- | ------------------------------------------------------------------- |
| RESP_PRESENTATION        | Result Presentation | 入力、利用者向け状態、確認結果、重要なフィードバックを表示する。    |
| RESP_CHECK_ORCHESTRATION | Check Orchestration | 1回の確認要求を調整し、確認全体の結果を確定する。                   |
| RESP_PO_INTERPRETATION   | PO Interpretation   | PO を翻訳 entry と metadata へ解釈する。                            |
| RESP_LOCALE_RESOLUTION   | Locale Resolution   | metadata から対象 locale を解決し、判定不能を区別する。             |
| RESP_JAPANESE_CHECK      | Japanese v1 Check   | 日本語 v1 の12ルールを実行し、entry ごとの Error / Warning を返す。 |

### Ownership Boundaries

| ID                       | Name                  | Includes                                                                                   |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------------------ |
| BOUNDARY_PRESENTATION    | Presentation          | RESP_PRESENTATION                                                                          |
| BOUNDARY_VALIDATION_CORE | Validation Core       | RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_JAPANESE_CHECK |
| BOUNDARY_BROWSER_INPUT   | Browser Input         | EXT_USER_PO_FILE EXT_BROWSER_FILE_CAPABILITY                                               |
| BOUNDARY_REFERENCE       | Reference Information | EXT_STYLE_GUIDE                                                                            |

### Dependencies

| Dependent                | Depends on               | Reason                                                   |
| ------------------------ | ------------------------ | -------------------------------------------------------- |
| RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION | 確認要求を渡し、確認全体の結果を受け取る。               |
| RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION   | 入力を Validation Core 用データへ解釈する。              |
| RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION   | 対象 locale を解決する。                                 |
| RESP_CHECK_ORCHESTRATION | RESP_JAPANESE_CHECK      | locale が `ja` の場合に日本語 v1 チェックを1回実行する。 |
| RESP_PRESENTATION        | EXT_STYLE_GUIDE          | 利用者が一次情報を確認できるリンクを提示する。           |

### Responsibility Details

#### Result Presentation {#RESP_PRESENTATION}

##### Responsibility

利用者が確認対象を選択し、確認を開始し、確認中・正常完了・確認不能を理解できるように表示する。

個別ルールの条件、優先関係、Severity を再計算しない。

#### Check Orchestration {#RESP_CHECK_ORCHESTRATION}

##### Responsibility

1回の確認要求について PO Interpretation と Locale Resolution を実行し、解決済み locale が `ja` の場合だけ日本語 v1 Check を呼ぶ。

##### Contract

確認対象を受け取り、正常完了、入力解析不能、locale 判定不能、未対応 locale を意味上区別した確認全体の結果を返す。具体的な TypeScript contract は、この責務を実装する Phase で定義する。

##### Invariants

- 日本語の個別チェック構造を知らず、`check(entries)` を1回呼ぶだけとする。
- `ja` 以外へ日本語チェックを適用しない。
- 確認不能を「指摘0件」として扱わない。

#### PO Interpretation {#RESP_PO_INTERPRETATION}

##### Responsibility

選択された PO 内容を、検証対象となる翻訳 entry と locale 判定に必要な metadata へ解釈する。

##### Invariants

- 入力 PO を変更しない。
- 不正入力を成功した空 entry 集合として扱わない。
- parser 固有 API を後続責務へ露出しない。
- raw source / parser result を解釈結果へ保持し続けない。

#### Locale Resolution {#RESP_LOCALE_RESOLUTION}

##### Responsibility

PO Interpretation が提供した metadata から対象 locale を判定する。

##### Contract

metadata を受け取り、解決済み locale または locale 判定不能を返す。

##### Invariants

- 既知の WordPress 日本語表現は `ja` へ解決する。
- その他の非空値を先回りして汎用正規化しない。
- 対応ルールの有無は判断しない。

#### Japanese v1 Check {#RESP_JAPANESE_CHECK}

##### Responsibility

PO Interpretation が生成した entry 一覧をまとめて受け取り、各 entry の日本語訳へ Requirements の v1 対象12ルールを適用する。

##### Contract

```ts
export type CheckMessage = {
  styleGuideItem: string
  message: string
}

export type TranslationCheckResult = {
  entryIndex: number
  errors: readonly CheckMessage[]
  warnings: readonly CheckMessage[]
}

export function check(
  entries: readonly TranslationEntry[],
): readonly TranslationCheckResult[]
```

##### Invariants

- 問題のない entry は結果に含めない。
- 指摘が1件もなければ `[]` を返す。
- `entryIndex` は PO Interpretation の identity を使用する。
- 日本語 v1 の公開結果に `translationFormIndex` を含めない。
- 個別チェックを外部 export しない。
- Finding Coordination を設けない。
- Design の優先関係と重複回避は各チェックの判定条件として扱う。
- React、DOM、parser 固有表現へ依存しない。

## 6. Runtime View

### Successful validation with findings {#RV_SUCCESS_WITH_FINDINGS}

確認可能な日本語 PO に対して、1件以上の指摘を含む正常結果が得られる流れを示す。

| Step | Source                   | Target                   | Interaction                                                       |
| ---: | ------------------------ | ------------------------ | ----------------------------------------------------------------- |
|    1 | RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION | 確認開始時点の選択入力を対象として確認を要求する。                |
|    2 | RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION   | 入力を翻訳 entry と metadata へ解釈するよう求める。               |
|    3 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION   | 解釈済み metadata から対象 locale の判定を求める。                |
|    4 | RESP_CHECK_ORCHESTRATION | RESP_JAPANESE_CHECK      | locale が `ja` のため、日本語 `check(entries)` を実行する。   |
|    5 | RESP_JAPANESE_CHECK      | RESP_CHECK_ORCHESTRATION | Error / Warning を含む日本語チェック結果を返す。                  |
|    6 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | 指摘あり正常完了として確認全体の結果を通知する。                  |

### Successful validation without findings {#RV_SUCCESS_WITHOUT_FINDINGS}

確認が正常に完了し、日本語 v1 対象ルールで指摘がない場合を示す。

| Step | Source                   | Target                   | Interaction                                                       |
| ---: | ------------------------ | ------------------------ | ----------------------------------------------------------------- |
|    1 | RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION | 確認開始時点の選択入力を対象として確認を要求する。                |
|    2 | RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION   | 入力を翻訳 entry と metadata へ解釈するよう求める。               |
|    3 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION   | 解釈済み metadata から対象 locale の判定を求める。                |
|    4 | RESP_CHECK_ORCHESTRATION | RESP_JAPANESE_CHECK      | locale が `ja` のため、日本語 `check(entries)` を実行する。   |
|    5 | RESP_JAPANESE_CHECK      | RESP_CHECK_ORCHESTRATION | 指摘がないため空配列を返す。                                      |
|    6 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | 指摘なし正常完了として確認全体の結果を通知する。                  |

### Invalid PO input {#RV_INVALID_PO_INPUT}

入力を確認可能な PO として解釈できない場合を示す。

| Step | Source                   | Target                   | Interaction                                      |
| ---: | ------------------------ | ------------------------ | ------------------------------------------------ |
|    1 | RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION | 選択入力の確認を要求する。                       |
|    2 | RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION   | 入力の解釈を求める。                             |
|    3 | RESP_PO_INTERPRETATION   | RESP_CHECK_ORCHESTRATION | 確認可能な PO として解釈できないことを通知する。 |
|    4 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | 入力解析不能として確認全体の結果を通知する。     |

### Unresolved locale {#RV_UNRESOLVED_LOCALE}

PO は解釈できるが対象 locale を判定できない場合を示す。

| Step | Source                   | Target                   | Interaction                                        |
| ---: | ------------------------ | ------------------------ | -------------------------------------------------- |
|    1 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION   | 解釈済み metadata から対象 locale の判定を求める。 |
|    2 | RESP_LOCALE_RESOLUTION   | RESP_CHECK_ORCHESTRATION | 対象 locale を判定できないことを通知する。         |
|    3 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | locale 判定不能として確認全体の結果を通知する。    |

### Unsupported locale {#RV_UNSUPPORTED_LOCALE}

対象 locale は判定できるが v1 では未対応の場合を示す。

| Step | Source                   | Target                   | Interaction                                                      |
| ---: | ------------------------ | ------------------------ | ---------------------------------------------------------------- |
|    1 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION   | 解釈済み metadata から対象 locale の判定を求める。               |
|    2 | RESP_LOCALE_RESOLUTION   | RESP_CHECK_ORCHESTRATION | `ja` 以外の解決済み locale を返す。                            |
|    3 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | 日本語チェックを実行せず、未対応 locale として結果を通知する。   |

### Input replaced during validation {#RV_INPUT_REPLACED}

確認中に利用者が別のファイルを選択した場合でも、旧入力に対応付いた結果を現在の入力へ誤適用しないことを示す。利用者による現在入力の置き換えは Presentation 内の state transition であり、責務間 interaction としては扱わない。

| Step | Source                   | Target                   | Interaction                            |
| ---: | ------------------------ | ------------------------ | -------------------------------------- |
|    1 | RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION | 旧入力を対象とする確認を開始する。     |
|    2 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | 旧入力に対応付いた確認結果を通知する。 |

## 8. Crosscutting Concepts

### Validation data boundaries

責務間では少なくとも次を区別する。

- 選択された入力。
- PO 解釈後の翻訳 entry と metadata。
- 解決済み locale。
- 日本語 v1 の `TranslationCheckResult[]`。
- Check Orchestration が返す確認全体の結果。

### Japanese rule common logic

技術的文字列の誤検出抑制や numeric placeholder の扱いなど、複数ルールで実際に同じ意味の処理が必要になった場合だけ、日本語 v1 Check 内で必要最小限に共有する。

独立した Shared rule concepts subsystem、汎用 tokenizer、rule engine、plugin system、DI、dynamic registry は要求しない。

### Deterministic validation

- 同じ入力に対する日本語 `check(entries)` は同じ結果順序を返す。
- 個別チェックの Severity とメッセージは同じ条件で変化しない。
- 過去の確認結果や実行時刻へ依存しない。

### Input-result identity

1回の確認結果は、確認開始時点の入力に対応する。Presentation が新しい入力を採用した後、古い確認結果を新しい入力の結果として表示してはならない。

## 9. Architecture Decisions

### AD-01 Browser-local validation

PO 解釈と検証をブラウザー内で完結させる。翻訳内容を外部検証 API、telemetry、remote processing へ送信する前提を持たない。

### AD-02 Validation core independent from Presentation

Validation Core を React / DOM から分離する。Presentation は日本語ルールを再実行しない。

### AD-03 Keep Locale Resolution, remove Locale Rule Selection

「locale を判定できない」と「判定できるが未対応」は区別する必要があるため Locale Resolution は独立責務として維持する。

一方、v1 の対応 locale は `ja` だけであり、日本語チェックの公開入口も `check(entries)` 1つであるため、Locale Rule Selection / RuleSet / Rule は設けない。未対応 locale の分岐は Check Orchestration が所有する。

### AD-04 Japanese v1 check owns rule execution

日本語固有の12ルールと、そのルール間優先関係・重複回避を `src/validation/rules/ja/check.ts` の責務内に閉じる。

個別ルール構造を公開せず、Check Orchestration は `check(entries)` だけを利用する。

### AD-05 No Finding Coordination responsibility

日本語 v1 の公開結果は entry ごとの `errors` / `warnings` と最小 `CheckMessage` で十分なため、独立した Finding Coordination を設けない。

同一原因の重複回避は Design で決めた優先関係を各チェック条件へ反映する。

### AD-06 Define contracts at their owner

責務が存在する前に共有 contract を先行定義しない。必要な型は PO Interpretation、日本語 v1 Check、Check Orchestration 等、それぞれの所有責務で定義する。

### AD-07 Preserve input and bind results to validation input

確認処理は入力 PO を変更しない。各確認結果は確認開始時点の入力に対応付け、入力変更後に古い結果を現在入力へ適用しない。

## 10. Quality Requirements

### QR-01 Translation privacy

- 検証処理をブラウザー内に閉じる。
- 翻訳内容を外部検証 API、telemetry、remote processing へ送信しない。
- スタイルガイドは利用者向け参照先とする。

### QR-02 Deterministic validation

- 同じ入力から同じ日本語チェック結果と順序を得る。
- 過去の確認結果や実行時刻へ依存しない。
- 結果順序のためだけの独立 coordination layer を追加しない。

### QR-03 Result comprehensibility

- 日本語チェックは各指摘に `styleGuideItem` と利用者向け `message` を返す。
- 原文・翻訳等の表示に必要な追加情報は、Presentation / Check Orchestration を実装する時点で責務に沿って定義する。
- 日本語ルールの内部構造を Presentation へ漏らさない。

## 11. Risks and Technical Debt

- 技術的文字列の除外を過剰に一般化すると、本来の日本語本文を確認しなくなるため、明確に判定できる範囲を優先する。
- Warning は原文パターンを条件として扱い、翻訳だけを見て断定しない。
- 将来 locale が増えた場合は、その時点の具体的な要件から境界を再検討し、v1 のために先行抽象化しない。

## 12. Glossary

**Check Result**

Check Orchestration が1回の確認要求について返す全体結果。正常完了と確認不能を区別する。具体的な型は Check Orchestration 実装時に定義する。

**Japanese v1 check result**

日本語 `check(entries)` が返す entry 単位の結果。問題のある entry だけを含み、Error / Warning の `CheckMessage` を保持する。

**CheckMessage**

日本語 v1 の1指摘が返す最小情報。`styleGuideItem` と `message` を持つ。

**Locale**

翻訳対象の言語・地域を識別する値。v1 の対応対象は日本語（`ja`）。
