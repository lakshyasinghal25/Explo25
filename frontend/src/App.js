import AlignmentInterface from "./components/AlignmentInterface";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <header className="App-header">
          <h1>Alignment Interface</h1>
        </header>
        <AlignmentInterface />
      </div>
    </DndProvider>
  );
}

export default App;
