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

WTC v1 は、確認要求を調整する責務と、意味解釈・ロケール判定・ルール評価・指摘調整を分離する。

PO Interpretation は入力を検証可能な翻訳エントリとメタデータへ変換し、Locale Resolution はその結果から対象ロケールを解決する。Locale Rule Selection は解決済みロケールに対応するルール集合だけを選択し、Rule Evaluation はそのルール集合を翻訳エントリへ適用する。Finding Coordination は個別ルールの検出結果を、重複や優先関係を解決した利用者向け Finding へ整える。

Presentation は利用者向け interaction state と表示を所有するが、検証コアの判断を再計算しない。

### Process Flow Views

#### Validation End-to-End {#PV_VALIDATION_END_TO_END kind=normal}

通常の確認処理が、利用者の入力から表示可能な結果へ進む主要方向を示す。

| From                       | To                         | Kind   | Meaning                                              |
| -------------------------- | -------------------------- | ------ | ---------------------------------------------------- |
| EXT_USER_PO_FILE           | RESP_PRESENTATION          | normal | 利用者が選択した確認対象が WTC の利用フローへ入る。 |
| RESP_PRESENTATION          | RESP_CHECK_ORCHESTRATION   | normal | 確認要求が検証処理の調整責務へ進む。                 |
| RESP_CHECK_ORCHESTRATION   | RESP_PO_INTERPRETATION     | normal | 確認対象の解釈処理へ進む。                           |
| RESP_PO_INTERPRETATION     | RESP_LOCALE_RESOLUTION     | normal | 解釈済みメタデータからロケール判定へ進む。           |
| RESP_LOCALE_RESOLUTION     | RESP_LOCALE_RULE_SELECTION | normal | 判定済みロケールから適用ルール集合の選択へ進む。     |
| RESP_LOCALE_RULE_SELECTION | RESP_RULE_EVALUATION       | normal | 選択済みロケールルールによる評価へ進む。             |
| RESP_RULE_EVALUATION       | RESP_FINDING_COORDINATION  | normal | 個別ルールの検出結果が指摘調整へ進む。               |
| RESP_FINDING_COORDINATION  | RESP_CHECK_ORCHESTRATION   | normal | 調整済み Finding が確認全体の結果へ統合される。      |
| RESP_CHECK_ORCHESTRATION   | RESP_PRESENTATION          | normal | 確認全体の結果が利用者向け表示へ進む。               |

#### Validation Failure Boundaries {#PV_VALIDATION_FAILURE_BOUNDARIES kind=failure-recovery}

解析不能、ロケール判定不能、未対応ロケールが正常結果と混同されず Presentation へ戻る境界を示す。

| From                       | To                       | Kind     | Meaning                                                            |
| -------------------------- | ------------------------ | -------- | ------------------------------------------------------------------ |
| RESP_PO_INTERPRETATION     | RESP_CHECK_ORCHESTRATION | failure  | 入力を確認可能な PO として解釈できない状態が確認全体の結果へ戻る。 |
| RESP_LOCALE_RESOLUTION     | RESP_CHECK_ORCHESTRATION | failure  | 対象ロケールを判定できない状態が確認全体の結果へ戻る。             |
| RESP_LOCALE_RULE_SELECTION | RESP_CHECK_ORCHESTRATION | failure  | 判定済みロケールが未対応である状態が確認全体の結果へ戻る。         |
| RESP_CHECK_ORCHESTRATION   | RESP_PRESENTATION        | recovery | 確認不能理由を利用者が理解できる安定した表示状態へ戻す。           |

## 5. Building Block View

### Responsibility Inventory

