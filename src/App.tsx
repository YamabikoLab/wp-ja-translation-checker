import { useRef, useState } from 'react'
import './App.css'

type MockState = 'findings' | 'clean' | 'unknown-locale' | 'unsupported-locale'

const findings = [
  {
    severity: 'Error',
    title: '半角文字と全角文字の間に不要なスペースがあります',
    translation: 'プラグイン を有効化',
    reason:
      '日本語と半角英数字の間には、原則としてスペースを入れません。',
    guide: '1-4 半角文字と全角文字の間のスペース',
    source: null,
  },
  {
    severity: 'Error',
    title: '推奨されていない表記があります',
    translation: '全ての設定を保存',
    reason: '「全て」ではなく「すべて」が推奨されています。',
    guide: '3-6 推奨表記',
    source: null,
  },
  {
    severity: 'Warning',
    title: '「View XX」の訳し方を確認してください',
    translation: '投稿を見る',
    source: 'View posts',
    reason:
      'この表現は「〜を表示（する）」に統一するルールの対象になる可能性があります。文脈を確認してください。',
    guide: '3-2 View XX の表現',
  },
]

function App() {
  const [selectedFile, setSelectedFile] = useState('sample-ja.po')
  const [mockState, setMockState] = useState<MockState>('findings')
  const resultRef = useRef<HTMLDivElement>(null)

  const handleCheck = () => {
    requestAnimationFrame(() => {
      resultRef.current?.focus()
    })
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">WordPress translation utility</p>
          <h1>WP Japanese Translation Checker</h1>
          <p className="lead">
            WordPress 日本語翻訳スタイルガイドの機械判定可能な項目を、
            .po ファイルで確認します。
          </p>
        </div>
        <a
          className="guide-link"
          href="https://ja.wordpress.org/team/handbook/translation/translation-style-guide/"
          target="_blank"
          rel="noreferrer"
        >
          スタイルガイドを開く
        </a>
      </header>

      <main className="layout">
        <section className="panel input-panel" aria-labelledby="input-heading">
          <div className="section-heading">
            <div>
              <span className="step">1</span>
              <h2 id="input-heading">.po ファイルを選択</h2>
            </div>
            <p>
              選択した翻訳内容はブラウザー内で処理し、確認のために外部サービスへ送信しません。
            </p>
          </div>

          <div className="file-card">
            <div className="file-icon" aria-hidden="true">
              PO
            </div>
            <div className="file-meta">
              <strong>{selectedFile}</strong>
              <span>日本語翻訳ファイル</span>
            </div>
            <label className="secondary-button">
              ファイルを選び直す
              <input
                className="visually-hidden"
                type="file"
                accept=".po,text/plain"
                onChange={(event) => {
                  const next = event.target.files?.[0]
                  if (next) {
                    setSelectedFile(next.name)
                  }
                }}
              />
            </label>
          </div>

          <div className="mock-controls" aria-label="モック表示状態">
            <span>モック状態</span>
            <div className="segmented-control">
              <button
                type="button"
                aria-pressed={mockState === 'findings'}
                onClick={() => setMockState('findings')}
              >
                指摘あり
              </button>
              <button
                type="button"
                aria-pressed={mockState === 'clean'}
                onClick={() => setMockState('clean')}
              >
                問題なし
              </button>
              <button
                type="button"
                aria-pressed={mockState === 'unknown-locale'}
                onClick={() => setMockState('unknown-locale')}
              >
                ロケール不明
              </button>
              <button
                type="button"
                aria-pressed={mockState === 'unsupported-locale'}
                onClick={() => setMockState('unsupported-locale')}
              >
                未対応ロケール
              </button>
            </div>
          </div>

          <button type="button" className="primary-button" onClick={handleCheck}>
            翻訳を確認する
          </button>
        </section>

        <section className="panel result-panel" aria-labelledby="result-heading">
          <div className="section-heading result-heading-wrap">
            <div>
              <span className="step">2</span>
              <h2 id="result-heading">確認結果</h2>
            </div>
            <span className="locale-chip">
              Locale:{' '}
              {mockState === 'unsupported-locale'
                ? 'fr_FR'
                : mockState === 'unknown-locale'
                  ? '判定不能'
                  : 'ja'}
            </span>
          </div>

          <div ref={resultRef} tabIndex={-1} className="result-focus-target">
            {mockState === 'findings' && (
              <>
                <div className="summary-card">
                  <div>
                    <p className="summary-kicker">確認が完了しました</p>
                    <h3>3件の確認項目があります</h3>
                    <p>
                      Error は高い確度で問題と判断できる指摘、Warning
                      は人による確認が必要な指摘です。
                    </p>
                  </div>
                  <div className="summary-counts" aria-label="確認結果件数">
                    <div className="count-box error-count">
                      <span>Error</span>
                      <strong>2</strong>
                    </div>
                    <div className="count-box warning-count">
                      <span>Warning</span>
                      <strong>1</strong>
                    </div>
                  </div>
                </div>

                <div className="findings-list" aria-label="指摘一覧">
                  {findings.map((finding, index) => (
                    <article
                      className="finding-card"
                      key={finding.title}
                      aria-labelledby={`finding-${index}`}
                    >
                      <div className="finding-topline">
                        <span
                          className={`severity severity-${finding.severity.toLowerCase()}`}
                        >
                          {finding.severity}
                        </span>
                        <span className="finding-number">#{index + 1}</span>
                      </div>

                      <h3 id={`finding-${index}`}>{finding.title}</h3>

                      <dl className="finding-details">
                        {finding.source && (
                          <div>
                            <dt>原文</dt>
                            <dd>{finding.source}</dd>
                          </div>
                        )}
                        <div>
                          <dt>翻訳</dt>
                          <dd>{finding.translation}</dd>
                        </div>
                        <div>
                          <dt>判定理由</dt>
                          <dd>{finding.reason}</dd>
                        </div>
                      </dl>

                      <div className="guide-row">
                        <div>
                          <span>スタイルガイド</span>
                          <strong>{finding.guide}</strong>
                        </div>
                        <a
                          href="https://ja.wordpress.org/team/handbook/translation/translation-style-guide/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          根拠を確認
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {mockState === 'clean' && (
              <div className="state-card success-state">
                <div className="state-icon" aria-hidden="true">
                  ✓
                </div>
                <div>
                  <p className="summary-kicker">確認が完了しました</p>
                  <h3>v1 の対象ルールでは問題は検出されませんでした</h3>
                  <p>
                    この結果は、翻訳全体が完全に正しいことを保証するものではありません。
                    最終確認では WordPress 日本語翻訳スタイルガイドも参照してください。
                  </p>
                </div>
              </div>
            )}

            {mockState === 'unknown-locale' && (
              <div className="state-card neutral-state">
                <div className="state-icon" aria-hidden="true">
                  ?
                </div>
                <div>
                  <p className="summary-kicker">確認を実行できませんでした</p>
                  <h3>対象ロケールを判定できません</h3>
                  <p>
                    .po ファイルから翻訳ロケールを特定できませんでした。
                    ロケール情報を含む別の .po ファイルを選択してください。
                  </p>
                </div>
              </div>
            )}

            {mockState === 'unsupported-locale' && (
              <div className="state-card neutral-state">
                <div className="state-icon" aria-hidden="true">
                  !
                </div>
                <div>
                  <p className="summary-kicker">確認を実行できませんでした</p>
                  <h3>このロケールにはまだ対応していません</h3>
                  <p>
                    検出されたロケール: <strong>fr_FR</strong>
                  </p>
                  <p>v1 では日本語（ja）の翻訳のみ確認できます。</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          WJTC はスタイルガイドの機械判定可能部分を提出前に確認するためのツールです。
        </p>
      </footer>
    </div>
  )
}

export default App
