#coding: utf-8

require 'bigdecimal'
require_relative 'SmartPiMb'

class ShPM5300 < SmartPiMb
	def initialize(pid,dev_id)
		super
		@unit_label = 'kWh'
		@unit_lavel_power = 'kW'

		@energy_addr = 3203  # 3204,3205,3206,3207 64bit int Wh
		@power_addr = 3059   # 3060,3061 32bit float kW
		@amp_addr = 3009	#3010,3011 float A
	end

	def read_data(slave)
		meter = 0
		power = 0
		meter = slave.holding_registers[energy_addr] if(energy_addr != nil)
		power = slave.holding_registers[power_addr] if(power_addr != nil)
		amp = slave.holding_registers[amp_addr] if(amp_addr != nil)
		@ready = true
		# has to convert value to long int
#		meter = BigDecimal.new((meter[1]<<48|meter[0]<<32|meter[3]<<16|meter[2]).to_s)
		meter = BigDecimal.new((meter[0]<<48|meter[1]<<32|meter[2]<<16|meter[3]).to_s)
		meter = (meter/1000).floor(3).to_f

		power = b_to_f(byte_orderA(power))
		power = BigDecimal(power.to_s).floor(4).to_f

		amp = b_to_f(byte_orderA(amp))
		return {'com_stat'=>true,'meter'=>meter,'power'=>power,'amp'=>amp}
	end

	def energy_addr
		@energy_addr..@energy_addr+3
	end
	def power_addr
		@power_addr..@power_addr+1
	end
	def amp_addr
		@amp_addr..@amp_addr+1
	end
end
