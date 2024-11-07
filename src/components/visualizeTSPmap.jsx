import React, { useEffect, useRef } from "react";

function VisualizeTSPmap({ cities , solution }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (cities.length === 0) return;

        // Define scaling factors to fit cities within the canvas
        const padding = 30;
        const maxX = Math.max(...cities.map(city => city.x));
        const maxY = Math.max(...cities.map(city => city.y));
        const scale = Math.min(
            (canvas.width - padding * 2) / maxX,
            (canvas.height - padding * 2) / maxY
        );

        // Centering offset
        const offsetX = (canvas.width - maxX * scale) / 2;
        const offsetY = (canvas.height - maxY * scale) / 2;

        // Draw path between cities
        context.beginPath();
        context.strokeStyle = "lightgray";
        context.lineWidth = 2;
        cities.forEach((city, index) => {
            const x = city.x * scale + offsetX;
            const y = city.y * scale + offsetY;
            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        });
        context.closePath();
        context.stroke();

        // Draw each city as a circle on the canvas
        cities.forEach((city, index) => {
            const x = city.x * scale + offsetX;
            const y = city.y * scale + offsetY;

            // Draw city circle
            context.beginPath();
            context.arc(x, y, 5, 0, Math.PI * 2);
            context.fillStyle = index === 0 ? "red" : "blue";
            context.fill();
            context.strokeStyle = "black";
            context.stroke();

            // Label city index
            context.fillStyle = "black";
            context.font = "10px Arial";
            context.fillText(index + 1, x + 8, y + 3);
        });

        // Draw solution path, solution is ex: "0,1,2,3,4,5,6,7,8,9"
        if (solution) {
            context.beginPath();
            context.strokeStyle = "red";
            context.lineWidth = 2;
            const path = solution.map(char => parseInt(char));
            path.forEach((cityIndex, index) => {
                const x = cities[cityIndex].x * scale + offsetX;
                const y = cities[cityIndex].y * scale + offsetY;
                if (index === 0) {
                    context.moveTo(x, y);
                } else {
                    context.lineTo(x, y);
                }
            });
            context.closePath();
            context.stroke();
 
        }
    }, [cities,solution]);

    return (
        <div id="map-container" style={{width:'50%',height:'60vh'}}>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: "1px solid black", width: '100%', height: '100%' }}
            />
        </div>
    );
}

export default VisualizeTSPmap;
