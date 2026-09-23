const correctnessStatus = document.querySelector('#correctness-status')
const runButton = document.querySelector<HTMLButtonElement>('#run-benchmark')

void import('./main').catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error)

  if (correctnessStatus) {
    correctnessStatus.textContent = `FAIL: POC module load — ${detail}`
  }

  if (runButton) {
    runButton.disabled = true
  }

  console.error('PO parser benchmark POC の読み込みに失敗しました。', error)
})
