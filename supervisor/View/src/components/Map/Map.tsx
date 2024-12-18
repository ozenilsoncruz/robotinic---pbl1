import { useEffect, useState } from "react";
import { Container, MapContainer, Obstacle, Robot } from "./styles";
import Button from "../Button";

type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Map component.
 */
function Map() {
  // TODO: Verificar a proporção do mapa e da vida real
  const mapLimits = {
    width: 816,
    height: 540,
  };

  const stationSize = {
    width: 20,
    height: 90,
  };

  const [robotPosition] = useState({
    x: 0,
    y: mapLimits.height / 2,
  });

  const [divisionLines, setDivisionLines] = useState<number[]>([]);

  // Os primeiros obstáculos são as estações
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    {
      x: 200,
      y: 0,
      width: stationSize.width,
      height: stationSize.height,
    },
    {
      x: 300,
      y: 0,
      width: stationSize.width,
      height: stationSize.height,
    },
    {
      x: 500,
      y: 0,
      width: stationSize.width,
      height: stationSize.height,
    },
    {
      x: 600,
      y: 0,
      width: stationSize.width,
      height: stationSize.height,
    },
    {
      x: 200,
      y: mapLimits.height - stationSize.height,
      width: stationSize.width,
      height: stationSize.height,
    },
    {
      x: 300,
      y: mapLimits.height - stationSize.height,
      width: stationSize.width,
      height: stationSize.height,
    },
    {
      x: 500,
      y: mapLimits.height - stationSize.height,
      width: stationSize.width,
      height: stationSize.height,
    },
    {
      x: 600,
      y: mapLimits.height - stationSize.height,
      width: stationSize.width,
      height: stationSize.height,
    },
  ]);

  function handleMapClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    const x = Number((event.clientX - rect.left).toFixed(2));
    const y = Number((event.clientY - rect.top).toFixed(2));
    const width = 30;
    const height = 20;
    const newObstacle = { x, y, width, height };

    setObstacles((prevObjects: Obstacle[]) => [...prevObjects, newObstacle]);
  }

  console.log(obstacles);
  console.log(divisionLines, "lines");
  useEffect(() => {
    /**
     * Gera linhas verticais para cada vértice dos obstáculos.
     */
    function generateVerticalLines(obstacles: Obstacle[]) {
      const verticalLinesSet = new Set<number>();

      obstacles.forEach((obstacle) => {
        if (obstacle.width && obstacle.height) {
          // Adiciona os vértices iniciais e finais
          verticalLinesSet.add(obstacle.x);
          verticalLinesSet.add(obstacle.x + obstacle.width);
        }
      });

      // Converte o Set para um Array e ordena os valores
      return Array.from(verticalLinesSet).sort((a, b) => a - b);
    }

    const lines = generateVerticalLines(obstacles);
    console.log(lines);
    console.log(obstacles, "obstacules");
    setDivisionLines(lines);
  }, [obstacles]);
  return (
    <Container>
      <MapContainer
        onClick={handleMapClick}
        style={{
          width: mapLimits.width,
          height: mapLimits.height,
        }}
      >
        {obstacles.map((object, index) => (
          <Obstacle
            key={index}
            style={{
              position: "absolute",
              left: `${object.x}px`,
              top: `${object.y}px`,
              width: `${object.width}px`,
              height: `${object.height}px`,
            }}
          />
        ))}
        {divisionLines.map((x, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: "0",
              width: "1px",
              height: `${mapLimits.height}px`,
              backgroundColor: "blue",
            }}
          />
        ))}
        <Robot
          style={{
            position: "absolute",
            left: `${robotPosition.x}px`,
            top: `${robotPosition.y}px`,
          }}
        />
      </MapContainer>
      <Button>Traçar Caminho</Button>
    </Container>
  );
}

export default Map;