| ID                         | Responsibility        | Summary                                                                               |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| RESP_PRESENTATION          | Result Presentation   | 確認入力、利用者向け状態、確認結果、重要なフィードバックを表示する。                  |
| RESP_CHECK_ORCHESTRATION   | Check Orchestration   | 1回の確認要求を開始し、入力から確認全体の結果までの処理を調整する。                   |
| RESP_PO_INTERPRETATION     | PO Interpretation     | 入力ファイルを検証可能な翻訳エントリとメタデータへ解釈する。                          |
| RESP_LOCALE_RESOLUTION     | Locale Resolution     | PO メタデータから対象ロケールを判定し、判定不能を区別する。                           |
| RESP_LOCALE_RULE_SELECTION | Locale Rule Selection | 判定済みロケールに対応するルール集合を選択し、未対応を区別する。                      |
| RESP_RULE_EVALUATION       | Rule Evaluation       | 選択されたロケールルールを翻訳エントリへ適用し、ルール固有の検出結果を生成する。      |
| RESP_FINDING_COORDINATION  | Finding Coordination  | ルール固有の検出結果を重複・優先関係・集約・順序の規則に従って最終 Finding へ整える。 |

### Ownership Boundaries

| ID                       | Name                  | Includes                                                                                                                                         |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| BOUNDARY_PRESENTATION    | Presentation          | RESP_PRESENTATION                                                                                                                                |
| BOUNDARY_VALIDATION_CORE | Validation Core       | RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_LOCALE_RULE_SELECTION RESP_RULE_EVALUATION RESP_FINDING_COORDINATION |
| BOUNDARY_BROWSER_INPUT   | Browser Input         | EXT_USER_PO_FILE EXT_BROWSER_FILE_CAPABILITY                                                                                                     |
| BOUNDARY_REFERENCE       | Reference Information | EXT_STYLE_GUIDE                                                                                                                                  |

### Dependencies

| Dependent                | Depends on                  | Reason                                                                       |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------- |
| RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION    | 利用者向け確認結果と確認不能状態を得るために確認全体の処理境界を必要とする。 |
| RESP_PRESENTATION        | EXT_BROWSER_FILE_CAPABILITY | ローカルファイルを選択・読み取り可能な入力能力を利用するため。               |
| RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION      | 確認対象を検証可能な翻訳エントリとメタデータへ解釈する必要があるため。       |
| RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION      | 解釈済み入力の対象ロケールを判定する必要があるため。                         |
| RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RULE_SELECTION  | 判定済みロケールに適用可能なルール集合を決定する必要があるため。             |
| RESP_CHECK_ORCHESTRATION | RESP_RULE_EVALUATION        | 選択済みルール集合による検出結果を得る必要があるため。                       |
| RESP_CHECK_ORCHESTRATION | RESP_FINDING_COORDINATION   | 個別検出結果を一貫した最終 Finding へ整える必要があるため。                  |
| RESP_PO_INTERPRETATION   | EXT_USER_PO_FILE            | 確認対象であるローカル PO 内容を解釈するため。                               |

### Dependency Views

| ID                       | Name                  | Includes                                                                                                                                                          |
| ------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DV_VALIDATION_CORE       | Validation Core       | RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_LOCALE_RULE_SELECTION RESP_RULE_EVALUATION RESP_FINDING_COORDINATION EXT_USER_PO_FILE |
| DV_PRESENTATION_BOUNDARY | Presentation Boundary | RESP_PRESENTATION RESP_CHECK_ORCHESTRATION EXT_BROWSER_FILE_CAPABILITY                                                                                            |

### Responsibility Details

#### Result Presentation {#RESP_PRESENTATION}

##### Responsibility

利用者が確認対象を選択し、確認を開始し、確認中・正常完了・確認不能を理解できるように表示する。

確認結果では、Error / Warning、問題概要、原文、翻訳、問題箇所、判定理由、スタイルガイド根拠を、検証コアから受け取った意味情報に基づいて表示する。

##### State ownership

利用者が現在選択している入力、確認中かどうか、現在の入力へ適用可能な確認全体の結果など、利用者向け interaction state を所有する。

