# WP Translation Checker v1 implementation plan

## References

- Requirements: [docs/requirements/v1-requirements.md](../requirements/v1-requirements.md)
- Design: [docs/design/v1-design.md](../design/v1-design.md)
- Architecture: [docs/architecture/v1-architecture.md](../architecture/v1-architecture.md)

## Goal

完成済みの v1 Requirements、Design、Architecture を、現在の Vite / React / TypeScript 実装からレビュー可能な段階に分けて実装する。

最終的には、利用者がブラウザー上でローカルの `.po` ファイルを選択し、日本語向け v1 ルールによる確認結果または確認不能理由を理解できる状態まで到達する。

## Scope

### Included

- PO Interpretation。
- Locale Resolution。
- Requirements の v1 scope にある日本語向け12ルール。
- 日本語 v1 チェックの公開入口 `check(entries)`。
- Check Orchestration。
- Result Presentation とブラウザー入力。
- 正常完了、解析不能、ロケール判定不能、未対応ロケールの区別。
- Vitest による主要責務の検証。

### Not included

- `.po` ファイルの編集、自動修正、修正版ファイル生成。
- 確認結果の export。
- translate.wordpress.org または GlotPress との直接統合。
- 日本語以外のチェックルール。
- 利用者によるロケール選択または上書き。
- AI による翻訳品質評価。
- 将来ロケール向けの RuleSet、registry、plugin system、DI container、動的ロード。
- Finding Coordination の独立責務。
- v1 のために必要性が確立していない汎用基盤。

## Approach

### Validation Core module direction

Validation Core は `src/validation/` 配下に置き、現在必要な責務だけを実装する。

- `src/validation/po/`
  - PO Interpretation。
  - parser 固有表現を後続責務へ漏らさず、翻訳 entry と metadata へ正規化する。
- `src/validation/locale/`
  - Locale Resolution。
- `src/validation/rules/ja/`
  - 日本語 v1 チェック。
  - 公開入口は `check(entries)`。
  - 個別チェックは外部へ公開しない。
- `src/validation/check/`
  - 後続 Phase で実装する Check Orchestration。
  - 解決済み locale が `ja` の場合に日本語 `check(entries)` を呼ぶ。
- Presentation
  - Check Orchestration の結果を利用者向けに表示する。

単に複数箇所から利用される可能性があるという理由だけで、共有 contract、RuleSet、registry、`utils/` 等を先行作成しない。

### Japanese v1 check contract

日本語 v1 チェックは PO Interpretation が生成した entry 一覧をまとめて受け取る。

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

- 問題のない entry は結果に含めない。
- 指摘が1件もなければ `[]` を返す。
- `entryIndex` は PO Interpretation の identity をそのまま使う。
- 日本語 v1 では `translationFormIndex` を公開結果へ追加しない。
- Finding Coordination は設けない。
- Design の優先関係や重複回避は各チェックの判定条件として扱う。

### Test direction

Validation Core は React / DOM なしでテストできる構造とする。

- production の公開境界を通して主要な振る舞いを確認する。
- 実装詳細をテストするためだけの production export は追加しない。
- 各日本語ルールは Design にある正常例、NG 例、明示された例外を確認する。
- repository-wide の検証コマンドは `docs/development/testing.md` を source of truth とする。

## Implementation phases

### Phase 1: Test foundation

- Outcome:
  - Vitest で Validation Core の公開責務を検証できる。
- Tasks:
  - Vitest と非対話の test script を用意する。
  - 必要になった時点でのみ React DOM test utilities を追加する。
- Note:
  - 先行定義した `src/validation/contracts.ts` は現在の責務構成では維持しない。
  - 型は実際に所有する責務で必要になった時点に定義する。

### Phase 2: PO Interpretation

- Outcome:
  - PO 内容を翻訳 entry と metadata へ解釈でき、不正 PO を成功扱いしない。
- Tasks:
  - browser bundle で利用可能な parser を使う。
  - parser 固有表現を責務内へ閉じ込める。
  - 原文、翻訳、plural form identity、locale 判定用 metadata を保持する。
  - raw source / parser result を解釈後に保持し続けない。

### Phase 3: Locale Resolution

- Outcome:
  - PO metadata から locale を解決し、判定不能を区別できる。
- Tasks:
  - 既知の WordPress 日本語表現を `ja` へ解決する。
  - その他の非空値は先回りして汎用正規化せず、解決済み値として保持する。
- Note:
  - Locale Rule Selection / RuleSet は使用しない。
  - 未対応 locale の判定は後続の Check Orchestration が、解決済み locale と対応実装の有無から行う。

### Phase 4: No standalone shared-rule phase

独立した Shared rule concepts phase は実施しない。

