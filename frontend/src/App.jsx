import React from 'react';
import MapComponent from './Map.jsx';
import RightBar from './RightBar.jsx';
import TypingLoader from './TypingLoader.jsx';
function App() {
  return (
    <div className="App">
      <TypingLoader/>
      <RightBar/>
      <MapComponent />
    </div>
  );
}

export default App;
