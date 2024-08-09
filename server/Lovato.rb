#coding: utf-8

require 'bigdecimal'
require_relative 'SmartPiMb'

class Lovato < SmartPiMb
	def initialize(pid,dev_id)
		super
		@unit_label = 'kWh'
		@unit_lavel_power = 'kW'

		@energy_addr = 0x1A1F  #0x1A20,1A21    32bit int*100 kWh
		@power_addr = 0x39   # 0x3A,3B 32bit int*100 W
	end

	def read_data(slave)
		meter = 0
		power = 0
		meter = slave.input_registers[energy_addr] if(energy_addr != nil)
		power = slave.input_registers[power_addr] if(power_addr != nil)
		@ready = true
		# has to convert value to long int
		meter = BigDecimal.new((meter[0]<<16|meter[1]).to_s)
		meter = (meter/100).floor(2).to_f
		power = BigDecimal.new((power[0]<<16|power[1]).to_s)
		power = (power/100000).floor(3).to_f
		return {'com_stat'=>true,'meter'=>meter,'power'=>power}
	end

	def energy_addr
		@energy_addr..@energy_addr+1
	end
	def power_addr
		@power_addr..@power_addr+1
	end
end
