# LEGO NXT - Robô transportador


## Instruções para configuração do supervisor

### Requisitos

Antes de começar, certifique-se de que sua máquina Linux atende aos seguintes requisitos:

- Bluetooth habilitado e funcionando corretamente.
- O NXT está emparelhado com seu computador.
- Python 3 instalado.
- Acesso sudo para instalar pacotes necessários.

### Dependências

O projeto requer as seguintes bibliotecas Python e pacotes de sistema:

- **PyBluez**: Biblioteca Python para comunicação Bluetooth.
- **nxt-python**: Biblioteca Python para interação com LEGO NXT via Bluetooth.

#### Instalação de Dependências

1. Atualize os pacotes de seu sistema:

    ```bash
    sudo apt update
    ```

2. Instale pacotes de Bluetooth e PyBluez:

    ```bash
    sudo apt install bluetooth bluez python3-bluez
    ```

3. Instale o PyBluez e nxt-python usando o `pip`:

    ```bash
    python3 -m venv env
    pip install -r requirements.txt
    ```
