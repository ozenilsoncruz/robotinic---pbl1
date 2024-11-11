from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import asyncio
from random import randint
from json import loads
from typing import Tuple
from math import pi, cos, sin

from bluetooth_nxt import conectar_nxt, enviar_msg, receber_msg

app = FastAPI()


DIAMETRO_RODA = 5.5
DISTANCIA_ENTRE_RODAS = 18.5

ENDERECO = "00:16:53:09:70:AA"


robot_position = {"x": 20, "y": 50}
angulo = 0

@app.get("/")
async def get():
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(html_content)
    except FileNotFoundError:
        return HTMLResponse("Arquivo index.html não encontrado.", status_code=404)


def calculaOdometria(motorEsquerdo: int, motorDireito: int) -> Tuple[int]:
    global angulo
    compensacao = 10
    
    deslocamento_motor_direito = motorDireito * pi * (DIAMETRO_RODA)
    deslocamento_motor_esquerdo = motorEsquerdo * pi * (DIAMETRO_RODA)
    deslocamento_medio = ((deslocamento_motor_direito) + (deslocamento_motor_esquerdo)) / 2
    mudanca_angulo = (deslocamento_motor_direito - deslocamento_motor_esquerdo) / (DISTANCIA_ENTRE_RODAS)

    angulo += (mudanca_angulo + (compensacao/57.2958))

    delta_x = deslocamento_medio * cos(angulo)
    delta_y = deslocamento_medio * sin(angulo)

    return (delta_x/100, delta_y/100)
    

@app.websocket("/ws/position")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    brick = conectar_nxt(ENDERECO)
    if not brick:
        await websocket.send_json({"error": "Não foi possível conectar ao NXT."})
        await websocket.close()
        return

    enviar_msg(brick, "Iniciar")

    try:
        while True:
            msg = receber_msg(brick)
            print(f"Mensagem recebida: {msg}")
            if msg:
                try:
                    data = msg.split(",")
                    
                    x, y = calculaOdometria(float(data[0]), float(data[1]))
                    robot_position["x"] = x
                    robot_position["y"] = y
                    await websocket.send_json(robot_position)
                except (ValueError, TypeError) as e:
                    print(f"Mensagem: {msg}. Erro: {e}")
            await asyncio.sleep(0.5)
    except Exception as e:
        print(f"Erro na conexão com NXT. \n{e}")
        await websocket.close()
    finally:
        print("Conexão Bluetooth encerrada.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000)
