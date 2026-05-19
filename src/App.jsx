import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>🎓 카테고리 학습 웹사이트</h1>
      <p>환영합니다!</p>
      <Analytics />
    </div>
  )
}

export default App