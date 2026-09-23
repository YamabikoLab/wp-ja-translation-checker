/**
 * PO Interpretation performance validation POC を production と同じブラウザー境界で配信する。
 *
 * production の Vite 設定を再利用し、gettext-converter の browser bundle 配信条件を
 * POC 側で複製しない。
 */
import { mergeConfig } from 'vite'
import productionConfig from '../../vite.config'

export default mergeConfig(productionConfig, {
  root: 'poc/po-interpretation-performance',
  build: {
    outDir: '../../dist/po-interpretation-performance',
    emptyOutDir: true,
  },
})