個別ルールの判定状態、ロケールルール集合、重複指摘解消状態は所有しない。

##### Contract

確認対象を Check Orchestration へ渡し、確認全体の結果を受け取る。

成功結果では、最終 Finding が保持する Severity、問題概要、原文、翻訳、問題箇所、判定理由、スタイルガイド参照情報を表示できる。

確認不能結果では、解析不能、ロケール判定不能、未対応ロケールを区別して表示できる。

##### Lifecycle

ファイル選択から確認開始、結果表示まで利用者向け状態を維持する。別のファイルが選択された場合、以前の結果を新しい入力へ適用可能な現在結果として扱わない。

##### Invariants

- 原文・翻訳を再解析して問題箇所を推測しない。
- Severity やルール優先順位を再決定しない。
- 正常結果と確認不能結果を見た目上も意味上も混同しない。
- 検証コアへ React、DOM、focus API の責務を要求しない。

#### Check Orchestration {#RESP_CHECK_ORCHESTRATION}

##### Responsibility

1回の確認要求について、PO Interpretation、Locale Resolution、Locale Rule Selection、Rule Evaluation、Finding Coordination の処理を調整し、確認全体の結果を確定する。

個々のルール条件や UI 表示方法は所有しない。

##### State ownership

確認開始時点の入力に対応する処理コンテキストを所有する。

実現方法として request ID、queue、cancel token などを要求しないが、どの入力に対する処理かを区別できる意味上の対応関係を保持する。

##### Contract

確認対象を受け取り、以下のいずれかを意味として区別した確認全体の結果を返す。

- 入力解析不能
- ロケール判定不能
- 未対応ロケール
- 指摘あり正常完了
- 指摘なし正常完了

##### Lifecycle

利用者の確認要求で開始し、確認全体の結果が確定した時点で終了する。

入力変更後に古い処理が完了しても、その結果を新しい入力の結果として採用しない。

##### Invariants

- 解析不能時はロケール判定以降を開始しない。
- ロケール判定不能時はロケール固有ルールを適用しない。
- 未対応ロケール時は別ロケールのルールを代替適用しない。
- 正常完了と確認不能を空配列の有無だけで区別しない。
- 日本語固有の項目番号や判定文言を所有しない。

#### PO Interpretation {#RESP_PO_INTERPRETATION}

##### Responsibility

選択された PO 内容を、検証対象となる翻訳エントリとロケール判定に必要なメタデータへ解釈する。

##### State ownership

1回の解釈処理に必要な一時的な解釈状態のみを所有する。確認結果や UI state は所有しない。

##### Contract

入力 PO を受け取り、解釈済み翻訳エントリとメタデータ、または解析不能を返す。

翻訳エントリは後続責務が原文・翻訳・必要な補助情報を参照できる意味を持つ。

##### Invariants

- 入力 PO の内容を変更しない。
- 不正入力を成功した空の翻訳集合として扱わない。
- 特定の parser ライブラリ API を後続責務へ露出することを前提としない。

#### Locale Resolution {#RESP_LOCALE_RESOLUTION}

##### Responsibility

PO Interpretation が提供したメタデータから対象ロケールを判定する。

##### Contract

解釈済みメタデータを受け取り、判定済みロケールまたはロケール判定不能を返す。

##### Invariants

- 「判定できない」と「判定できたが未対応」を同じ状態として扱わない。
- ルール集合の存在有無は判断しない。

#### Locale Rule Selection {#RESP_LOCALE_RULE_SELECTION}

##### Responsibility

判定済みロケールに対応するルール集合を選択する。

v1 では日本語（`ja`）のみを対応ロケールとして扱う。

##### Contract

判定済みロケールを受け取り、そのロケールに対応するルール集合、または未対応ロケールを返す。

##### Invariants

- 日本語以外へ日本語ルールを適用しない。
- 検証フロー本体へ日本語固有条件を流出させない。
- 将来ロケール追加時に既存日本語ルールへ他ロケール条件を積み重ねることを前提としない。

