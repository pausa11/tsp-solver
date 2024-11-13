import React, { useState, useRef, useEffect } from 'react';
import VisualizeTSPmap from './components/visualizeTSPmap';
import LoaderSpinner from './components/loaderSpinner';
import { solve_tspMST } from './algorithms/tspsolverMST';
import { solve_tspACO } from './algorithms/tspsolverACO';
import './App.css';

function App() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [heuristicType, setHeuristicType] = useState(null);
  const [cities, setCities] = useState([]);
  const [solution, setSolution] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isFileUploaded || heuristicType || solution) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isFileUploaded, heuristicType, solution]);

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
    if (heuristicType === 'mst' && cities.length > 0) {
      setIsLoading(true);
      const solution = solve_tspMST(cities);
      setSolution(solution);
      setIsLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    else if (heuristicType === 'aco' && cities.length > 0) {
      setIsLoading(true);
      const solution = solve_tspACO(cities);
      setSolution(solution);
      setIsLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    else {
      alert('Please select a heuristic type');
    }
  };

  const tspExamples = [
    { name: 'att48.tsp', filePath: './tspProblems/att48.tsp' },
    { name: 'ulysses16.tsp', filePath: './tspProblems/ulysses16.tsp' },
    { name: 'a280.tsp', filePath: './tspProblems/a280.tsp' }
  ];

  return (
    <div id="app" style={{ textAlign: 'center', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' ,padding:'1vh'}}>
      
        <div id='title' style={{width:'90%'}}>
          <h1>Traveling Salesman Problem</h1>
          <p>The Traveling Salesman Problem (TSP) requires a salesman to visit all cities exactly once and return to the starting city with minimal cost. We use the A* algorithm with two heuristic types: Minimum Spanning Tree (MST) and Ant Colony Optimization (ACO).</p>
        </div>

        <div id="upload-section">
          <h2>Upload a TSP File</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',flexDirection:'column',gap:'2vh' }}>
            <input type="file" ref={fileInputRef} accept=".tsp" className="file-upload-button" />
            <button onClick={handleUpload} style={{ marginLeft: '1vh' }}>Upload</button>
          </div>

        </div>

        <div id="examples-section">
          <h2>or use Examples</h2>
          {tspExamples.map(example => (
            <button key={example.name} onClick={() => handleExampleUpload(example.filePath)} style={{ margin: '1vh' }}>
              {example.name}
            </button>
          ))}
        </div>

        {isFileUploaded && (
          <div id='file-operations' style={{ width: '100%' }}>
            
            <div id="map-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1vh' }}>
              <VisualizeTSPmap cities={cities} />
            </div>

            <div id='heuristic-seletion' style={{ margin: '5vh' }}>
              <h2>Choose a Heuristic Type</h2>
              <button onClick={() => setHeuristicType('mst')} style={{ marginRight: '1vh' }}>MST</button>
              <button onClick={() => setHeuristicType('aco')} style={{ marginLeft: '1vh' }}>ACO</button>
            </div>

            {heuristicType && (
              <div id='heuristic' style={{ margin: '5vh' }}>
                <p>Heuristic Type: {heuristicType}</p>
                <button onClick={handleSolveTSP} >Solve TSP</button>
              </div>
            )}

            {isLoading && <LoaderSpinner />}

            {solution && !isLoading && (
              <div id='solution' style={{ padding: '3%', width:'95%',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center' }}>
                <h3>Solution</h3>
                <div>
                  <p>Best Path: {solution.path.join(' -> ')}</p>
                </div>
                <p>Cost: {solution.totalCost}</p>
                <div id="map-solution-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <VisualizeTSPmap cities={cities} solution={solution.path} />
                </div>
              </div>
            )}
          </div>)
        }
        <div ref={bottomRef} />
    </div>
  );
}

export default App;
