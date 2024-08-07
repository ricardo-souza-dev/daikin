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

def convert_to_holding_reg(com, reg):
    fan_attr = reg[0] & 0xff00

    for key, val in com.items():
        if key == 'stat':
            if val == 'on':
                reg[0] |= 0x0001
            elif val == 'off':
                reg[0] &= 0xfffe
        elif key == 'sp':
            reg[2] = round(float(val) * 10)
        elif key == 'mode':
            reg[1] &= 0xfff0
            if val == 'heat':
                reg[1] |= 0x0001
            elif val == 'cool':
                reg[1] |= 0x0002
            elif val == 'auto':
                reg[1] |= 0x0003
            elif val == 'temp':
                reg[1] |= 0x0006
            elif val == 'dry':
                reg[1] |= 0x0007
        elif key == 'fanstep':
            fan_attr &= 0x0fff
            reg[0] &= 0x0fff
            if val == 'L':
                reg[0] |= 0x1000
            elif val == 'LM':
                reg[0] |= 0x2000
            elif val == 'M':
                reg[0] |= 0x3000
            elif val == 'MH':
                reg[0] |= 0x4000
            elif val == 'H':
                reg[0] |= 0x5000
            fan_attr |= (reg[0] & 0xf000)
        elif key == 'flap':
            fan_attr &= 0xf0ff
            reg[0] &= 0xf0ff
            if val == 'swing':
                reg[0] |= 0x0700
            else:
                reg[0] |= (val << 8)
            fan_attr |= (reg[0] & 0x0f00)
        elif key == 'filter_clr':
            if val:
                reg[1] |= 0xf0

    return reg, fan_attr

def send_command(device_id):

    # Exemplo de uso
    com = {
        'stat': 'on',
        'sp': '22.5',
        'mode': 'cool',
        'fanstep': 'M',
        'flap': 'swing',
        'filter_clr': True
    }

    reg = [0x0000, 0x0000, 0x0000]

    new_reg, fan_attr = convert_to_holding_reg(com, reg)

    print("Updated reg:", new_reg)
    print("Fan attr:", fan_attr)

    # Verifique se os valores são inteiros
    print("Types in new_reg:", [type(x) for x in new_reg])

    try:
        # Enviando o comando
        result = client.holding_registers(0x10, new_reg)
        if result.isError():
            print(result)
            return {"status": "error", "message": f"Failed to send command to device {device_id}"}
        return {"status": "success", "message": f"Command sent to device {device_id}"}
    except Exception as e:
        return {"status": "error", "message": f"Error sending command to device {device_id}: {e}"}

device_ids = [f'ha001-{str(i).zfill(5)}' for i in range(1, 21)]

response = send_command('ha001-00011')

print(response)

# Desconectando o cliente
client.close()