#### Rule Evaluation {#RESP_RULE_EVALUATION}

##### Responsibility

選択されたロケールルール集合を翻訳エントリへ適用し、ルール固有の検出結果を生成する。

各ルールは、自身の判定条件、Severity、問題概要、判定理由、スタイルガイド根拠、問題箇所の意味情報に責任を持つ。

##### State ownership

1回のルール評価に必要な一時状態のみを所有する。最終 Finding の重複解消や表示順序は所有しない。

##### Contract

翻訳エントリと選択済みルール集合を受け取り、ルール固有の検出結果を返す。

検出結果は、必要に応じて複数の問題箇所を保持でき、各問題箇所について原文側・翻訳側の識別、および既存文字範囲または文字間境界を表現できる意味を持つ。

##### Invariants

- 各ルールは他ルールの内部判定結果へ依存しない。
- 技術的文字列、数値プレースホルダー、問題箇所表現など複数ルールに共通する概念は、一貫した共有契約として扱う。
- 共有契約はロケール固有ルールの判定を置き換えない。
- 正規表現、文字走査、tokenizer などの具体的アルゴリズムをアーキテクチャ契約としない。

#### Finding Coordination {#RESP_FINDING_COORDINATION}

##### Responsibility

ルール固有の検出結果を、利用者へ提示可能な最終 Finding 集合へ整える。

以下を所有する。

- 同じ文字位置・同じ原因の重複指摘抑制
- より具体的なルールの優先
- 同じ翻訳内で同じルールに複数箇所ある場合の1 Finding への集約
- 別原因または別ルールの独立保持
- 決定論的な結果順序

##### Contract

ルール固有の検出結果を受け取り、Presentation が再解釈せず表示できる最終 Finding 集合を返す。

1つの Finding は1つ以上の問題箇所を保持できる。問題箇所は原文側・翻訳側を識別でき、文字範囲だけでなく不足スペースなどの文字間境界も表現できる。

##### Invariants

- 同じ入力と同じルール条件では、同じ Finding 集合と順序を返す。
- 同一原因の重複解消を Presentation に委ねない。
- 問題箇所を表示するために Presentation 側の再解析を必要としない。

## 6. Runtime View

### Successful validation with findings {#RV_SUCCESS_WITH_FINDINGS}

確認可能な日本語 PO に対して、1件以上の指摘を含む正常結果が得られる流れを示す。

| Step | Source                   | Target                     | Interaction                                                 |
| ---: | ------------------------ | -------------------------- | ----------------------------------------------------------- |
|    1 | RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION   | 確認開始時点の選択入力を対象として確認を要求する。          |
|    2 | RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION     | 入力を翻訳エントリとメタデータへ解釈するよう求める。        |
|    3 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION     | 解釈済みメタデータから対象ロケールの判定を求める。          |
|    4 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RULE_SELECTION | 判定済みロケールに対応するルール集合の選択を求める。        |
|    5 | RESP_CHECK_ORCHESTRATION | RESP_RULE_EVALUATION       | 翻訳エントリへ選択済みルール集合を適用するよう求める。      |
|    6 | RESP_CHECK_ORCHESTRATION | RESP_FINDING_COORDINATION  | ルール固有の検出結果を最終 Finding 集合へ整えるよう求める。 |
|    7 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION          | 指摘あり正常完了として確認全体の結果を通知する。            |

### Successful validation without findings {#RV_SUCCESS_WITHOUT_FINDINGS}

確認が正常に完了し、v1 対象ルールで指摘がない場合を示す。

