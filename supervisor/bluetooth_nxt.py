from time import sleep

from nxt.locator import find, BrickNotFoundError
from nxt.brick import Brick
from nxt.error import DirectProtocolError

MAILBOX_SEND = 1
MAILBOX_RECIVE = 2


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


ENDERECO = "00:16:53:09:70:AA"


brick = conectar_nxt(ENDERECO)

enviar_msg(brick, "TESTE")

print(receber_msg(brick))