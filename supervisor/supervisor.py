from nxt.locator import find, BrickNotFoundError
from nxt.brick import Brick
from nxt.error import DirectProtocolError
from time import sleep
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import asyncio
from random import randint
from json import dump

app = FastAPI()

ENDERECO = "00:16:53:09:70:AA"
MAILBOX_SEND = 1
MAILBOX_RECIVE = 2
robot_position = {"x": 50, "y": 50}


def conectar_nxt(endereco: str) -> Brick | None:
    """Tenta estabelecer uma conexão com o NXT e retorna o objeto Brick se bem sucedido."""
    try:
        for _ in range(10):
            try:
                nxt_brick = find(host=endereco)
                print("Conectado ao NXT com sucesso!")
                return nxt_brick
            except BrickNotFoundError:
                sleep(0.2)
        print("Não foi possível conectar ao NXT após várias tentativas.")
    except Exception as e:
        print(f"Erro ao conectar NXT. {e}")
    return None  # Retorna None caso a conexão falhe


def enviar_msg(brick: Brick, mensagem: str):
    """Envia uma mensagem para o NXT se estiver conectado."""
    try:
        if brick:
            brick.message_write(MAILBOX_SEND, mensagem.encode())
            print("Mensagem enviada.")
        else:
            print("NXT não está conectado.")
    except Exception as e:
        print(f"Erro ao enviar mensagem: {e}")


def receber_msg(brick: Brick) -> str:
    """Recebe uma mensagem do NXT."""
    try:
        while True:
            try:
                _, msg = brick.message_read(MAILBOX_RECIVE, 0, True)
                return msg.decode()
            except DirectProtocolError:
                continue
    except Exception as e:
        print(f"Erro ao receber mensagens: {e}")
        return "" 


@app.get("/")
async def get():
    with open("index.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(html_content)


@app.websocket("/ws/position")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    brick = conectar_nxt(ENDERECO)
    try:
        if brick:
            while True:
                #enviar_msg(brick, "Iniciar")
                resposta = receber_msg(brick)
                if resposta.lower == 'parar':
                    break
                resposta = dump(resposta)
                
                robot_position['x'] = resposta['x'] # randint(50, 1000)
                robot_position['y'] = resposta['y'] # randint(0, 700)
                
                await websocket.send_json(robot_position)
                await asyncio.sleep(0.1)
    except Exception as e:
        print(f"Erro no WebSocket: {e}")
    finally:
        if brick:
            brick.close()
            print("Conexão encerrada.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
