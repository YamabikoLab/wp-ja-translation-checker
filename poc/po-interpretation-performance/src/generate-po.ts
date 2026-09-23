/**
 * 実運用の大規模 PO に近いデータ密度を持つ synthetic PO を生成する。
 *
 * entry 数だけでなく文字列長、translator comment、source reference、context、
 * plural、multiline を混在させ、WooCommerce 級の入力サイズを再現する。
 */

const quotePo = (value: string): string => JSON.stringify(value)

const header = [
  'msgid ""',
  'msgstr ""',
  '"Project-Id-Version: wtc-performance-validation\\n"',
  '"Language: ja\\n"',
  '"Content-Type: text/plain; charset=UTF-8\\n"',
  '"Plural-Forms: nplurals=2; plural=(n != 1);\\n"',
  '',
].join('\n')

/**
 * synthetic PO の1 entry に共通する representative comment を作る。
 *
 * @param index entry を識別する連番。
 * @returns translator comment と source reference。
 */
const createComments = (index: number): string[] => [
  '#. 管理画面の設定項目で利用する翻訳文です。表示内容と操作結果を確認してください。',
  '#: src/settings/translation-option-' +
    String(index % 40) +
    '.tsx:' +
    String((index % 240) + 1),
]

/**
 * 通常の単数 entry を作る。
 *
 * @param index entry を識別する連番。
 * @returns PO の1 entry。
 */
const createSingularEntry = (index: number): string =>
  [
    ...createComments(index),
    ...(index % 4 === 0
      ? ['msgctxt ' + quotePo('settings-screen-' + String(index % 12))]
      : []),
    'msgid ' +
      quotePo(
        'Configure translation option ' +
          String(index) +
          ' for the current WordPress site.',
      ),
    'msgstr ' +
      quotePo(
        '現在の WordPress サイトで翻訳オプション ' +
          String(index) +
          ' を設定します。',
      ),
  ].join('\n')

/**
 * plural を持つ entry を作る。
 *
 * @param index entry を識別する連番。
 * @returns PO の1 entry。
 */
const createPluralEntry = (index: number): string =>
  [
    ...createComments(index),
    'msgid ' +
      quotePo(String(index) + ' translation item is waiting for review.'),
    'msgid_plural ' +
      quotePo(String(index) + ' translation items are waiting for review.'),
    'msgstr[0] ' + quotePo(String(index) + ' 件の翻訳項目がレビュー待ちです。'),
    'msgstr[1] ' + quotePo(String(index) + ' 件の翻訳項目がレビュー待ちです。'),
  ].join('\n')

/**
 * multiline を持つ entry を作る。
 *
 * @param index entry を識別する連番。
 * @returns PO の1 entry。
 */
const createMultilineEntry = (index: number): string =>
  [
    ...createComments(index),
    'msgid ""',
    quotePo(
      'Translation option ' +
        String(index) +
        ' controls the behavior shown to ',
    ),
    quotePo('administrators on the current WordPress site.'),
    'msgstr ""',
    quotePo(
      '翻訳オプション ' +
        String(index) +
        ' は現在のサイトで管理者に表示される ',
    ),
    quotePo('動作を設定します。'),
  ].join('\n')

/**
 * 指定 entry 数の realistic synthetic PO を生成する。
 *
 * @param entryCount 生成する翻訳 entry 数。
 * @returns browser benchmark と memory validation に利用する PO 文字列。
 */
export const generateSyntheticPo = (entryCount: number): string => {
  const entries: string[] = []

  // 実 PO に見られる複数の entry 形状を一定割合で混在させ、入力密度の偏りを避ける。
  for (let index = 0; index < entryCount; index += 1) {
    if (index % 10 === 0) {
      entries.push(createPluralEntry(index))
    } else if (index % 7 === 0) {
      entries.push(createMultilineEntry(index))
    } else {
      entries.push(createSingularEntry(index))
    }
  }

  return header + entries.join('\n\n') + '\n'
}