| Step | Source                   | Target                     | Interaction                                            |
| ---: | ------------------------ | -------------------------- | ------------------------------------------------------ |
|    1 | RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION   | 確認開始時点の選択入力を対象として確認を要求する。     |
|    2 | RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION     | 入力を翻訳エントリとメタデータへ解釈するよう求める。   |
|    3 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION     | 解釈済みメタデータから対象ロケールの判定を求める。     |
|    4 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RULE_SELECTION | 判定済みロケールに対応するルール集合の選択を求める。   |
|    5 | RESP_CHECK_ORCHESTRATION | RESP_RULE_EVALUATION       | 翻訳エントリへ選択済みルール集合を適用するよう求める。 |
|    6 | RESP_CHECK_ORCHESTRATION | RESP_FINDING_COORDINATION  | 検出結果を空の最終 Finding 集合へ整えるよう求める。    |
|    7 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION          | 指摘なし正常完了として確認全体の結果を通知する。       |

### Invalid PO input {#RV_INVALID_PO_INPUT}

入力を確認可能な PO として解釈できない場合を示す。

| Step | Source                   | Target                   | Interaction                                      |
| ---: | ------------------------ | ------------------------ | ------------------------------------------------ |
|    1 | RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION | 選択入力の確認を要求する。                       |
|    2 | RESP_CHECK_ORCHESTRATION | RESP_PO_INTERPRETATION   | 入力の解釈を求める。                             |
|    3 | RESP_PO_INTERPRETATION   | RESP_CHECK_ORCHESTRATION | 確認可能な PO として解釈できないことを通知する。 |
|    4 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | 入力解析不能として確認全体の結果を通知する。     |

### Unresolved locale {#RV_UNRESOLVED_LOCALE}

PO は解釈できるが対象ロケールを判定できない場合を示す。

| Step | Source                   | Target                   | Interaction                                        |
| ---: | ------------------------ | ------------------------ | -------------------------------------------------- |
|    1 | RESP_CHECK_ORCHESTRATION | RESP_LOCALE_RESOLUTION   | 解釈済みメタデータから対象ロケールの判定を求める。 |
|    2 | RESP_LOCALE_RESOLUTION   | RESP_CHECK_ORCHESTRATION | 対象ロケールを判定できないことを通知する。         |
|    3 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | ロケール判定不能として確認全体の結果を通知する。   |

### Unsupported locale {#RV_UNSUPPORTED_LOCALE}

対象ロケールは判定できるが v1 では未対応の場合を示す。

| Step | Source                     | Target                     | Interaction                                                    |
| ---: | -------------------------- | -------------------------- | -------------------------------------------------------------- |
|    1 | RESP_CHECK_ORCHESTRATION   | RESP_LOCALE_RULE_SELECTION | 判定済みロケールに対応するルール集合の選択を求める。           |
|    2 | RESP_LOCALE_RULE_SELECTION | RESP_CHECK_ORCHESTRATION   | 対応ルール集合が存在しない未対応ロケールであることを通知する。 |
|    3 | RESP_CHECK_ORCHESTRATION   | RESP_PRESENTATION          | 未対応ロケールとして確認全体の結果を通知する。                 |

### Input replaced during validation {#RV_INPUT_REPLACED}

確認中に利用者が別のファイルを選択した場合でも、旧入力に対応付いた結果を現在の入力へ誤適用しないことを示す。利用者による現在入力の置き換えは Presentation 内の state transition であり、責務間 interaction としては扱わない。

| Step | Source                   | Target                   | Interaction                            |
| ---: | ------------------------ | ------------------------ | -------------------------------------- |
|    1 | RESP_PRESENTATION        | RESP_CHECK_ORCHESTRATION | 旧入力を対象とする確認を開始する。     |
|    2 | RESP_CHECK_ORCHESTRATION | RESP_PRESENTATION        | 旧入力に対応付いた確認結果を通知する。 |

## 8. Crosscutting Concepts

### Validation data boundaries

責務間では、少なくとも以下の概念データを区別する。

- 選択された入力ファイル
- PO 解釈後の翻訳エントリとメタデータ
- 判定されたロケール
- 選択されたロケール固有ルール集合
- ルール固有の検出結果
- UI に提示する最終 Finding
- 確認全体の結果

