import React, { useState, useRef } from 'react';
import VisualizeTSPmap from './components/visualizeTSPmap';
import LoaderSpinner from './components/loaderSpinner';
import { solve_tsp } from './algorithms/tspsolver';
import './App.css';

function App() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [heuristicType, setHeuristicType] = useState(null);
  const [cities, setCities] = useState([]);
  const [solution, setSolution] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = () => {
    const file = fileInputRef.current.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsedCities = parseCities(e.target.result);
        setCities(parsedCities);
        setIsFileUploaded(true);
        alert('File uploaded successfully');
      };
      reader.readAsText(file);
    }
  };

  const handleExampleUpload = async (filePath) => {
    setIsLoading(true);
    try {
      const response = await fetch(filePath);
      const text = await response.text();
      const parsedCities = parseCities(text);
      setCities(parsedCities);
      setIsFileUploaded(true);
      alert('Example file loaded successfully');
    } catch (error) {
      console.error("Error loading example file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCities = (fileContent) => {
    const lines = fileContent.split('\n');
    return lines
      .slice(lines.findIndex(line => line.includes('NODE_COORD_SECTION')) + 1)
      .filter(line => line && !line.includes('EOF'))
      .map(line => {
        const [, x, y] = line.trim().split(/\s+/);
        return { x: parseFloat(x), y: parseFloat(y) };
      });
  };

  const handleSolveTSP = () => {
    if (heuristicType && cities.length > 0) {
      setIsLoading(true);
      const solution = solve_tsp(cities, heuristicType);
      setSolution(solution);
      setIsLoading(false);
    }
  };

  const tspExamples = [
    { name: 'att48.tsp', filePath: './tspProblems/att48.tsp' },
    { name: 'ulysses16.tsp', filePath: './tspProblems/ulysses16.tsp' },
    { name: 'a280.tsp', filePath: './tspProblems/a280.tsp' }
  ];

  return (
    <div id="app" style={{ textAlign: 'center', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
      <h1>Traveling Salesman Problem</h1>
      <p>The Traveling Salesman Problem (TSP) requires a salesman to visit all cities exactly once and return to the starting city with minimal cost.</p>
      <p>We use the A* algorithm with two heuristic types: Minimum Spanning Tree (MST) and Ant Colony Optimization (ACO).</p>

      <div id="upload-section" style={{ marginBottom: '2vh' }}>
        <h2>Upload a TSP File</h2>
        <input type="file" ref={fileInputRef} accept=".tsp" className="file-upload-button" />
        <button onClick={handleUpload} style={{ marginLeft: '1vh' }}>Upload</button>
      </div>

      <div id="examples-section" style={{ marginBottom: '2vh' }}>
        <h2>Examples</h2>
        {tspExamples.map(example => (
          <button key={example.name} onClick={() => handleExampleUpload(example.filePath)} style={{ margin: '1vh' }}>
            {example.name}
          </button>
        ))}
      </div>

      {isFileUploaded && (
        <div style={{ width: '100%' }}>
          <div id="map-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1vh' }}>
            <VisualizeTSPmap cities={cities} />
          </div>

          <div style={{ marginTop: '2vh' }}>
            <h2>Choose a Heuristic Type</h2>
            <button onClick={() => setHeuristicType('mst')} style={{ marginRight: '1vh' }}>MST</button>
          </div>

          {heuristicType && (
            <div style={{ marginTop: '2vh' }}>
              <p>Heuristic Type: {heuristicType}</p>
              <button onClick={handleSolveTSP} style={{ marginTop: '1vh' }}>Solve TSP</button>
            </div>
          )}

          {isLoading && <LoaderSpinner />}

          {solution && !isLoading && (
            <div style={{ marginTop: '2vh' }}>
              <h3>Solution</h3>
              <div style={{ marginBottom: '1vh' }}>
                <p>Best Path: {solution.path.join(' -> ')}</p>
              </div>
              <p>Cost: {solution.totalCost}</p>
              <div id="map-solution-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1vh' }}>
                <VisualizeTSPmap cities={cities} solution={solution.path} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
