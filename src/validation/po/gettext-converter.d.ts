/**
 * PO Interpretation の contract test から production dependency の parser を直接利用するための型宣言。
 *
 * 製品コードの公開契約ではなく、gettext-converter が公開する po2js entry point の最小型だけを表す。
 */
declare module 'gettext-converter/po2js' {
  /**
   * PO 文字列を gettext-converter 固有の解析結果へ変換する。
   *
   * @param source PO ファイル内容の文字列。
   * @returns parser 固有の解析結果。
   */
  const po2js: (source: string) => unknown

  export default po2js
}