これらは実装上の具体的な TypeScript 型名を意味しない。

### Finding location model

最終 Finding は1つ以上の問題箇所を保持できる。

各問題箇所は少なくとも以下の意味を表現できる。

- 原文側または翻訳側
- 既存文字の範囲
- 不足しているスペースなどの文字間境界

これにより、同一ルールの複数箇所を1 Finding にまとめる場合や、Warning で原文側と翻訳側の双方を示す場合でも、Presentation に再解析を要求しない。

### Shared rule concepts

複数の日本語ルールに横断する概念は、Rule Evaluation 内で一貫して扱う。

代表例は以下とする。

- URL、メールアドレス、ファイルパス、コード、識別子などの技術的文字列
- 数値プレースホルダーと文字列プレースホルダーの区別
- 文字範囲と文字間境界
- ルール固有検出結果から Finding へ渡す問題箇所の意味

これらは共有概念であり、独立した将来用途の subsystem や plugin 機構を要求しない。

### Deterministic result coordination

結果の再現性は Rule Evaluation と Finding Coordination の境界全体で維持する。

- 個別ルールの Severity、説明、根拠は同じ条件で変化しない。
- Finding Coordination の重複解消、集約、優先関係、順序は同じ条件で変化しない。
- 過去の確認結果、実行時刻、今回の確認と無関係な以前の操作へ依存しない。

### Input-result identity

1回の確認結果は、確認開始時点の入力に対応する。

Presentation が新しい入力を現在対象として採用した後、古い確認結果を新しい入力の結果として表示してはならない。

この不変条件は特定の識別子方式、取消方式、queue 方式を要求しない。

## 9. Architecture Decisions

### AD-01 Browser-local validation

**Context**

QR-01 は翻訳内容を、明示された別要件がない限り外部サービスへ送信しないことを求める。

**Decision**

PO 解釈と検証をブラウザー内で完結させる。WordPress 日本語翻訳スタイルガイドは利用者向け参照先とし、確認実行時の remote dependency としない。

**Rationale**

未公開翻訳を含む入力内容を外部確認サービスへ送信せずに確認できる。

**Consequence**

外部 API、telemetry、remote processing を検証フローの前提にできない。

### AD-02 Validation core independent from Presentation

**Context**

UI の変更がルール判定へ波及したり、検証ロジックが React / DOM lifecycle に依存すると責務境界が不安定になる。

**Decision**

検証コアを React / DOM から分離し、Presentation は意味の確定した確認結果を受け取る。

**Rationale**

ルール判定と利用者向け表示を独立して保てる。

**Consequence**

Presentation は問題箇所や Severity を再計算しない。

### AD-03 Separate locale resolution and rule selection

**Context**

「ロケールを判定できない」と「判定できるが未対応」は利用者向けにも異なる状態である。

**Decision**

Locale Resolution と Locale Rule Selection を別責務とする。

**Rationale**

判定不能と未対応を明確に区別し、日本語ルールの誤適用を防げる。

**Consequence**

未対応ロケールへ `ja` ルールを fallback 適用しない。

### AD-04 Keep Japanese rules inside locale boundary

**Context**

v1 は日本語のみだが、将来別ロケールを追加する可能性がある。

**Decision**

日本語固有ルールを Locale Rule Selection が選択するロケール境界の内側へ閉じ込める。

**Rationale**

異なるロケールのルール混在を防ぐ。

**Consequence**

将来ロケール追加のためだけの plugin system や DI container は導入しない。

### AD-05 Distinguish successful and non-executable results

**Context**

指摘0件と、解析不能・ロケール判定不能・未対応を空配列だけで表現すると UI が意味を推測する必要がある。

**Decision**

確認全体の結果として、確認不能の理由と正常完了を意味上別の結果として扱う。

