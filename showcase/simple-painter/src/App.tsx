import { ReactRichPainter } from 'react-rich-painter'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Simple Painter</h1>
        <p className="subtitle">Powered by react-rich-painter</p>
      </header>
      <main className="painter-wrapper">
        <ReactRichPainter
          autoSize={true}
          preset="painting"
          toolbar={true}
          brushbar={true}
          defaultCustomBrush={true}
          backgroundSize={20}
        />
      </main>
      <footer className="app-footer">
        <a 
          href="https://github.com/foasho/react-rich-painter" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <span className="separator">•</span>
        <a 
          href="https://www.npmjs.com/package/react-rich-painter" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          npm
        </a>
      </footer>
    </div>
  )
}

export default App
