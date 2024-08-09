#coding: utf-8

require_relative 'ManagementPoint'

class EmbAhu < ManagementPoint
	def initialize(pid,dev_id)
		super
		# attribute of point
		@icon='AHU.png'
		# point status
		@rpm = nil
		@av = nil
	end

	def point_type
		'EmbAHU'
	end
	
	# get_attribute relate method
	def attribute
		super.merge({'ao_min'=>0,'ao_max'=>100,'ao_step'=>1})
	end

	# get_status relate method
	def current_status
		super.merge({'rpm'=>@rpm,'av'=>@av})
	end

	def get_snapshot
		super.merge({})
	end

	# set_attribute relate method
	def set_attr(attr)
		super
	end
	
	# operation relate method
	# operation is 0 to 100%
	def check_av(val,com,stat)
		val = @max_rpm if(val > 100)
		val = 0 if(val < 0)
		com['av'] = val if(val != @av)
	end

	# update_status relate method
	def update_av(val,cos)
		cos['av'] = val if(@ready and @av != val)
		@av = val
	end
	
	def update_rpm(val,cos)
		cos['rpm'] = val if(@ready and @rpm != val)
		@rpm = val
	end
end

