function App() {
  const showAlert = async () => {
    console.log(await window.electron.getCountries());
  };

  const showConfirm = () => {
    if (window.confirm("Are you sure?")) {
      alert("Confirmed!");
    } else {
      alert("Cancelled!");
    }
  };

  return (
    <div className="w-full h-[100vh] flex items-center justify-center bg-white text-black">
      <div className="text-center">
        <h1 className="text-6xl mb-5">Welcome to TPN GUI</h1>
        <p className="mb-4">This is a simple Electron application.</p>
        <button className="bg-[#1a1a1a] cursor-pointer rounded p-2 mr-2 text-white mt-2"  onClick={showAlert}>Show Alert</button>
        <button className="bg-[#1a1a1a] cursor-pointer rounded p-2 mr-2 text-white mt-2" onClick={showConfirm}>Show Confirm</button>
      </div>
    </div>
  );
}

export default App;
