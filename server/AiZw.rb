#coding: utf-8

require_relative 'Ai'
require_relative 'Dio'

class AiZw < Ai
	def initialize(pid,dev_id)
		super
		@sensor_type = ''
	end

	def attribute
		super.merge({'sensor_type'=>@sensor_type})
	end

	def set_dev_attr(attr)
		begin
			@battery_enable = true if(attr['pointData']['battery'] != nil)
			@unit_label = attr['pointData']['av']['attr']['unit']
			@sensor_type = attr['pointData']['av']['attr']['sensorType'] if(attr['pointData']['av']['attr']['sensorType'] != nil)
			@name += "(#{@sensor_type})" if(@sensor_type.length > 0)
		rescue
			puts "DATA ERROR to set point attribute #{@pid}"
		end
	end		
end

class LevelSwitch < Dio
	def initialize(pid,dev_id)
		super
		@unit_label = ''
		@icon='AI.png'
		# point status
		@av = nil
		@last_av = nil
		@ao_range = [0,100]
		@ao_step = 1
		@zw_range = [0,100]
	end

	attr_reader :unit_label

	def point_type
		'LevelSw'
	end

	def attribute
		super.merge({'unit_label'=>@unit_label,'ao_min'=>@ao_range[0],'ao_max'=>@ao_range[1],'ao_step'=>@ao_step,'zw_min'=>@zw_range[0],'zw_max'=>@zw_range[1]})
	end

	def current_status
		super.merge({'av'=>@av})
	end

	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'unit_label'
				@unit_label = val
			when 'ao_min'
				@ao_range[0] = val
			when 'ao_max'
				@ao_range[1] = val
			when 'ao_step'
				@ao_step = val
			when 'zw_min'
				@zw_range[0] = val
			when 'zw_max'
				@zw_range[1] = val
			end
		end
	end

	def check_stat(val,com,stat)
		return if(@on_proh == true and val == 'on')
		if(val == 'on')
			com['av'] = to_zw(@last_av)
		else
			com['av'] = 0
		end
	end
	def check_av(val,com,stat)
		val = @ao_range[1] if(val > @ao_range[1])
		val = @ao_range[0] if(val < @ao_range[0])
		val = to_zw(val)	# convert from management point to zwave device
		com['av'] = val if(val != @av)
	end

	def update_statv(val,cos,time)
		# ignore super class method
#		return if(self.instance_of?(LevelSwitch) == true || self.instance_of?(RgbLevel) == true)
#		super
	end

	def update_level(val,cos,time,zwflag = true)
		val = nil if(val.class == Float && val.nan? == true)
		return if(val == nil)
		# val come from zwave device
		# val has to convert depend on zw_range and ao_range
		val = from_zw(val) if(zwflag == true)
		if(@av != val)
			cos['av'] = val 
			@last_av = @av if(@av != 0)
			@av = val
			if(val == 0 && (@stat == nil || @stat == 'on'))
				cos['stat'] = 'off'
				@stat = 'off'
				stop_count(time)
			elsif(val != 0 && (@stat == nil || @stat == 'off'))
				cos['stat'] = 'on'
				@stat = 'on'
				start_count(time)
				@on_times += 1
			end
		end
	end

	def set_dev_attr(attr)
		@battery_enable = true if(attr['pointData']['battery'] != nil)
		@unit_label = '%'
		if(attr['pointData']['av'] != nil)
			@ao_range[0] = attr['pointData']['av']['attr']['min']
			@ao_range[1] = attr['pointData']['av']['attr']['max']
		elsif(attr['pointData']['level'] != nil)
			@ao_range[0] = attr['pointData']['level']['attr']['min']
			@ao_range[1] = attr['pointData']['level']['attr']['max']
		end
		@ao_step = 1
	end		

	def update_attr(point)
		save = super
		if(point.unit_label != @unit_label)
			@unit_label = point.unit_label
			save = true
		end
		return save
	end

	def from_zw(val)
		# val come from zwave device
		ret = ((val-@zw_range[0])*100.0/(@zw_range[1]-@zw_range[0])).to_i
		ret = 1 if(ret == 0 && val != 0)
		ret = 0 if(ret < 0)
		ret = 100 if(ret > 99)
		return ret
	end

	def to_zw(val)
		# val is point value		
		return @zw_range[1] if(val == nil)
		return 0 if(val == 0)
		return val*(@zw_range[1]-@zw_range[0])/100+@zw_range[0]
	end
