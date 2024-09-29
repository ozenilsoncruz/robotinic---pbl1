import bluetooth
from nxt.bluesock import BlueSock


def procurar_nxts():
    print("Procurando dispositivos Bluetooth...")
    dispositivos = bluetooth.discover_devices(duration=8, lookup_names=True, flush_cache=True)
    
    nxts = []
    for ende, nome in dispositivos:
        if 'NXT' in nome:
            print(f"Dispositivo NXT encontrado: {nome} - {ende}")
            nxts.append((nome, ende))
    return nxts


def enviar_msg(endereco, mensagem: str):
    try:
        sock = BlueSock(endereco)
        brick = sock.connect()
        
        if brick:
            sock.send(mensagem.encode()) 
        else:
            print("Falha ao conectar ao NXT.")
        sock.close()
    except Exception as e:
        print(f"Erro ao enviar mensagem: {e}")


def receber_msgs(endereco, buffer_size=1024):
    try:
        sock = BlueSock(endereco)
        brick = sock.connect()

        if not brick:
            print("Falha ao conectar ao NXT.")
            return
        
        print("Conectado ao NXT. Aguardando mensagens...")
        while True:
            try:
                data = sock.recv(buffer_size)

                if not data:
                    continue

                mensagem = data.decode()
                print(f"Mensagem recebida: {mensagem}")

                # Condição de saída (pode ser alterada conforme necessário)
                if mensagem.lower() == "sair":
                    print("Finalizando conexão...")
                    break

            except Exception as e:
                print(f"Erro ao receber mensagem: {e}")
                break

        sock.close()
        print("Conexão encerrada.")
    except Exception as e:
        print(f"Erro: {e}")


def main():
    nxts = procurar_nxts()
    mensagem = "iniciar"
    
    if nxts:
        nome, endereco = nxts[0]
        enviar_msg(endereco, mensagem)
        receber_msgs(endereco)



if __name__ == "__main__":
    main()
