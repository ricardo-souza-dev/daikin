from pymodbus.client import ModbusSerialClient as ModbusClient

# Criação do cliente Modbus RTU
client = ModbusClient(
    port='/dev/ttyUSB0',  # Porta serial
    baudrate=9600,        # Taxa de transmissão
    parity='N',           # Paridade (N: Nenhuma, E: Par, O: Ímpar)
    stopbits=1,           # Bits de parada
    bytesize=8,           # Tamanho do byte
    timeout=1             # Tempo de espera para resposta (em segundos)
)

# Conectando ao cliente
if client.connect():
    print("Conexão estabelecida com sucesso!")
else:
    print("Falha na conexão.")

# Exemplo de leitura de um registrador
# result = client.read_holding_registers(0, 1, unit=1)
# if result.isError():
#     print("Erro ao ler registrador:", result)
# else:
#     print("Valor do registrador:", result.registers[0])

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

device_id = 'ha001-00020'
mode = 'fan'
response = send_command(device_id, mode)

print(response)

# Desconectando o cliente
client.close()
