import React from "react";
import { ReactRichPainter } from "./lib";

function App() {

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactRichPainter width={800} height={600} preset="notebook" onUpdate={(state) => {
        console.log(state.version)
      }} />
    </div>
  )
}

export default App
