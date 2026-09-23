const quotePo = (value: string): string => JSON.stringify(value)

const header = [
  'msgid ""',
  'msgstr ""',
  '"Project-Id-Version: wjtc-benchmark\\n"',
  '"Language: ja\\n"',
  '"Content-Type: text/plain; charset=UTF-8\\n"',
  '"Plural-Forms: nplurals=2; plural=(n != 1);\\n"',
  '',
].join('\n')

const createSingularEntry = (index: number): string =>
  [
    `msgid ${quotePo(`entry-${index}`)}`,
    `msgstr ${quotePo(`翻訳-${index}`)}`,
  ].join('\n')

const createPluralEntry = (index: number): string =>
  [
    `msgid ${quotePo(`item-${index}`)}`,
    `msgid_plural ${quotePo(`items-${index}`)}`,
    `msgstr[0] ${quotePo(`項目-${index}`)}`,
    `msgstr[1] ${quotePo(`複数項目-${index}`)}`,
  ].join('\n')

const createMultilineEntry = (index: number): string =>
  [
    'msgid ""',
    quotePo(`multiline-${index}-part-a `),
    quotePo('part-b'),
    'msgstr ""',
    quotePo(`複数行-${index}-前半 `),
    quotePo('後半'),
  ].join('\n')

export const generateSyntheticPo = (entryCount: number): string => {
  const entries: string[] = []

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
