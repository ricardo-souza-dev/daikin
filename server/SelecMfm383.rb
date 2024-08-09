#coding: utf-8

require 'bigdecimal'
require_relative 'SmartPiMb'

class SelecMfm383 < SmartPiMb
	def initialize(pid,dev_id)
		super
		@unit_label = 'kWh'
		@unit_lavel_power = 'kW'

		@energy_addr = 58  # 58,59 32bit float kWh
		@power_addr = 42   # 42,43 32bit float kW
		@amp_addr = 22	# 22,23 32bit float A
	end

	def read_data(slave)
		meter = 0
		power = 0
		meter = slave.input_registers[energy_addr] if(energy_addr != nil)
		power = slave.input_registers[power_addr] if(power_addr != nil)
		amp = slave.input_registers[amp_addr] if(amp_addr != nil)
		@ready = true
		# has to convert value to long int
		meter = b_to_f(byte_orderD(meter))
		meter = BigDecimal(meter.to_s).floor(2).to_f

		power = b_to_f(byte_orderD(power))
		power = BigDecimal(power.to_s).floor(3).to_f

		amp = b_to_f(byte_orderD(amp))
		return {'com_stat'=>true,'meter'=>meter,'power'=>power,'amp'=>amp}
	end

	def energy_addr
		@energy_addr..@energy_addr+1
	end
	def power_addr
		@power_addr..@power_addr+1
	end
	def amp_addr
		@amp_addr..@amp_addr+1
	end
end