複数ルールで実際に同じ意味の処理が必要になった場合だけ、その実装時点で必要最小限の共有処理を導入する。技術的文字列、numeric placeholder 等を理由に、先行して汎用 tokenizer、rule engine、shared subsystem を作らない。

### Phase 5: Japanese v1 rules

- Outcome:
  - Requirements の v1 scope にある全12ルールを `check(entries)` から実行できる。
- Tasks:
  - 1-1 日本語の句読点。
  - 1-2 英数字・記号の半角表記。
  - 1-4 半角文字と全角文字の間のスペース。
  - 1-5 半角丸括弧と前後スペース。
  - 1-6 丸括弧内側の不要スペース。
  - 1-7 括弧内末尾の句点。
  - 1-8 文末括弧と句点の位置。
  - 1-9 半角数字前後の不要スペース。
  - 3-2 `View XX` の Warning。
  - 3-3 `XX are/is not allowed to...` の Warning。
  - 3-4 `Sorry, ...` の Warning。
  - 3-6 推奨表記。
- Boundary:
  - 個別チェックは `src/validation/rules/ja/check.ts` の内部実装とする。
  - Check Orchestration とはまだ接続しない。
  - Finding Coordination は設けない。
  - 問題のない entry は結果に含めない。

### Phase 6: Check Orchestration

- Outcome:
  - Presentation が1つの入口へ確認対象を渡し、確認全体の結果を受け取れる。
- Tasks:
  - PO Interpretation を実行する。
  - Locale Resolution を実行する。
  - locale が `ja` の場合に日本語 `check(entries)` を呼ぶ。
  - locale が解決できるが `ja` でない場合は未対応として扱う。
  - 正常完了と解析不能、ロケール判定不能、未対応ロケールを意味上区別する。
- Boundary:
  - 日本語の個別ルール構成を知らず、`check(entries)` を1回呼ぶだけとする。

### Phase 7: Presentation and browser input

- Outcome:
  - 利用者がファイル選択、確認、結果理解まで行える。
- Tasks:
  - file input、確認開始、checking state、result state を実装する。
  - 結果概要、Error / Warning 件数、問題なし表示を実装する。
  - 指摘の利用者向け情報を表示する。
  - 入力差し替え後に古い結果を現在入力へ適用しない。
  - Design の keyboard / focus / responsive behavior を満たす。

### Phase 8: v1 integration and release-readiness validation

- Outcome:
  - Requirements、Design、Architecture の v1 scope を統合状態で確認できる。
- Tasks:
  - 12ルールを含む representative PO で確認する。
  - 同一入力の繰り返し確認で結果が同一になることを確認する。
  - privacy boundary を確認する。
  - Requirements の FR / QR を実装とテストへ trace する。

## Decisions

- 日本語 v1 チェックの公開入口は `check(entries)` 1つとする。
- Locale Resolution は維持する。
- Locale Rule Selection / RuleSet / Rule は撤去する。
- Finding Coordination は設けない。
- 問題のない entry は日本語チェック結果に含めない。
- 日本語 v1 の公開結果に `translationFormIndex` は含めない。
- 将来用途だけの plugin system、DI、dynamic registry、汎用 rule engine は導入しない。
- 共通処理は、複数ルールで実際に必要になった場合だけ必要最小限に導入する。

## Issue breakdown

- [x] Test foundation
- [x] PO Interpretation
- [x] Locale Resolution
- [ ] Japanese v1 check public interface
- [ ] Japanese rules 1-1 and 1-2
- [ ] Japanese rules 1-4, 1-5, 1-6, 1-7, 1-8, and 1-9
- [ ] Japanese Warning rules 3-2, 3-3, and 3-4
- [ ] Japanese recommended-expression rule 3-6
- [ ] Check Orchestration
- [ ] Presentation and browser file input
- [ ] v1 integration and release-readiness validation

## Validation

実装完了時の repository-wide validation は `docs/development/testing.md` を source of truth とする。

最低限、最終状態では `npm run validate` と `git diff --check origin/main...HEAD` を実行する。ブラウザー操作を伴う Presentation の確認は、その責務を実装した Phase で行う。

## Completion criteria

- Validation Core が React / DOM に依存しない。
- v1 Requirements の12ルールが Design の判定仕様と例外を含むテスト付きで実装されている。
- 日本語チェックは `check(entries)` だけを公開入口とする。
- 問題のない entry を日本語チェック結果へ含めない。
- locale が `ja` の場合だけ日本語チェックが呼ばれる。
- 正常完了と解析不能、ロケール判定不能、未対応ロケールを区別できる。
- Finding Coordination、Locale Rule Selection、RuleSet、registry、DI を前提としない。
- 同じ入力から同じ結果を得る。
