from pymodbus.client import ModbusSerialClient as ModbusClient

# Configuração do cliente Modbus
client = ModbusClient(
    port='/dev/ttyUSB0',
    baudrate=9600,
    parity='N',
    stopbits=1,
    bytesize=8,
    timeout=2
)

# Conectando ao cliente
if client.connect():
    print("Conexão estabelecida com sucesso!")
else:
    print("Falha na conexão.")
    exit()

def scan_modbus_ids(start_id, end_id, register_address):
    """
    Varre IDs de dispositivos Modbus para descobrir quais estão ativos na rede.

    :param start_id: ID inicial a ser verificado.
    :param end_id: ID final a ser verificado.
    :param register_address: Endereço do registrador a ser lido para verificação.
    :return: Lista de IDs de dispositivos encontrados.
    """
    found_ids = []

    for unit_id in range(start_id, end_id + 1):
        try:
            # Tentando ler um registrador de cada dispositivo
            result = client.read_input_registers(register_address, 1, unit=unit_id)
            if not result.isError():
                print(f"Dispositivo encontrado com ID {unit_id}")
                found_ids.append(unit_id)
        except Exception as e:
            # Caso ocorra um erro, provavelmente o ID não está ativo
            print(f"ID {unit_id} não responde ou erro: {e}")

    return found_ids

# Parâmetros de varredura
start_id = 1
end_id = 247
register_address = 0x0000  # Endereço do registrador para verificar a resposta

# Realizando a varredura
found_devices = scan_modbus_ids(start_id, end_id, register_address)
print(f"IDs encontrados: {found_devices}")

# Desconectando o cliente
client.close()