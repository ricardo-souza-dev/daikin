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

result = client.read_input_registers(0x04, 40000, slave=2)

print(result)

# Desconectando o cliente
client.close()
