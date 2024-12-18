import React, { useState, MouseEvent } from "react";
import {
  Container,
  ButtonPanel,
  ControlButton,
  MapContainer,
  Obstacle,
  Robot,
  StationDown,
  StationUp,
  Line,
  Midpoint,
  EdgeLine,
  PathLine,
} from "./styles";

type ObstaclesPosition = {
  x: number;
  y: number;
};

type VerticalLine = {
  x: number;
  y1: number;
  y2: number;
};

type MidpointType = {
  x: number;
  y: number;
};

type Edge = {
  from: MidpointType;
  to: MidpointType;
};

const MAP_WIDTH = 816;
const MAP_HEIGHT = 540;

/**
 * Map component.
 */
function Map() {
  const [obstacles, setObstacles] = useState<ObstaclesPosition[]>([]);
  const [lines, setLines] = useState<VerticalLine[]>([]);
  const [midpoints, setMidpoints] = useState<MidpointType[]>([]);
  const [graphEdges, setGraphEdges] = useState<Edge[]>([]);

  // robotPosition e dragging state
  const [robotPosition, setRobotPosition] = useState<{ x: number; y: number }>({
    x: 100,
    y: 100,
  });
  const [isDraggingRobot, setIsDraggingRobot] = useState<boolean>(false);

  // phasing
  const [phase, setPhase] = useState<"editing" | "linesDrawn" | "stationSelected">("editing");

  // estação selecionada
  const [selectedStation, setSelectedStation] = useState<{ x: number; y: number } | null>(null);

  // Caminho resultante (uma lista de segmentos de reta)
  const [pathSegments, setPathSegments] = useState<Edge[]>([]);

  // Ao clicar no mapa, adiciona obstáculo se estiver no modo "editing"
  function handleMapClick(event: MouseEvent<HTMLDivElement>) {
    if (phase !== "editing") return;

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = Number((event.clientX - rect.left).toFixed(2));
    const y = Number((event.clientY - rect.top).toFixed(2));

    setObstacles((prev) => [...prev, { x, y }]);
  }

  // Ao clicar no botão "Desenhar Linhas"
  function handleDrawLines() {
    if (phase !== "editing") return;
    setPhase("linesDrawn");

    const newLines: VerticalLine[] = [];

    // Para cada obstáculo, gera duas linhas: uma para cima, outra para baixo
    obstacles.forEach((obs) => {
      // Linha para cima
      let yTop = 0;
      for (let yCheck = obs.y; yCheck >= 0; yCheck--) {
        const collision = obstacles.some((o) => {
          // Verificação simples de colisão no mesmo x
          return o !== obs && Math.abs(o.x - obs.x) < 5 && Math.abs(o.y - yCheck) < 5;
        });
        if (collision) {
          yTop = yCheck;
          break;
        }
        yTop = yCheck;
      }
      if (yTop !== obs.y) {
        newLines.push({ x: obs.x, y1: yTop, y2: obs.y });
      }

      // Linha para baixo
      let yBottom = MAP_HEIGHT;
      for (let yCheck = obs.y; yCheck <= MAP_HEIGHT; yCheck++) {
        const collision = obstacles.some((o) => {
          return o !== obs && Math.abs(o.x - obs.x) < 5 && Math.abs(o.y - yCheck) < 5;
        });
        if (collision) {
          yBottom = yCheck;
          break;
        }
        yBottom = yCheck;
      }
      if (yBottom !== obs.y) {
        newLines.push({ x: obs.x, y1: obs.y, y2: yBottom });
      }
    });

    setLines(newLines);
  }

  // Identificar pontos médios
  function handleIdentifyMidpoints() {
    if (phase !== "linesDrawn") return;

    const newMidpoints: MidpointType[] = lines.map((line) => {
      return {
        x: line.x,
        y: (line.y1 + line.y2) / 2,
      };
    });
    setMidpoints(newMidpoints);
  }

  // Gerar grafo: conectar midpoints que estejam “visualmente” conectados (simplificado)
  function handleGenerateGraph() {
    if (phase !== "linesDrawn") return;

    const edges: Edge[] = [];

    for (let i = 0; i < midpoints.length; i++) {
      for (let j = i + 1; j < midpoints.length; j++) {
        const m1 = midpoints[i];
        const m2 = midpoints[j];

        // Critério simples: mesmo x
        if (Math.abs(m1.x - m2.x) < 1e-6) {
          // Verifica se não há obstáculo no meio
          const minY = Math.min(m1.y, m2.y);
          const maxY = Math.max(m1.y, m2.y);
          const blocked = obstacles.some((obs) => {
            if (Math.abs(obs.x - m1.x) < 5 && obs.y > minY && obs.y < maxY) {
              return true;
            }
            return false;
          });
          if (!blocked) {
            edges.push({ from: m1, to: m2 });
            edges.push({ from: m2, to: m1 });
          }
        }
      }
    }

    setGraphEdges(edges);
  }

  // Quando o usuário clica numa estação
  function handleStationClick(event: MouseEvent<HTMLDivElement>) {
    if (phase !== "linesDrawn") return;

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = Number((event.clientX - rect.left).toFixed(2));
    const y = Number((event.clientY - rect.top).toFixed(2));

    setSelectedStation({ x, y });
    setPhase("stationSelected");
  }

  // Função para encontrar caminho via BFS (ou Dijkstra)
  function handleFindPath() {
    if (phase !== "stationSelected" || !selectedStation) return;

    // Monta grafo local com midpoints + robotMidpoint + stationMidpoint
    const virtualRobotMidpoint: MidpointType = { x: robotPosition.x, y: robotPosition.y };
    const virtualStationMidpoint: MidpointType = { x: selectedStation.x, y: selectedStation.y };

    // Copia edges existentes
    const localEdges: Edge[] = [...graphEdges];

    // Conecta o midpoint do robô
    midpoints.forEach((m) => {
      if (Math.abs(m.x - virtualRobotMidpoint.x) < 5) {
        const minY = Math.min(m.y, virtualRobotMidpoint.y);
        const maxY = Math.max(m.y, virtualRobotMidpoint.y);
        const blocked = obstacles.some((obs) => {
          if (Math.abs(obs.x - m.x) < 5 && obs.y > minY && obs.y < maxY) {
            return true;
          }
          return false;
        });
        if (!blocked) {
          localEdges.push({ from: virtualRobotMidpoint, to: m });
          localEdges.push({ from: m, to: virtualRobotMidpoint });
        }
      }
    });

    // Conecta o midpoint da estação
    midpoints.forEach((m) => {
      if (Math.abs(m.x - virtualStationMidpoint.x) < 5) {
        const minY = Math.min(m.y, virtualStationMidpoint.y);
        const maxY = Math.max(m.y, virtualStationMidpoint.y);
        const blocked = obstacles.some((obs) => {
          if (Math.abs(obs.x - m.x) < 5 && obs.y > minY && obs.y < maxY) {
            return true;
          }
          return false;
        });
        if (!blocked) {
          localEdges.push({ from: virtualStationMidpoint, to: m });
          localEdges.push({ from: m, to: virtualStationMidpoint });
        }
      }
    });

    // BFS
    const visited = new Set<string>();
    const cameFrom = new (Map as any);

    const allNodes = [virtualRobotMidpoint, ...midpoints, virtualStationMidpoint];
    const midpointKey = (m: MidpointType) => `${m.x.toFixed(2)},${m.y.toFixed(2)}`;

    allNodes.forEach((n) => cameFrom.set(midpointKey(n), null));

    let found = false;
    const queue: MidpointType[] = [virtualRobotMidpoint];
    visited.add(midpointKey(virtualRobotMidpoint));

    while (queue.length && !found) {
      const current = queue.shift()!;
      const currentKey = midpointKey(current);

      // Vizinhos de current
      const neighbors = localEdges
        .filter((edge) => midpointKey(edge.from) === currentKey)
        .map((edge) => edge.to);

      for (const n of neighbors) {
        const nk = midpointKey(n);
        if (!visited.has(nk)) {
          visited.add(nk);
          cameFrom.set(nk, current);
          queue.push(n);
          if (nk === midpointKey(virtualStationMidpoint)) {
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      alert("Não foi possível encontrar um caminho até a estação!");
      return;
    }

    // Reconstruir caminho
    const path: Edge[] = [];
    let current: MidpointType | null = virtualStationMidpoint;
    while (current && midpointKey(current) !== midpointKey(virtualRobotMidpoint)) {
      const prev: any = cameFrom.get(midpointKey(current));
      if (!prev) break;
      // cria um edge do prev -> current
      path.push({ from: prev, to: current });
      current = prev;
    }
    setPathSegments(path);
  }

  // ---------------------------
  //  Lógica de arrastar o robô
  // ---------------------------
  function handleRobotMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (phase !== "editing") return; // Só permitimos arrastar enquanto estivermos em fase de edição
    event.stopPropagation(); // Impede que o clique seja interpretado como clique no mapa
    setIsDraggingRobot(true);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (isDraggingRobot && phase === "editing") {
      const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = Number((event.clientX - rect.left).toFixed(2));
      const y = Number((event.clientY - rect.top).toFixed(2));

      // Limitar nas bordas do mapa
      const clampedX = Math.max(0, Math.min(x, MAP_WIDTH));
      const clampedY = Math.max(0, Math.min(y, MAP_HEIGHT));
      setRobotPosition({ x: clampedX, y: clampedY });
    }
  }

  function handleMouseUp() {
    setIsDraggingRobot(false);
  }

  return (
    <Container>
      {/* Botões de controle fora do mapa */}
      <ButtonPanel>
        {phase === "editing" && (
          <ControlButton onClick={handleDrawLines}>
            (a) Desenhar Linhas
          </ControlButton>
        )}
        {phase === "linesDrawn" && (
          <>
            <ControlButton onClick={handleIdentifyMidpoints}>
              (b) Identificar Pontos Médios
            </ControlButton>
            <ControlButton onClick={handleGenerateGraph}>
              (c) Gerar Grafo
            </ControlButton>
          </>
        )}
        {phase === "stationSelected" && (
          <ControlButton onClick={handleFindPath}>Encontrar Caminho</ControlButton>
        )}
      </ButtonPanel>

      <MapContainer
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Obstáculos */}
        {obstacles.map((ob, index) => (
          <Obstacle
            key={index}
            style={{
              position: "absolute",
              left: `${ob.x - 5}px`,
              top: `${ob.y - 5}px`,
            }}
          />
        ))}

        {/* Linhas verticais desenhadas */}
        {lines.map((line, index) => (
          <Line
            key={index}
            style={{
              left: `${line.x}px`,
              top: `${Math.min(line.y1, line.y2)}px`,
              height: `${Math.abs(line.y2 - line.y1)}px`,
            }}
          />
        ))}

        {/* Pontos médios */}
        {midpoints.map((m, index) => (
          <Midpoint
            key={index}
            style={{
              left: `${m.x - 3}px`,
              top: `${m.y - 3}px`,
            }}
          />
        ))}

        {/* Exibir arestas do grafo (linhas entre midpoints) */}
        {graphEdges.map((edge, idx) => {
          const x = edge.from.x;
          const y = edge.from.y;
          const x2 = edge.to.x;
          const y2 = edge.to.y;
          const left = Math.min(x, x2);
          const top = Math.min(y, y2);
          const width = Math.abs(x2 - x) || 2; // se vertical, width = 2
          const height = Math.abs(y2 - y) || 2;

          return (
            <EdgeLine
              key={idx}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: width < 2 ? "2px" : `${width}px`,
                height: height < 2 ? "2px" : `${height}px`,
              }}
            />
          );
        })}

        {/* Estações (superiores e inferiores) */}
        <StationUp
          style={{
            top: "20px",
            left: "200px",
          }}
          onClick={handleStationClick}
        />
        <StationUp
          style={{
            top: "20px",
            right: "200px",
          }}
          onClick={handleStationClick}
        />
        <StationDown
          style={{
            bottom: "20px",
            left: "200px",
          }}
          onClick={handleStationClick}
        />
        <StationDown
          style={{
            bottom: "20px",
            right: "200px",
          }}
          onClick={handleStationClick}
        />

        {/* Robô: agora é arrastável */}
        <Robot
          style={{
            left: `${robotPosition.x - 8}px`,
            top: `${robotPosition.y - 8}px`,
          }}
          onMouseDown={handleRobotMouseDown}
        />

        {/* Caminho final */}
        {pathSegments.map((seg, index) => {
          const x1 = seg.from.x;
          const y1 = seg.from.y;
          const x2 = seg.to.x;
          const y2 = seg.to.y;
          const left = Math.min(x1, x2);
          const top = Math.min(y1, y2);
          const width = Math.abs(x2 - x1) || 2;
          const height = Math.abs(y2 - y1) || 2;

          return (
            <PathLine
              key={index}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: width < 2 ? "2px" : `${width}px`,
                height: height < 2 ? "2px" : `${height}px`,
              }}
            />
          );
        })}
      </MapContainer>
    </Container>
  );
}

export default Map;
