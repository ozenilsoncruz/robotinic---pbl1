from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import asyncio
from random import randint
from json import loads

from bluetooth_nxt import conectar_nxt, enviar_msg, receber_msg

app = FastAPI()

ENDERECO = "00:16:53:09:70:AA"
robot_position = {"x": 50, "y": 50}


@app.get("/")
async def get():
    try:
        with open("index.html", "r", encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(html_content)
    except FileNotFoundError:
        return HTMLResponse("Arquivo index.html não encontrado.", status_code=404)


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
            msg = await receber_msg(brick)
            if msg:
                try:
                    data = loads(msg)
                    robot_position['x'] = int(data.get('x', 0)) / 1000
                    robot_position['y'] = int(data.get('y', 0)) / 1000
                    await websocket.send_json(robot_position)
                except (ValueError, TypeError) as e:
                    print(f"Mensagem: {msg}")
            await asyncio.sleep(0.5)
    except Exception as e:
        print(f"Erro na conexão com NXT. \n{e}")
        await websocket.close()  
    finally:
        brick.close()
        print("Conexão Bluetooth encerrada.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
