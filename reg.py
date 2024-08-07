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

# ID do dispositivo Modbus
unit_id = 1  # Por exemplo, o ID do dispositivo pode ser 1

# Exemplo de leitura de registrador
register_address = 0x1001  # Endereço do registrador a ser lido
num_registers = 1  # Número de registradores a serem lidos

try:
    result = client.read_input_registers(register_address, num_registers, unit=unit_id)
    if result.isError():
        print("Erro ao ler o registrador.")
    else:
        print("Valor do registrador:", result.registers[0])
except Exception as e:
    print("Erro:", e)

# Desconectando o cliente
client.close()
