from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import asyncio
from typing import Tuple
from math import pi, cos, sin

from bluetooth_nxt import conectar_nxt, enviar_msg, receber_msg

app = FastAPI()


DIAMETRO_RODA = 5.5
DISTANCIA_ENTRE_RODAS = 18.5

ENDERECO = "00:16:53:09:70:AA"


robot_position = {}
angulo = 0

@app.get("/")
async def get():
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(html_content)
    except FileNotFoundError:
        return HTMLResponse("Arquivo index.html não encontrado.", status_code=404)

def calculaOdometria(motorEsquerdo: int, motorDireito: int, compensacao: int) -> Tuple[int]:
    global angulo
    
    deslocamento_motor_direito = motorDireito/360 * pi * (DIAMETRO_RODA)
    deslocamento_motor_esquerdo = motorEsquerdo/360 * pi * (DIAMETRO_RODA)
    deslocamento_medio = ((deslocamento_motor_direito) + (deslocamento_motor_esquerdo)) / 2 
    mudanca_angulo = (deslocamento_motor_direito - deslocamento_motor_esquerdo) / (DISTANCIA_ENTRE_RODAS)
    
    # Se ambos os motores são negativos, invertemos a direção do cálculo do ângulo
    if motorEsquerdo < 0 and motorDireito < 0:
        mudanca_angulo = -mudanca_angulo  
    angulo += (mudanca_angulo + (compensacao / 57.2958)) 
    
    delta_x = deslocamento_medio * cos(angulo)
    delta_y = deslocamento_medio * sin(angulo)
    
    print(f"\n\nDeslocamento Motor Direito: {deslocamento_motor_direito}")
    print(f"Deslocamento Motor Esquerdo: {deslocamento_motor_esquerdo}")
    print(f"Deslocamento Médio: {deslocamento_medio}")
    print(f"mudanca_angulo: {mudanca_angulo}")
    print(f"Novo Ângulo: {angulo}")
    print(f"Delta X: {delta_x}, Delta Y: {delta_y}\n\n")
    
    return (delta_x, -delta_y) 


@app.websocket("/ws/position")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    brick = conectar_nxt(ENDERECO)
    if not brick:
        await websocket.send_json({"error": "Não foi possível conectar ao NXT."})
        await websocket.close()
        return

    msg = await websocket.receive_text() # receber mensagem do websocket React 
    enviar_msg(brick, msg)

    try:
        while True:
            msg = receber_msg(brick)
            if msg:
                try:
                    data = msg.split(",")
                    
                    x, y = calculaOdometria(float(data[0]), float(data[1]), float(data[2]))
                    robot_position["x"] = x
                    robot_position["y"] = y
                    await websocket.send_json(robot_position)
                except (ValueError, TypeError) as e:
                    print(f"Mensagem: {msg}. Erro: {e}")
            await asyncio.sleep(0.6)
    except Exception as e:
        print(f"Erro na conexão com NXT. \n{e}")
        await websocket.close()
    finally:
        print("Conexão Bluetooth encerrada.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000)