**Rationale**

「問題なし」と「確認できなかった」を混同しない。

**Consequence**

Presentation は確認結果の意味を独自推測しない。

### AD-06 Findings carry displayable semantics

**Context**

基本設計は問題概要、Severity、原文、翻訳、問題箇所、判定理由、スタイルガイド根拠の表示を求める。

**Decision**

最終 Finding に、Presentation が再解析せず表示できる意味情報を保持する。

**Rationale**

UI へルールロジックが漏れるのを防ぐ。

**Consequence**

問題箇所は複数保持でき、原文側・翻訳側と文字間境界を表現できる。

### AD-07 Deterministic finding coordination

**Context**

複数ルールが同一原因を指摘でき、同一ルールが1翻訳内で複数箇所へ一致する。

**Decision**

重複解消、具体的ルール優先、同一ルール内集約、最終順序を Finding Coordination が所有する。

**Rationale**

Presentation や個別ルールへ競合解決を分散させず、QR-02 を維持する。

**Consequence**

同じ入力と同じルール条件では同じ Finding 集合と順序を得る。

### AD-08 Preserve input and bind results to validation input

**Context**

WTC は確認ツールであり、入力修正は v1 対象外である。また、確認中に入力が変更される可能性がある。

**Decision**

確認処理は入力 PO を変更しない。各確認結果は確認開始時点の入力に対応付け、入力変更後に古い結果を現在入力へ適用しない。

**Rationale**

入力破壊と結果の取り違えを防ぐ。

**Consequence**

実装は結果と対象入力の対応関係を維持する必要があるが、具体的な同期機構はアーキテクチャでは固定しない。

## 10. Quality Requirements

### QR-01 Translation privacy

- 検証処理をブラウザー内に閉じる。
- 翻訳内容を外部検証 API、telemetry、remote processing へ送信する前提を持たない。
- スタイルガイドは実行時データ取得先ではなく利用者向け参照先とする。

### QR-02 Deterministic validation

- 同じ入力と同じルール条件から、同じ指摘集合、Severity、説明、根拠、問題箇所、順序を得る。
- 過去の確認結果や実行時刻へ依存しない。
- 重複解消と順序決定を Presentation へ分散しない。

### QR-03 Result comprehensibility

- Finding は問題概要、Severity、原文、翻訳、問題箇所、判定理由、スタイルガイド根拠を表示可能な意味として保持する。
- 問題箇所は複数、原文側・翻訳側、文字範囲・文字間境界を表現できる。
- Presentation は利用者が内部ルール名を知らなくても結果を理解できる表示を構成できる。

## 11. Risks and Technical Debt

- PO メタデータにはロケール表現のばらつきがあり得るため、Locale Resolution の実装時に対応範囲を設計と整合させる必要がある。
- 技術的文字列の除外やプレースホルダー解釈をルールごとに独自実装すると判定不整合が生じるため、共有概念の意味を維持する必要がある。
- Finding の問題箇所モデルを文字範囲だけに狭めると、不足スペースや原文・翻訳両側の Warning を Presentation へ正しく渡せなくなる。

## 12. Glossary

**Check Result**

1回の確認要求全体の結果。正常完了と確認不能を意味として区別する。

**Finding**

利用者へ提示する1件の最終指摘。Severity、問題内容、原文・翻訳、1つ以上の問題箇所、判定理由、スタイルガイド根拠を表示可能な意味として保持する。

**Rule-specific detection**

個別ルールが生成する、Finding Coordination 前の検出結果。

**Problem location**

Finding 内で問題箇所を示す意味情報。原文側・翻訳側を識別し、既存文字の範囲または文字間境界を表現できる。

**Locale**

翻訳対象の言語・地域を識別する値。v1 の対応対象は日本語（`ja`）。

**Supported locale**

Locale Rule Selection が対応するルール集合を提供できるロケール。v1 では日本語（`ja`）のみ。
