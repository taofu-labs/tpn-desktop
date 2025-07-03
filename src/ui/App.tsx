import "./App.css";

function App() {
  const showAlert = () => {
    window.electron.test();
  };

  const showConfirm = () => {
    if (window.confirm("Are you sure?")) {
      alert("Confirmed!");
    } else {
      alert("Cancelled!");
    }
  };

  return (
    <>
      <div>
        <h1>Welcome to TPN GUI</h1>
        <p>This is a simple Electron application.</p>
        <button onClick={showAlert}>Show Alert</button>
        <button onClick={showConfirm}>Show Confirm</button>
      </div>
    </>
  );
}

export default App;
