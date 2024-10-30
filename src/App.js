import React, {useState} from 'react';
import VisualizeTSPmap from './components/visualizeTSPmap';

function App() {

  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [cities, setCities] = useState([]);

  const handleUpload = () => {
    const file = document.getElementById('file').files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        let cities = [];
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('EOF')) {
            break;
          }
          if (lines[i].includes('NODE_COORD_SECTION')) {
            for (let j = i + 1; j < lines.length; j++) {
              if (lines[j].includes('EOF')) {
                break;
              }
              const city = lines[j].split(' ');
              cities.push({x: parseFloat(city[1]), y: parseFloat(city[2])});
            }
          }
        }
        setCities(cities);
        setIsFileUploaded(true);
        alert('File uploaded successfully');
      }
      reader.readAsText(file);
    }

  }

  return (
    <div id="app" style={{textAlign: 'center',height:'100vh',width:'100vw'}}>
      <h1>Traveling Salesman Problem</h1>
      <h5> it is a problem in which a salesman has to visit all the cities exactly once and return to the starting city with the minimum cost.</h5>
      <h5>for solving this problem we are going to use a* algorithim whith 2 heuristic types, ant colony and minimum tree expansion</h5>
      <div style={{height: '20vh',display: 'flex', flexDirection: 'column',justifyContent: 'space-around', alignItems: 'center'}}>
        <h1>Upload a TSP file</h1>
        <input type="file" id="file" name="file" accept=".tsp"></input>
        <button id="upload" onClick={() => handleUpload()}>upload</button>
      </div>

      {
        isFileUploaded && (
          <div style={{height: '40%',width:'100%',display:'flex',justifyContent:'center',alignItems:'center'}}>
            <VisualizeTSPmap cities={cities}/>
          </div>
        )
      }
    </div>
  );
}

export default App;
