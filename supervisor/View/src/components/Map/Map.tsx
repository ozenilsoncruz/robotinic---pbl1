import { useState } from "react";
import {
  MapContainer,
  Obstacle,
  Robot,
  StationDown,
  StationUp,
} from "./styles";

type ObstaclesPosition = {
  x: number;
  y: number;
};

/**
 * Map component.
 */
function Map() {
  const [obstacles, setObstacles] = useState<ObstaclesPosition[]>([]);

  function handleMapClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    const x = Number((event.clientX - rect.left).toFixed(2));
    const y = Number((event.clientY - rect.top).toFixed(2));
    const newObstacle = { x, y };

    setObstacles((prevObjects: ObstaclesPosition[]) => [
      ...prevObjects,
      newObstacle,
    ]);
  }

  console.log(obstacles);

  return (
    <MapContainer onClick={handleMapClick}>
      {obstacles.map((object, index) => (
        <Obstacle
          key={index}
          style={{
            position: "absolute",
            left: `${object.x}px`,
            top: `${object.y}px`,
          }}
        />
      ))}
      <StationUp
        style={{
          top: "20px",
          left: "200px",
        }}
      />
      <StationUp
        style={{
          top: "20px",
          right: "200px",
        }}
      />
      <StationDown
        style={{
          bottom: "20px",
          left: "200px",
        }}
      />
      <StationDown
        style={{
          bottom: "20px",
          right: "200px",
        }}
      />
      <Robot />
    </MapContainer>
  );
}

export default Map;
