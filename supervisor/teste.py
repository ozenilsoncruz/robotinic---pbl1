import socket

RFCOMM_PORT = 1
ENDERECO =  "00:16:53:09:70:AA"


def enviar_msg(sock: socket.socket, mensagem: str):
    try:
        sock.send(mensagem.encode('ascii'))
        print(f"Mensagem enviada: {mensagem}")
    except Exception as e:
        print(f"Erro ao enviar mensagem: {e}")


def receber_msgs(sock: socket.socket, mensagem_fim: str, buffer_size: int = 1024):
    try:    
        print("Aguardando mensagens...")
        while True:
            try:
                data = sock.recv(buffer_size)

                if not data:
                    continue

                mensagem = data.decode('ascii', errors='ignore').strip()
                print(f"Mensagem recebida: {mensagem}")

                if mensagem.lower() == mensagem_fim:
                    print("Finalizando conexão...")
                    break

            except Exception as e:
                print(f"Erro ao receber mensagem: {e}")
                break
        print("Conexão encerrada.")
    except Exception as e:
        print(f"Erro: {e}")


def main():
    
    mensagem = "iniciar"
    mensagem_fim = "sair"
    
    sock = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM)
    sock.connect((ENDERECO, RFCOMM_PORT))
    print(f"Conectado ao NXT.")
    
    enviar_msg(sock=sock, mensagem=mensagem)
    receber_msgs(sock=sock, mensagem_fim=mensagem_fim)
    
    sock.close()

if __name__ == "__main__":
    main()
