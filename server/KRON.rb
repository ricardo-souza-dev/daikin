#coding: utf-8

require 'bigdecimal'
require_relative 'SmartPiMb'

class KRON < SmartPiMb
	def initialize(pid,dev_id)
		super
		@unit_label = 'kWh'
		@unit_lavel_power = 'kWh'

		@energy_addr = 0x34  #30053,54  32bit float kWh
		@power_addr = 0x0c #30013,14 32bit float W
	end

	def read_data(slave)
		meter = 0
		power = 0
		meter = slave.input_registers[energy_addr] if(energy_addr != nil)
		power = slave.input_registers[power_addr] if(power_addr != nil)
		@ready = true
		# has to convert value to float
		# [29760, 41669] ==> to float
		meter = b_to_f(byte_orderB(meter))
		meter = BigDecimal(meter.to_s).floor(2).to_f
		power = b_to_f(byte_orderB(power))/1000
		power = BigDecimal(power.to_s).floor(2).to_f
		return {'com_stat'=>true,'meter'=>meter,'power'=>power}
	end

	def energy_addr
		@energy_addr..@energy_addr+1
	end
	def power_addr
		@power_addr..@power_addr+1
	end
end
