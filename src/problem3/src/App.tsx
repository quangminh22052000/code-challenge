import "./App.css";
import WalletComparisonDemo from "./components/WalletDemo";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Problem 3: React Optimization Demo</h1>
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          <WalletComparisonDemo />
        </div>
      </header>
    </div>
  );
}

export default App;
