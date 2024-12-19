import styled from "styled-components";

export const Container = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

export const MapContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;

  position: relative;
  width: 816px;
  height: 540px;
  border: 2px solid black;
  display: grid;
  grid-template-columns: 120px 576px 120px;
  background-color: rgb(233, 233, 233);
`;

const Station = styled("div")`
  width: 90px;
  height: 90px;
  border: 2px solid black;
  position: absolute;
`;

export const StationUp = styled(Station)`
  &::before {
    content: "";
    position: absolute;
    width: 30px;
    height: 3px;
    background-color: silver;
    bottom: -4px;
    left: 33%;
    transform: translateY(-50%);
  }
`;

export const StationDown = styled(Station)`
  &::before {
    content: "";
    position: absolute;
    width: 30px;
    height: 3px;
    background-color: silver;
    top: -1px;
    left: 33%;
    transform: translateY(-50%);
  }
`;

export const Robot = styled("div")`
  width: 40px;
  height: 40px;
  position: absolute;
  border-radius: 20%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url("/public/assets/robot.png") no-repeat center;
  background-size: contain;
`;

export const Obstacle = styled("div")`
  width: 15px;
  height: 10px;
  position: absolute;
  background-color: green;
  background-size: cover;
`;

export const PathLine = styled.polyline`
  fill: none;
  stroke: red;
  stroke-width: 2;
`;


export const PathSVG = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 816px; /* Deve corresponder à largura do mapa */
  height: 540px; /* Deve corresponder à altura do mapa */
  pointer-events: none; /* Permite que os eventos de mouse passem através do SVG */
`;