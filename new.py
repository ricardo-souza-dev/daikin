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

# Desconectando o cliente
client.close()
