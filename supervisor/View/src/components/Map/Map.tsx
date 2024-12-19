// Map.tsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Container,
  MapContainer,
  Obstacle,
  Robot,
  PathLine,
  PathSVG,
  StyledSelect,
} from "./styles";
import Button from "../Button";

// Tipos para obstáculos, estações e células
type ObstacleType = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type StationType = {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
};

type CellType = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  neighbors: number[]; // IDs das células vizinhas
};

type NodeType = {
  cellId: number;
  g: number; // Custo do início até este nó
  h: number; // Heurística (distância até o destino)
  f: number; // f = g + h
  parent: number | null; // ID do nó pai
};

function Map() {
  // Limites do mapa
  const mapLimits = {
    width: 816,
    height: 540,
  };

  const stationWallSize = {
    width: 5,
    height: 90,
  };

  // Estado da posição do robô
  const [robotPosition, setRobotPosition] = useState({
    x: 40, // Inicialmente centralizado no mapa
    y: mapLimits.height / 2,
  });

  // Linhas de divisão verticais
  const [divisionLines, setDivisionLines] = useState<number[]>([]);

  // Estado para gerenciar o arrasto do robô
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [robotStart, setRobotStart] = useState({ x: 0, y: 0 });

  // Estado para rastrear se um drag ocorreu
  const dragOccurredRef = useRef(false);

  // Obstáculos iniciais (paredes das estações)
  const [obstacles, setObstacles] = useState<ObstacleType[]>([
    // Estação superior 1 (paredes)
    {
      x: 200,
      y: 0,
      width: stationWallSize.width,
      height: stationWallSize.height,
    },
    {
      x: 300,
      y: 0,
      width: stationWallSize.width,
      height: stationWallSize.height,
    },

    // Estação superior 2 (paredes)
    {
      x: 500,
      y: 0,
      width: stationWallSize.width,
      height: stationWallSize.height,
    },
    {
      x: 600,
      y: 0,
      width: stationWallSize.width,
      height: stationWallSize.height,
    },

    // Estação inferior 1 (paredes)
    {
      x: 200,
      y: mapLimits.height - stationWallSize.height,
      width: stationWallSize.width,
      height: stationWallSize.height,
    },
    {
      x: 300,
      y: mapLimits.height - stationWallSize.height,
      width: stationWallSize.width,
      height: stationWallSize.height,
    },

    // Estação inferior 2 (paredes)
    {
      x: 500,
      y: mapLimits.height - stationWallSize.height,
      width: stationWallSize.width,
      height: stationWallSize.height,
    },
    {
      x: 600,
      y: mapLimits.height - stationWallSize.height,
      width: stationWallSize.width,
      height: stationWallSize.height,
    },
  ]);

  // Estado para estações
  const [stations, setStations] = useState<StationType[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");

  // Estado para células e caminho
  const [cells, setCells] = useState<CellType[]>([]);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);

  // Estado para controle das linhas de divisão verticais
  const [showDivisionLines, setShowDivisionLines] = useState<boolean>(true);

  // Memorizar obstáculos a partir da posição do robô para evitar re-renderizações desnecessárias
  const filteredObstacles = useMemo(() => {
    return obstacles.filter((obs) => obs.x + obs.width >= robotPosition.x);
  }, [obstacles, robotPosition.x]);

  const [pathMode, setPathMode] = useState<"neighbors" | "all">("neighbors");

  // ---- WEBSOCKET ----
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Estabelece a conexão WebSocket com o servidor Python
    const ws = new WebSocket("ws://localhost:8000/ws/position");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Conexão WebSocket estabelecida com o servidor.");
      // Poderíamos enviar uma mensagem inicial se necessário
      // ws.send("mensagem inicial");
    };

    ws.onmessage = (event) => {
      // O servidor Python enviará as posições atualizadas do robô em JSON:
      // Ex: { "x": 100.23, "y": 200.45 }
      try {
        const data = JSON.parse(event.data);
        if (data.x !== undefined && data.y !== undefined) {
          setRobotPosition({ x: data.x, y: data.y });
        }
      } catch (error) {
        console.error("Falha ao analisar a mensagem do servidor:", error);
      }
    };

    ws.onclose = () => {
      console.log("Conexão WebSocket fechada.");
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Função para adicionar novos obstáculos ao clicar no mapa
  function handleMapClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // Se um drag ocorreu, não adicionar obstáculo
    if (dragOccurredRef.current) {
      dragOccurredRef.current = false; // Resetar a flag
      return;
    }

    const rect = (
      event.currentTarget as HTMLDivElement
    ).getBoundingClientRect();
    const x = Number((event.clientX - rect.left).toFixed(2));
    const y = Number((event.clientY - rect.top).toFixed(2));
    const width = 10;
    const height = 10;

    // Verificar se o ponto está dentro de alguma estação
    const isInsideStation = stations.some((station) => {
      return (
        x >= station.x &&
        x <= station.x + station.width &&
        y >= station.y &&
        y <= station.y + station.height
      );
    });

    if (isInsideStation) {
      alert("Não é permitido adicionar obstáculos dentro das estações.");
      return;
    }

    const newObstacle = { x, y, width, height };

    setObstacles((prevObjects: ObstacleType[]) => [
      ...prevObjects,
      newObstacle,
    ]);
  }

  // Geração das linhas verticais
  useEffect(() => {
    function generateVerticalLines(obstacles: ObstacleType[]) {
      const verticalLinesSet = new Set<number>();

      obstacles.forEach((obstacle) => {
        if (obstacle.width && obstacle.height) {
          verticalLinesSet.add(obstacle.x);
          verticalLinesSet.add(obstacle.x + obstacle.width);
        }
      });

      return Array.from(verticalLinesSet).sort((a, b) => a - b);
    }

    const lines = generateVerticalLines(filteredObstacles);
    setDivisionLines(lines);
  }, [filteredObstacles]);

  // Handlers para arrastar o robô
  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
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

      // Verificar colisão com obstáculos
      const robotRadius = 20; // Ajustado para o tamanho do robô (40px de diâmetro)
      const collision = obstacles.some((obstacle) => {
        const closestX = Math.max(
          obstacle.x,
          Math.min(newX, obstacle.x + obstacle.width)
        );
        const closestY = Math.max(
          obstacle.y,
          Math.min(newY, obstacle.y + obstacle.height)
        );
        const distance = Math.hypot(newX - closestX, newY - closestY);
        return distance < robotRadius;
      });

      if (!collision) {
        setRobotPosition({ x: newX, y: newY });
      }
    },
    [
      isDragging,
      dragStart,
      robotStart,
      mapLimits.width,
      mapLimits.height,
      obstacles,
    ]
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
  const handleRobotClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation();
  };

  // Identificação das estações com base nos primeiros 8 obstáculos
  useEffect(() => {
    // Supondo que as estações são formadas pelos primeiros 8 obstáculos, em pares:
    // [0,1] = estação superior 1
    // [2,3] = estação superior 2
    // [4,5] = estação inferior 1
    // [6,7] = estação inferior 2

    function createStationPair(
      obst1: ObstacleType,
      obst2: ObstacleType,
      name: string
    ): StationType {
      // Estação é a área livre ENTRE os obstáculos verticais
      const left = obst1.x + obst1.width;
      const right = obst2.x;
      const width = right - left;
      const top = obst1.y;
      const height = obst1.height;

      return {
        x: left,
        y: top,
        width,
        height,
        name,
      };
    }

    const newStations: StationType[] = [];
    if (obstacles.length >= 8) {
      // Estação Superior 1
      newStations.push(
        createStationPair(obstacles[0], obstacles[1], "Estação Superior 1")
      );
      // Estação Superior 2
      newStations.push(
        createStationPair(obstacles[2], obstacles[3], "Estação Superior 2")
      );
      // Estação Inferior 1
      newStations.push(
        createStationPair(obstacles[4], obstacles[5], "Estação Inferior 1")
      );
      // Estação Inferior 2
      newStations.push(
        createStationPair(obstacles[6], obstacles[7], "Estação Inferior 2")
      );
    }

    setStations(newStations);
  }, [obstacles]);

  const handleSelectStation = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStation(event.target.value);
  };

  type Rectangle = { x: number; y: number; width: number; height: number };
  type Line = { x1: number; y1: number; x2: number; y2: number };

  // Função para realizar a decomposição em células exatas
  useEffect(() => {
    // Verifica se duas linhas se intersectam.
    function linesIntersect(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number,
      x4: number,
      y4: number
    ): boolean {
      // Verifica a orientação de três pontos (A, B, C) para determinar se eles estão em sentido anti-horário.
      function isCounterClockwise(
        ax: number,
        ay: number,
        bx: number,
        by: number,
        cx: number,
        cy: number
      ): boolean {
        return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
      }

      return (
        isCounterClockwise(x1, y1, x3, y3, x4, y4) !==
          isCounterClockwise(x2, y2, x3, y3, x4, y4) &&
        isCounterClockwise(x1, y1, x2, y2, x3, y3) !==
          isCounterClockwise(x1, y1, x2, y2, x4, y4)
      );
    }

    // Verifica se uma linha intersecta um retângulo.
    function lineIntersectsRectangle(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      rect: Rectangle
    ): boolean {
      const { x, y, width, height } = rect;

      // Retas do retângulo
      const rectLines: Line[] = [
        { x1: x, y1: y, x2: x + width, y2: y },
        { x1: x, y1: y, x2: x, y2: y + height },
        { x1: x + width, y1: y, x2: x + width, y2: y + height },
        { x1: x, y1: y + height, x2: x + width, y2: y + height },
      ];

      // Verificar se a linha (x1, y1, x2, y2) cruza alguma das linhas do retângulo
      return rectLines.some((line) =>
        linesIntersect(x1, y1, x2, y2, line.x1, line.y1, line.x2, line.y2)
      );
    }

    function exactCellDecomposition(
      divisionLines: number[],
      obstacles: ObstacleType[],
      mapWidth: number,
      mapHeight: number
    ): CellType[] {
      const cells: CellType[] = [];
      let cellId = 0;

      // Adicionar linhas de borda do mapa
      const allVerticalLines = [0, ...divisionLines, mapWidth].sort(
        (a, b) => a - b
      );

      for (let i = 0; i < allVerticalLines.length - 1; i++) {
        const x1 = allVerticalLines[i];
        const x2 = allVerticalLines[i + 1];
        const width = x2 - x1;

        const relevantObstacles = obstacles.filter(
          (obs) => !(obs.x + obs.width <= x1) && !(obs.x >= x2)
        );

        const horizontalLinesSet = new Set<number>();
        horizontalLinesSet.add(0);
        horizontalLinesSet.add(mapHeight);

        relevantObstacles.forEach((obs) => {
          horizontalLinesSet.add(obs.y);
          horizontalLinesSet.add(obs.y + obs.height);
        });

        const allHorizontalLines = Array.from(horizontalLinesSet).sort(
          (a, b) => a - b
        );

        for (let j = 0; j < allHorizontalLines.length - 1; j++) {
          const y1 = allHorizontalLines[j];
          const y2 = allHorizontalLines[j + 1];
          const height = y2 - y1;

          const cellRect = { x: x1, y: y1, width, height };

          const isFree = !obstacles.some((obs) => {
            return (
              obs.x < cellRect.x + cellRect.width &&
              obs.x + obs.width > cellRect.x &&
              obs.y < cellRect.y + cellRect.height &&
              obs.y + obs.height > cellRect.y
            );
          });

          if (isFree) {
            cells.push({
              id: cellId,
              x: x1,
              y: y1,
              width,
              height,
              neighbors: [],
            });
            cellId++;
          }
        }
      }

      if (pathMode === "neighbors") {
        cells.forEach((cell) => {
          cells.forEach((otherCell) => {
            if (cell.id === otherCell.id) return;

            const adjacent =
              ((cell.x + cell.width === otherCell.x ||
                otherCell.x + otherCell.width === cell.x) &&
                !(
                  cell.y + cell.height <= otherCell.y ||
                  otherCell.y + otherCell.height <= cell.y
                )) ||
              ((cell.y + cell.height === otherCell.y ||
                otherCell.y + otherCell.height === cell.y) &&
                !(
                  cell.x + cell.width <= otherCell.x ||
                  otherCell.x + otherCell.width <= cell.x
                ));

            if (adjacent) {
              const lineStart = {
                x: cell.x + cell.width / 2,
                y: cell.y + cell.height / 2,
              };
              const lineEnd = {
                x: otherCell.x + otherCell.width / 2,
                y: otherCell.y + otherCell.height / 2,
              };

              // Verificar se o caminho entre as células cruza algum obstáculo
              const crossesObstacle = obstacles.some((obstacle) =>
                lineIntersectsRectangle(
                  lineStart.x,
                  lineStart.y,
                  lineEnd.x,
                  lineEnd.y,
                  obstacle
                )
              );

              if (!crossesObstacle) {
                cell.neighbors.push(otherCell.id);
              }
            }
          });
        });
      } else if (pathMode === "all") {
        cells.forEach((cell) => {
          cells.forEach((otherCell) => {
            if (cell.id !== otherCell.id) {
              const cellCenter = {
                x: cell.x + cell.width / 2,
                y: cell.y + cell.height / 2,
              };
              const otherCellCenter = {
                x: otherCell.x + otherCell.width / 2,
                y: otherCell.y + otherCell.height / 2,
              };

              // Verificar se a linha entre os centros cruza obstáculos
              const intersects = obstacles.some((obs) =>
                lineIntersectsRectangle(
                  cellCenter.x,
                  cellCenter.y,
                  otherCellCenter.x,
                  otherCellCenter.y,
                  obs
                )
              );

              if (!intersects) {
                cell.neighbors.push(otherCell.id);
              }
            }
          });
        });
      }

      return cells;
    }

    const generatedCells = exactCellDecomposition(
      divisionLines,
      filteredObstacles,
      mapLimits.width,
      mapLimits.height
    );

    setCells(generatedCells);
  }, [
    divisionLines,
    filteredObstacles,
    mapLimits.width,
    mapLimits.height,
    pathMode,
  ]);

  // Função para encontrar a célula que contém um ponto
  function findCellContainingPoint(
    point: { x: number; y: number },
    cells: CellType[]
  ): CellType | null {
    return (
      cells.find(
        (cell) =>
          point.x >= cell.x &&
          point.x <= cell.x + cell.width &&
          point.y >= cell.y &&
          point.y <= cell.y + cell.height
      ) || null
    );
  }

  // Função heurística (distância Euclidiana)
  function heuristic(a: CellType, b: CellType): number {
    const aCenter = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const bCenter = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    return Math.hypot(aCenter.x - bCenter.x, aCenter.y - bCenter.y);
  }

  // Função para calcular a distância entre duas células
  function distance(a: CellType, b: CellType): number {
    const aCenter = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const bCenter = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    return Math.hypot(aCenter.x - bCenter.x, aCenter.y - bCenter.y);
  }

  // Função de pathfinding usando A*
  function aStar(
    cells: CellType[],
    startCell: CellType,
    endCell: CellType
  ): CellType[] | null {
    const openSet: NodeType[] = [];
    const closedSet: Set<number> = new Set();
    const cameFrom: { [key: number]: number } = {};

    // Inicializar o open set com o nó inicial
    openSet.push({
      cellId: startCell.id,
      g: 0,
      h: heuristic(startCell, endCell),
      f: heuristic(startCell, endCell),
      parent: null,
    });

    // Mapa para armazenar os melhores g para cada célula
    const gScores: { [key: number]: number } = {};
    gScores[startCell.id] = 0;

    while (openSet.length > 0) {
      // Encontrar o nó com menor f no open set
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      // Se chegamos ao destino
      if (current.cellId === endCell.id) {
        // Reconstituir o caminho
        const path: CellType[] = [];
        let currentId = current.cellId;

        while (
          currentId !== null &&
          Object.prototype.hasOwnProperty.call(cameFrom, currentId)
        ) {
          const cell = cells.find((c) => c.id === currentId);
          if (cell) path.push(cell);
          currentId = cameFrom[currentId];
        }

        // Adicionar a célula inicial se ainda não estiver no caminho
        const startPathCell = cells.find((c) => c.id === startCell.id);
        if (startPathCell && !path.includes(startPathCell)) {
          path.push(startPathCell);
        }

        path.reverse();
        return path;
      }

      closedSet.add(current.cellId);

      // Para cada vizinho
      const currentCell = cells.find((c) => c.id === current.cellId)!;
      currentCell.neighbors.forEach((neighborId) => {
        if (closedSet.has(neighborId)) return;

        const neighborCell = cells.find((c) => c.id === neighborId)!;
        const tentativeG = current.g + distance(currentCell, neighborCell);

        if (
          !Object.prototype.hasOwnProperty.call(gScores, neighborId) ||
          tentativeG < gScores[neighborId]
        ) {
          cameFrom[neighborId] = current.cellId;
          gScores[neighborId] = tentativeG;
          const h = heuristic(neighborCell, endCell);
          const f = tentativeG + h;

          // Verificar se o vizinho já está no openSet
          const existingNode = openSet.find(
            (node) => node.cellId === neighborId
          );
          if (!existingNode) {
            openSet.push({
              cellId: neighborId,
              g: tentativeG,
              h: h,
              f: f,
              parent: current.cellId,
            });
          } else if (tentativeG < existingNode.g) {
            // Atualizar o nó existente
            existingNode.g = tentativeG;
            existingNode.f = f;
            existingNode.parent = current.cellId;
          }
        }
      });
    }

    // Se não encontrou um caminho
    return null;
  }

  // Handler para traçar o caminho
  const handleTracePath = () => {
    if (!selectedStation) {
      alert("Selecione uma estação para traçar o caminho.");
      return;
    }

    const targetStation = stations.find((st) => st.name === selectedStation);
    if (!targetStation) {
      alert("Estação selecionada não encontrada.");
      return;
    }

    const robotCell = findCellContainingPoint(robotPosition, cells);
    const stationCenter = {
      x: targetStation.x + targetStation.width / 2,
      y: targetStation.y + targetStation.height / 2,
    };
    const stationCell = findCellContainingPoint(stationCenter, cells);

    if (!robotCell || !stationCell) {
      alert("Não foi possível encontrar as células para o robô ou a estação.");
      return;
    }

    const foundPath = aStar(cells, robotCell, stationCell);

    if (!foundPath) {
      alert("Caminho não encontrado.");
      setPath([]);
      return;
    }

    const pathPoints: { x: number; y: number }[] = [
      { x: robotPosition.x, y: robotPosition.y },
    ];

    foundPath.forEach((cell) => {
      pathPoints.push({
        x: cell.x + cell.width / 2,
        y: cell.y + cell.height / 2,
      });
    });

    pathPoints.push(stationCenter);
    setPath(pathPoints);

    const movements: { distance: number; angle?: number }[] = [];
    let previousPoint = pathPoints[0];
    let previousAngle: number | null = null;

    for (let i = 1; i < pathPoints.length; i++) {
      const currentPoint = pathPoints[i];

      const distanceBetween = Math.hypot(
        currentPoint.x - previousPoint.x,
        currentPoint.y - previousPoint.y
      );

      const angle =
        Math.atan2(
          currentPoint.y - previousPoint.y,
          currentPoint.x - previousPoint.x
        ) *
        (180 / Math.PI);

      let angleToTurn: number | undefined = undefined;

      if (i === 1) {
        // Primeiro movimento: calcular rotação inicial
        const initialAngle = 0; // Assuma o robô inicializado em 0° (ou defina a orientação inicial do robô)
        angleToTurn = angle - initialAngle;

        if (angleToTurn > 180) angleToTurn -= 360;
        if (angleToTurn < -180) angleToTurn += 360;
      } else if (previousAngle !== null) {
        // Calcular a rotação em passos subsequentes
        angleToTurn = angle - previousAngle;

        if (angleToTurn > 180) angleToTurn -= 360;
        if (angleToTurn < -180) angleToTurn += 360;
      }

      const movement: { distance: number; angle?: number } = {
        distance: Number(distanceBetween.toFixed(2)),
      };

      if (angleToTurn !== undefined) {
        movement.angle = Number(angleToTurn.toFixed(2));
      }

      movements.push(movement);
      previousPoint = currentPoint;
      previousAngle = angle;
    }

    let movementList = "";
    movements.forEach((move, index) => {
      movementList += `Passo ${index + 1}:\n`;
      movementList += `- Distância: ${move.distance} pixels\n`;
      if (move.angle !== undefined) {
        movementList += `- Ângulo de Rotação: ${move.angle}°\n`;
      }
      movementList += "\n";
    });

    console.log(`Movimentos:\n\n${movementList}`);

    let compactedMovements = "";
    let accumulatedDistance = 0;

    movements.forEach((move, index) => {
      const { distance, angle } = move;

      if (angle === undefined || angle === previousAngle) {
        accumulatedDistance += distance;
      } else {
        if (accumulatedDistance > 0) {
          compactedMovements += `M:${(accumulatedDistance / 3).toFixed(2)},`;
        }
        compactedMovements += `R:${angle.toFixed(2)},`;
        accumulatedDistance = distance;
      }

      previousAngle = angle ?? 0;

      if (index === movements.length - 1 && accumulatedDistance > 0) {
        compactedMovements += `M:${(accumulatedDistance / 3).toFixed(2)}`;
      }
    });

    console.log(compactedMovements);

    // ---- ENVIO VIA WEBSOCKET PARA O SERVIDOR PYTHON ----
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(compactedMovements);
    } else {
      console.error("WebSocket não está aberto para envio de movimentos.");
    }
  };

  return (
    <Container>
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <StyledSelect value={selectedStation} onChange={handleSelectStation}>
          <option value="">Selecione uma Estação</option>
          {stations.map((st, i) => (
            <option key={i} value={st.name}>
              {st.name}
            </option>
          ))}
        </StyledSelect>
        <Button onClick={handleTracePath}>Traçar Caminho</Button>

        {/* Select para controlar a visibilidade das linhas de divisão verticais */}
        <StyledSelect
          value={showDivisionLines ? "show" : "hide"}
          onChange={(e) => setShowDivisionLines(e.target.value === "show")}
        >
          <option value="show">Mostrar Linhas de Divisão</option>
          <option value="hide">Esconder Linhas de Divisão</option>
        </StyledSelect>
      </div>

      <StyledSelect
        value={pathMode}
        onChange={(e) => setPathMode(e.target.value as "neighbors" | "all")}
      >
        <option value="neighbors">Apenas Vizinhos</option>
        <option value="all">Todos os Caminhos</option>
      </StyledSelect>

      <MapContainer
        onClick={handleMapClick}
        style={{
          width: mapLimits.width,
          height: mapLimits.height,
          position: "relative",
          border: "1px solid #000",
        }}
      >
        {/* Renderizar obstáculos */}
        {obstacles.map((object, index) => (
          <Obstacle
            key={index}
            style={{
              position: "absolute",
              left: `${object.x}px`,
              top: `${object.y}px`,
              width: `${object.width}px`,
              height: `${object.height}px`,
              backgroundColor: "black",
            }}
          />
        ))}

        {/* Renderizar estações */}
        {stations.map((st, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${st.x}px`,
              top: `${st.y}px`,
              width: `${st.width}px`,
              height: `${st.height}px`,
              backgroundColor: "yellow",
              opacity: 0.5,
            }}
          />
        ))}

        {/* Renderizar linhas de divisão verticais condicionais */}
        {showDivisionLines &&
          divisionLines.map((x, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: "0",
                width: "1px",
                height: `${mapLimits.height}px`,
                backgroundColor: "black",
              }}
            />
          ))}

        {path.length > 1 && (
          <PathSVG>
            <PathLine points={path.map((p) => `${p.x},${p.y}`).join(" ")} />
          </PathSVG>
        )}
        <Robot
          onMouseDown={handleMouseDown}
          onClick={handleRobotClick}
          style={{
            position: "absolute",
            left: `${robotPosition.x}px`,
            top: `${robotPosition.y}px`,
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            zIndex: 2,
          }}
        />
      </MapContainer>
    </Container>
  );
}

export default Map;
