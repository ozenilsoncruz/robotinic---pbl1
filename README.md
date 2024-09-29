# LEGO NXT - Robô Transportador

Este projeto visa receber informações de um robô LEGO NXT via comunicação Bluetooth em um ambiente Linux.

## Instruções para Configuração do Supervisor

### Requisitos

Antes de começar, certifique-se de que sua máquina Linux atende aos seguintes requisitos:

- Bluetooth habilitado e funcionando corretamente.
- O NXT está emparelhado com seu computador.
- Python 3 instalado.
- Acesso `sudo` para instalar pacotes necessários.

### Dependências

O projeto requer as seguintes bibliotecas Python e pacotes de sistema:

- **PyBluez**: Biblioteca Python para comunicação Bluetooth.
- **nxt-python**: Biblioteca Python para interação com o LEGO NXT via Bluetooth.

#### Instalação de Dependências

1. Atualize os pacotes de seu sistema:

    ```bash
    sudo apt update
    ```

2. Instale pacotes de Bluetooth e PyBluez:

    ```bash
    sudo apt install bluetooth bluez python3-bluez libbluetooth-dev
    ```

2.1. **Adicionar o Usuário ao Grupo Bluetooth (se necessário)**:  
   Pode ser necessário adicionar o usuário ao grupo `bluetooth` no Linux para permitir o acesso ao dispositivo sem `sudo`. Execute os comandos abaixo:
    ```bash
    sudo usermod -aG bluetooth nome_do_usuario
    newgrp bluetooth
    groups nome_do_usuario
    ```

3. Crie e ative um ambiente virtual Python (opcional, mas recomendado):
    ```bash
    python3 -m venv env
    source env/bin/activate
    ```

4. Instale as dependências Python listadas no arquivo requirements.txt:
    ```bash
    pip install -r requirements.txt
    ```


**Obs:**
- **Ativar Bluetooth**: O NXT deve estar com o Bluetooth ativado. Isso pode ser feito no menu de configurações do dispositivo NXT.
- **Emparelhamento Bluetooth**: É necessário emparelhar manualmente o NXT com o computador, antes de estabelecer a conexão via código. O emparelhamento é feito utilizando o código de PIN padrão do NXT (geralmente `1234`).