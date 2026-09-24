/**
 * WTC のアプリケーションルートを構成する。
 *
 * 画面固有の確認状態と操作は Presentation 責務へ委譲し、この入口では表示対象だけを決定する。
 */

import { TranslationChecker } from './presentation/TranslationChecker'

/**
 * WTC のルートコンポーネント。
 *
 * @returns 翻訳確認画面。
 */
function App() {
  return <TranslationChecker />
}

export default App
