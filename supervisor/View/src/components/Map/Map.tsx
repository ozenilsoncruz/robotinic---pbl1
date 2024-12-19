import { useEffect, useState, useCallback, useRef } from "react";
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
    width: 5,
    height: 90,
  };

  const [robotPosition, setRobotPosition] = useState({
    x: 0,
    y: mapLimits.height / 2,
  });

  const [divisionLines, setDivisionLines] = useState<number[]>([]);

  // Estados para gerenciar o arrasto
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [robotStart, setRobotStart] = useState({ x: 0, y: 0 });

  // Estado para rastrear se um drag ocorreu
  const dragOccurredRef = useRef(false);

  // Os primeiros obstáculos são as estações
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { // obstáculo da parede esquerda da estação superior 1
      x: 200,
      y: 0,
      width: stationSize.width,
      height: stationSize.height,
    },
    { // obstáculo da parede direita da estação superior 1
      x: 300,
      y: 0,
      width: stationSize.width,
      height: stationSize.height,
    },
    { // obstáculo da parede esquerda da estação superior 2
      x: 500,
      y: 0,
      width: stationSize.width,
      height: stationSize.height,
    },
    { // obstáculo da parede direita da estação superior 2
      x: 600,
      y: 0,
      width: stationSize.width,
      height: stationSize.height,
    },
    { // obstáculo da parede esquerda da estação inferior 1
      x: 200,
      y: mapLimits.height - stationSize.height,
      width: stationSize.width,
      height: stationSize.height,
    },
    { // obstáculo da parede direita da estação inferior 1
      x: 300,
      y: mapLimits.height - stationSize.height,
      width: stationSize.width,
      height: stationSize.height,
    },
    { // obstáculo da parede esquerda da estação inferior 2
      x: 500,
      y: mapLimits.height - stationSize.height,
      width: stationSize.width,
      height: stationSize.height,
    },
    { // obstáculo da parede direita da estação inferior 2
      x: 600,
      y: mapLimits.height - stationSize.height,
      width: stationSize.width,
      height: stationSize.height,
    },
  ]);

  function handleMapClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // Se um drag ocorreu, não adicionar obstáculo
    if (dragOccurredRef.current) {
      dragOccurredRef.current = false; // Resetar a flag
      return;
    }

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = Number((event.clientX - rect.left).toFixed(2));
    const y = Number((event.clientY - rect.top).toFixed(2));
    const width = 10;
    const height = 10;
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

  // Handlers para arrastar o robô
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation(); // Evita que o click no robô adicione um obstáculo
    event.preventDefault(); // Previne comportamentos padrão

    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    setRobotStart({ ...robotPosition });
    dragOccurredRef.current = false;
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;

      let newX = robotStart.x + deltaX;
      let newY = robotStart.y + deltaY;

      // Garantir que o robô permaneça dentro dos limites do mapa
      newX = Math.max(0, Math.min(newX, mapLimits.width));
      newY = Math.max(0, Math.min(newY, mapLimits.height));

      // Verificar se houve movimento significativo para considerar como drag
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        dragOccurredRef.current = true;
      }

      setRobotPosition({ x: newX, y: newY });
    },
    [isDragging, dragStart, robotStart, mapLimits.width, mapLimits.height]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handler de click no Robot para evitar propagação
  const handleRobotClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();
  };

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
          onMouseDown={handleMouseDown}
          onClick={handleRobotClick}
          style={{
            position: "absolute",
            left: `${robotPosition.x}px`,
            top: `${robotPosition.y}px`,
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
        />
      </MapContainer>
      <Button>Traçar Caminho</Button>
    </Container>
  );
}

export default Map;
