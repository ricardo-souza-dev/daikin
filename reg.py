from pymodbus.client.sync import ModbusSerialClient as ModbusClient

# Configurações do cliente Modbus RTU
port = '/dev/ttyUSB0'   # Porta serial
baudrate = 9600         # Taxa de transmissão
parity = 'N'            # Paridade
stopbits = 1            # Bits de parada
bytesize = 8            # Tamanho do byte
timeout = 1             # Tempo limite para resposta

def scan_modbus_rtu(port, baudrate, parity, stopbits, bytesize, timeout, start_unit_id, end_unit_id, register_address, number_of_registers):
    """
    Escaneia IDs de unidades Modbus RTU e tenta ler de um registrador específico.

    :param port: Porta serial do Modbus RTU.
    :param baudrate: Taxa de transmissão.
    :param parity: Paridade.
    :param stopbits: Bits de parada.
    :param bytesize: Tamanho do byte.
    :param timeout: Tempo limite para resposta.
    :param start_unit_id: ID inicial da unidade Modbus.
    :param end_unit_id: ID final da unidade Modbus.
    :param register_address: Endereço do registrador a ser lido.
    :param number_of_registers: Número de registradores a serem lidos.
    """
    for unit_id in range(start_unit_id, end_unit_id + 1):
        client = ModbusClient(
            port=port,
            baudrate=baudrate,
            parity=parity,
            stopbits=stopbits,
            bytesize=bytesize,
            timeout=timeout
        )
        try:
            client.connect()
            response = client.read_holding_registers(register_address, number_of_registers, unit=unit_id)
            if response.isError():
                print(f"Unit ID {unit_id} - Error: {response}")
            else:
                print(f"Unit ID {unit_id} - Success: {response.registers}")
        except ModbusException as e:
            print(f"Unit ID {unit_id} - Exception: {e}")
        finally:
            client.close()

# Parâmetros de configuração
port = '/dev/ttyUSB0'   # Porta serial
baudrate = 9600         # Taxa de transmissão
parity = 'N'            # Paridade
stopbits = 1            # Bits de parada
bytesize = 8            # Tamanho do byte
timeout = 1             # Tempo limite para resposta
start_unit_id = 1       # ID inicial da unidade a ser escaneada
end_unit_id = 10        # ID final da unidade a ser escaneada

# Inicia o scan
scan_modbus_rtu(port, baudrate, parity, stopbits, bytesize, timeout, start_unit_id, end_unit_id, register_address, number_of_registers)
