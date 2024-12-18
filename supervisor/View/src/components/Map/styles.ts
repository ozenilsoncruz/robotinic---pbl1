import styled from "styled-components";

// Container geral engloba tanto o painel de botões quanto o mapa
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Área dos botões de controle
export const ButtonPanel = styled.div`
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
`;

export const ControlButton = styled.button`
  padding: 4px 8px;
  cursor: pointer;
`;

export const MapContainer = styled.div`
  position: relative;
  width: 816px;
  height: 540px;
  background-color: #eee;
  border: 1px solid #ccc;
`;

export const Obstacle = styled.div`
  width: 10px;
  height: 10px;
  background-color: red;
  position: absolute;
  border-radius: 2px;
`;

export const Robot = styled.div`
  width: 16px;
  height: 16px;
  background-color: green;
  position: absolute;
  border-radius: 50%;
  cursor: grab;  /* Indica que pode ser arrastado */
`;

export const StationUp = styled.div`
  width: 20px;
  height: 20px;
  background-color: orange;
  position: absolute;
  cursor: pointer;
`;

export const StationDown = styled.div`
  width: 20px;
  height: 20px;
  background-color: purple;
  position: absolute;
  cursor: pointer;
`;

export const Line = styled.div`
  width: 2px;
  background-color: black;
  position: absolute;
`;

export const Midpoint = styled.div`
  width: 6px;
  height: 6px;
  background-color: blue;
  position: absolute;
  border-radius: 50%;
`;

export const EdgeLine = styled.div`
  position: absolute;
  background-color: #999; 
`;

export const PathLine = styled.div`
  position: absolute;
  background-color: green;
  opacity: 0.7;
`;
