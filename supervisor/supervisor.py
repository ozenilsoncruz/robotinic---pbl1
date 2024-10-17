from nxt.locator import find, BrickNotFoundError
from nxt.brick import Brick
from nxt.error import DirectProtocolError

# Define o endereço MAC do NXT (ajuste conforme necessário)
ENDERECO = "00:16:53:09:70:AA"
MAILBOX_SEND = 1
MAILBOX_RECIVE = 2

def conectar_nxt(endereco: str) -> Brick|None:
    """Tenta estabelecer uma conexão com o NXT e retorna o objeto Brick se bem sucedido."""
    try:
        while True:
            try:
                nxt_brick = find(host=endereco)
                print("Conectado ao NXT com sucesso!")
                return nxt_brick
            except BrickNotFoundError as e:
                sleep(0.2)
        else:
            print("Falha ao conectar ao NXT.")
            return None
    except Exception as e:
        print(f"Erro ao conectar NXT.")


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


def receber_msg(brick: Brick) -> str :
    while True:
        try:
            _, msg = brick.message_read(MAILBOX_RECIVE, 0, True)
            return msg.decode()
        except DirectProtocolError:
            pass
        

def main():
    brick = conectar_nxt(ENDERECO)
    if brick:
        enviar_msg(brick, "Ozy teste")
        print(receber_msg(brick))
        brick.close()
        print("Conexão encerrada.")

if __name__ == "__main__":
    main()
