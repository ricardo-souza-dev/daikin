from flask import Flask, request, jsonify
import serial
import time

app = Flask(__name__)

class ComunicadorSerial:
    def __init__(self, port='/dev/ttyUSB0', baudrate=19200, parity=serial.PARITY_EVEN, stopbits=serial.STOPBITS_ONE):
        self.port = port
        self.baudrate = baudrate
        self.parity = parity
        self.stopbits = stopbits
        self.serial_port = None

    def abrir(self):
        if not self.serial_port:
            self.serial_port = serial.Serial(self.port, baudrate=self.baudrate, parity=self.parity, stopbits=self.stopbits, timeout=1)
            print("Porta serial aberta.")
        else:
            print("A porta serial já está aberta.")

    def fechar(self):
        if self.serial_port and self.serial_port.is_open:
            self.serial_port.close()
            print("Porta serial fechada.")
        else:
            print("A porta serial já está fechada ou não foi aberta.")

    def enviar_comando(self, comando):
        if not self.serial_port or not self.serial_port.is_open:
            print("A porta serial não está aberta.")
            return

        comando_string = f"{comando['type']} {comando['id']} {comando['mode']}\n"
        self.serial_port.write(comando_string.encode())
        time.sleep(0.1)  # Espera para garantir que o comando seja processado

# Instância global do comunicador serial
comunicador = ComunicadorSerial(port='/dev/ttyUSB0', baudrate=19200, parity=serial.PARITY_EVEN, stopbits=serial.STOPBITS_ONE)

@app.route('/enviar_comando', methods=['POST'])
def enviar_comando():
    dados = request.get_json()
    if 'type' not in dados or 'id' not in dados or 'mode' not in dados:
        return jsonify({"erro": "Dados inválidos"}), 400

    comando = {
        "type": dados['type'],
        "id": dados['id'],
        "mode": dados['mode']
    }

    try:
        comunicador.abrir()
        comunicador.enviar_comando(comando)
        comunicador.fechar()
        return jsonify({"status": "comando enviado com sucesso"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/enviar_comandos', methods=['POST'])
def enviar_comandos():
    comandos = request.get_json()
    if not isinstance(comandos, list):
        return jsonify({"erro": "A lista de comandos deve ser um array JSON"}), 400

    try:
        comunicador.abrir()
        for comando in comandos:
            if 'type' not in comando or 'id' not in comando or 'mode' not in comando:
                return jsonify({"erro": "Comando inválido"}), 400
            comunicador.enviar_comando(comando)
        comunicador.fechar()
        return jsonify({"status": "comandos enviados com sucesso"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
