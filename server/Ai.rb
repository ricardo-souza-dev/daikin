#coding: utf-8

require_relative 'ManagementPoint'

class Ai < ManagementPoint
	def initialize(pid,dev_id)
		super
		# attribute of point
		@unit_label = ''
		@icon='AI.png'
		# point status
		@av = nil
		@limit_monitor = [false,false]
		@limit = [nil,nil]
		@type = 'std'
		@cal = 0	# calibration it shoud set (actual valuee - sensor value)
		@limit_error = [false,false]
	end

	attr_reader :unit_label

	def point_type
		'Ai'
	end
	
	# get_attribute relate method
	def attribute
		super.merge({'unit_label'=>@unit_label,'ulimit_monitor'=>@limit_monitor[1],'ulimit'=>@limit[1],'llimit_monitor'=>@limit_monitor[0],'llimit'=>@limit[0],'calibration'=>@cal})
	end

	# get_status relate method
	def current_status
		super.merge({'av'=>@av,'ulimit_monitor'=>@limit_monitor[1],'ulimit'=>@limit[1],'llimit_monitor'=>@limit_monitor[0],'llimit'=>@limit[0]})
	end

	def get_snapshot
		super.merge({'ulimit_monitor'=>@limit_monitor[1],'ulimit'=>@limit[1],'llimit_monitor'=>@limit_monitor[0],'llimit'=>@limit[0]})
	end

	# set_attribute relate method
	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'unit_label'
				@unit_label = val
			when 'ulimit_monitor'
				@limit_monitor[1] = val
			when 'ulimit'
				@limit[1] = val
			when 'llimit_monitor'
				@limit_monitor[0] = val
			when 'llimit'
				@limit[0] = val
			when 'calibration'
				@cal = val
			end
		end
	end
	
	# operation relate method
	def check_ulimit_monitor(val,com,stat)
		stat['ulimit_monitor'] = val #if(val != @limit_monitor[1])
	end
	def check_ulimit(val,com,stat)
		stat['ulimit'] = val #if(val != @limit[1])
	end
	def check_llimit_monitor(val,com,stat)
		stat['llimit_monitor'] = val #if(val != @limit_monitor[0])
	end
	def check_llimit(val,com,stat)
		stat['llimit'] = val #if(val != @limit[0])
	end

	# update_status relate method
	def update_av(val,cos,time)
		val = nil if(val.class == Float && val.nan? == true)
		return if(val == nil)
		val = (val+@cal).round(2)
		cos['av'] = val if(@ready and @av != val)
		@av = val
		check_limitation(cos)
	end
	def update_error(val,cos)
		return if(@limit_error.include?(true) && val == false)

		cos['error'] = val if(@ready and @error != val)
		@error = val
	end
	def update_ulimit_monitor(val,cos)
		update = false
		(cos['ulimit_monitor'] = val; update=true) if(@ready and @limit_monitor[1] != val)
		@limit_monitor[1] = val
		return update
	end
	def update_ulimit(val,cos)
		update = false
		(cos['ulimit'] = val; update=true) if(@ready and @limit[1] != val)
		@limit[1] = val
		return update
	end
	def update_llimit_monitor(val,cos)
		update = false
		(cos['llimit_monitor'] = val; update=true) if(@ready and @limit_monitor[0] != val)
		@limit_monitor[0] = val
		return update
	end
	def update_llimit(val,cos)
		update = false
		(cos['llimit'] = val; update=true) if(@ready and @limit[0] != val)
		@limit[0] = val
		return update
	end

	def check_limitation(cos)
		return {} if(@av == nil)
		if(@limit_monitor[1] == true)
			if(@limit[1] != nil && @limit[1] < @av)
				return {} if(@limit_error[1] == true)
				# upper limit error
				@error = @limit_error[1] = cos['error'] = true
				@err_code = cos['err_code'] = 'ulimit'
				@err_code = 'ulimit'
			else
				return {} if(@error == false)
				@error = @limit_error[1] = cos['error'] = false
				@err_code = nil;
			end
		elsif(@limit_monitor[0] == true)
			if(@limit[0] != nil && @limit[0] > @av)
				return {} if(@limit_error[0] == true)
				# lower limit error
				@error = @limit_error[0] = cos['error'] = true
				@err_code = cos['err_code'] = 'llimit'
			else
				return {} if(@error == false)
				@error = @limit_error[0] = cos['error'] = false
				@err_code = nil;
			end
		end
		{}
	end

	def store_sample_value(time,db)
		db.add_analog(id,@type,time,@av)
	end

	def set_init_status(status)
		super
		status.each do |key, val|
			case key
			when 'ulimit_monitor'
				@limit_monitor[1] = val
			when 'ulimit'
				@limit[1] = val
			when 'llimit_monitor'
				@limit_monitor[0] = val
			when 'llimit'
				@limit[0] = val
			end
		end
	end
end


class Ao < Ai
	def initialize(pid,dev_id)
		super
		# attribute of point
		@icon='AI.png'
		@ao_range = [0,100]
		@ao_step = 1
		@manual_op_cap = true
	end

	def point_type
		'Ao'
	end

	# get_attribute relate method
	def attribute
		super.merge({'ao_min'=>@ao_range[0],'ao_max'=>@ao_range[1],'ao_step'=>@ao_step,'manual_op_cap'=>@manual_op_cap})
	end

	# set_attribute relate method
	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'ao_min'
				@ao_range[0] = val
			when 'ao_max'
				@ao_range[1] = val
			when 'ao_step'
				@ao_step = val
			when 'manual_op_cap'
				@manual_op_cap = val
			end
		end
	end

	# operation relate method
	def check_av(val,com,stat)
		val = @ao_range[1] if(val > @ao_range[1])
		val = @ao_range[0] if(val < @ao_range[0])
		com['av'] = val if(val != @av)
	end
end
