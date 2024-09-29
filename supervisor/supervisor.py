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
    except Exception as e:
        print(f"Erro: {e}")


def main():
    nxts = procurar_nxts()
    mensagem = "teste"
    
    if nxts:
        nome, endereco = nxts[0]
        enviar_msg(endereco, mensagem)

if __name__ == "__main__":
    main()