end

class RgbLevel < LevelSwitch
	def initialize(pid,dev_id)
		super
		@r = nil
		@last_r = nil
		@g = nil
		@last_g = nil
		@b = nil
		@last_b = nil
		@w = nil
		@last_w = nil
	end

	def point_type
		'RgbLevel'
	end

	def current_status
		super.merge({'r'=>@r,'g'=>@g,'b'=>@b,'w'=>@w})
	end

	def check_r(val,com,stat)
		val = @ao_range[1] if(val > @ao_range[1])
		val = @ao_range[0] if(val < @ao_range[0])
		val = to_zw(val)	# convert from management point to zwave device
		com['r'] = val if(val != @r)
	end
	def check_g(val,com,stat)
		val = @ao_range[1] if(val > @ao_range[1])
		val = @ao_range[0] if(val < @ao_range[0])
		val = to_zw(val)	# convert from management point to zwave device
		com['g'] = val if(val != @g)
	end
	def check_b(val,com,stat)
		val = @ao_range[1] if(val > @ao_range[1])
		val = @ao_range[0] if(val < @ao_range[0])
		val = to_zw(val)	# convert from management point to zwave device
		com['b'] = val if(val != @b)
	end
	def check_w(val,com,stat)
		val = @ao_range[1] if(val > @ao_range[1])
		val = @ao_range[0] if(val < @ao_range[0])
		val = to_zw(val)	# convert from management point to zwave device
		com['w'] = val if(val != @w)
	end

	def update_level(val,cos,time,zwflag = true)
		val = nil if(val.class == Float && val.nan? == true)
		return if(val == nil)
		# val come from zwave device
		# val has to convert depend on zw_range and ao_range
		val = from_zw(val) if(zwflag == true)
		if(@av != val)
			cos['av'] = val 
			@last_av = @av if(@av != 0)
			@av = val
			if(val == 0 && (@stat == nil || @stat == 'on'))
				cos['stat'] = 'off'
				@stat = 'off'
				stop_count(time)
			elsif(val != 0 && (@stat == nil || @stat == 'off'))
				cos['stat'] = 'on'
				@stat = 'on'
				start_count(time)
				@on_times += 1
			end
		end
	end

	def update_r(val,cos,zwflag = true)
		val = nil if(val.class == Float && val.nan? == true)
		return if(val == nil)
		# val come from zwave device
		# val has to convert depend on zw_range and ao_range
		val = from_zw(val) if(zwflag == true)
		if(@r != val)
			cos['r'] = val 
			@last_r = @r if(@r != 0)
			@r = val
		end
	end

	def update_g(val,cos,zwflag = true)
		val = nil if(val.class == Float && val.nan? == true)
		return if(val == nil)
		# val come from zwave device
		# val has to convert depend on zw_range and ao_range
		val = from_zw(val) if(zwflag == true)
		if(@g != val)
			cos['g'] = val 
			@last_g = @r if(@g != 0)
			@g = val
		end
	end

	def update_b(val,cos,zwflag = true)
		val = nil if(val.class == Float && val.nan? == true)
		return if(val == nil) if(zwflag == true)
		# val come from zwave device
		# val has to convert depend on zw_range and ao_range
		val = from_zw(val)
		if(@b != val)
			cos['b'] = val 
			@last_b = @r if(@b != 0)
			@b = val
		end
	end

	def update_w(val,cos,zwflag = true)
		val = nil if(val.class == Float && val.nan? == true)
		return if(val == nil) if(zwflag == true)
		# val come from zwave device
		# val has to convert depend on zw_range and ao_range
		val = from_zw(val)
		if(@w != val)
			cos['w'] = val 
			@last_w = @r if(@w != 0)
			@w = val
		end
	end
end