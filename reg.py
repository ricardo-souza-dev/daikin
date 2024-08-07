from pymodbus.client import ModbusSerialClient as ModbusClient

# Criação do cliente Modbus RTU
client = ModbusClient(
    port='/dev/ttyUSB0',  # Porta serial
    baudrate=9600,        # Taxa de transmissão
    parity='N',           # Paridade
    stopbits=1,           # Bits de parada
    bytesize=8,           # Tamanho do byte
    timeout=2             # Tempo de espera para resposta
)

# Conectando ao cliente
if client.connect():
    print("Conexão estabelecida com sucesso!")
else:
    print("Falha na conexão.")
    exit()

# Função para enviar comandos
def send_command(register_address, values, unit_id):
    """
    Envia uma lista de valores para um registrador específico.

    :param register_address: Endereço do registrador onde os dados serão escritos.
    :param values: Lista de valores a serem escritos nos registradores.
    :param unit_id: ID do dispositivo Modbus.
    :return: Resultado da operação.
    """
    try:
        # Enviando os valores para os registradores
        result = client.write_registers(register_address, values, unit=unit_id)
        if result.isError():
            return {"status": "error", "message": "Failed to send command to device"}
        return {"status": "success", "message": "Command sent to device"}
    except Exception as e:
        return {"status": "error", "message": f"Error sending command to device: {e}"}

# Função para ler registradores
def read_temperature(register_address, num_registers, unit_id):
    """
    Lê a temperatura atual do dispositivo.

    :return: Resposta com o status e a temperatura lida.
    """
    try:
        # Lendo os registradores de entrada
        result = client.read_input_registers(register_address, num_registers, unit=unit_id)
        if result.isError():
            return {"status": "error", "message": "Failed to read temperature from device"}
        temperature = result.registers[0] / 10.0  # Ajuste conforme a unidade
        return {"status": "success", "temperature": temperature}
    except Exception as e:
        return {"status": "error", "message": f"Error reading temperature from device: {e}"}

# Exemplo de uso
register_address = 0x1001  # Endereço do registrador para temperatura atual
num_registers = 1  # Número de registradores a serem lidos
unit_id = 'ha001-00009'  # ID do dispositivo Modbus

# Leitura de temperatura
response = read_temperature(register_address, num_registers, unit_id)
print(response)

# Enviar um comando para o dispositivo
register_address = 0x1002  # Endereço do registrador para modo de operação
mode_value = 0x01  # Exemplo: 0x01 para aquecimento
values = [mode_value]

response = send_command(register_address, values, unit_id)
print(response)

# Desconectando o cliente
client.close()
