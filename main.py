from flask import Flask, jsonify
from pymodbus.client import ModbusSerialClient as ModbusClient
import time
import logging

app = Flask(__name__)

# Lista de comandos a serem enviados
commands = [
    {"type": "Fcu", "id": "ha001-00001", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00002", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00003", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00004", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00005", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00006", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00007", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00008", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00009", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00010", "mode": "fan"},
    {"type": "Fcu", "id": "ha001-00011", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00012", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00013", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00014", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00015", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00016", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00017", "mode": "cool"},
    {"type": "Fcu", "id": "ha001-00018", "mode": "fan"},
    {"type": "Fcu", "id": "ha001-00019", "mode": "fan"},
    {"type": "Fcu", "id": "ha001-00020", "mode": "fan"}
]

# Configurações do cliente Modbus Serial
SERIAL_PORT = '/dev/ttyUSB0'  # Substitua pelo seu dispositivo serial
BAUD_RATE = 19200
PARITY = 'EVEN'
STOPBITS = 1
BYTESIZE = 8

client = ModbusClient(
    port=SERIAL_PORT,
    baudrate=BAUD_RATE,
    parity=PARITY,
    stopbits=STOPBITS,
    bytesize=BYTESIZE
)

def send_command(device_id, mode):
    mode_map = {'cool': 1, 'fan': 2}
    command_value = mode_map.get(mode, 0)
    command_register = 0x10

    try:
        result = client.write_register(command_register, command_value, unit=1)
        if result.isError():
            return {"status": "error", "message": f"Failed to send command to device {device_id}"}
        return {"status": "success", "message": f"Command sent to device {device_id} with mode {mode}"}
    except Exception as e:
        return {"status": "error", "message": f"Error sending command to device {device_id}: {e}"}

@app.route('/')
def home():
    return jsonify({"status": "success", "message": "Servidor está funcionando corretamente!"})

@app.route('/send_commands', methods=['POST'])
def send_commands():
    if not client.connect():
        return jsonify({"status": "error", "message": "Failed to connect to Modbus server"}), 500

    responses = []
    for cmd in commands:
        device_id = cmd['id']
        mode = cmd['mode']
        response = send_command(device_id, mode)
        responses.append(response)
        time.sleep(1)  # Intervalo entre comandos para evitar sobrecarga

    client.close()
    return jsonify(responses)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000)