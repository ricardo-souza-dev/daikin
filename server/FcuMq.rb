#coding: utf-8

require_relative 'Dio'

class FcuMq < Dio
	def initialize(pid,dev_id)
		super
		@icon = 'FXMQ.png'
		@fan_steps = {0=>'Stop',1=>'Ultra Low',2=>'Low',3=>'Mid Low',4=>'Mid',5=>'Mid High',6=>'High',7=>'Ultra High',0x80=>'Auto'}
		@fanstep = 0	# 0: stop, 1: Ultra Low, ...7: Ulrtra High, & 0x80: Auto bit
	end

	def point_type
		'FcuMq'
	end

	# get_attribute relate method
	def attribute
		super.merge({'fan_steps'=>@fan_steps})
	end

	# get_status relate method
	def current_status
		super.merge({'fanstep'=>@fanstep})
	end

	# operation relate method
	def check_fanstep(val,com,stat)
		com['fanstep'] = val #if(val != @fanstep)
	end

	# update_status relate method
	# val is from 1 to 7 and 0x80
	def update_fanstep(val,cos)
		cos['fanstep'] = val if(@ready and @fanstep != val)
		@fanstep = val
	end
end
