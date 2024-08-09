#coding: utf-8

require_relative 'Pi'

class SmartPi < Pi
	def initialize(pid,dev_id)
		super
		@unit_label = 'kWh'
		@power_unit_label = 'W'

		@type = 'W'

		@power = 0
	end

	def point_type
		'SPi'
	end

	# get_attribute relate method
	def attribute
		super.merge({'sub_unit_label'=>@power_unit_label})
	end

	# get_status relate method
	def current_status
		super.merge({'power'=>@power})
	end

	def store_sample_value(time,db)
		db.add_analog(id,@type,time,@power)
	end

	def update_power(val,cos)
		cos['power'] = val if(@ready and @power != val)
		@power = val
	end
end
