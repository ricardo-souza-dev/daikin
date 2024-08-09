# coding: utf-8

require_relative 'Dio'
require_relative 'Ai'
require_relative 'AiZw'
require_relative 'SmartPi'

class DiWago < Di
	def initialize(pid,dev_id)
		super
		@hide = false
		@notuse = false
	end
end

class DioWago < Dio
	def initialize(pid,dev_id)
		super
		@hide = false
		@notuse = false
	end
end

class AiWago < Ai
	def initialize(pid,dev_id)
		super
		@range = [0,100.0]
		@round = 1
		@hide = false
		@notuse = false
	end

	def attribute
		super.merge({'range'=>@range,'round'=>@round})
	end

	def set_attr(attr)
		super
		range = attr['range']
		if(range != nil && range[0] < range[1])
			@range[0] = range[0]
			@range[1] = range[1]
		end
		@round = attr['round'] if(attr['round'] != nil)
	end

	def update_av(val,cos,time)
		nv = (@range[1]-@range[0])*val+@range[0]
		nv = nv.round(@round)
		super(nv,cos,time)
	end
end

class AoWago < Ao
	def initialize(pid,dev_id)
		super
		@round = get_round
		@hide = false
		@notuse = false
	end

	def set_attr(attr)
		super
		@round = get_round
	end

	def update_av(val,cos,time)
		nv = (@ao_range[1]-@ao_range[0])*val+@ao_range[0]
		nv = nv.round(@round)
		super(nv,cos,time)
	end

	def check_av(val,com,stat)
		super(val,com,stat)
		if(com['av'] != nil)
			com['av'] = (val-@ao_range[0]).to_f/(@ao_range[1]-@ao_range[0])
		end
	end

	def get_round
		ar = @ao_step.to_s.split('.')
		if(ar.length == 1)	# more than 0
			dig = ar[0].reverse
			0.upto dig.length-1 do |d|
				return -d if(dig[d] != '0')
			end
			return ar[0].length-1
		else # less than 0
			return ar[1].length
		end
	end
end

class LevelSwWago < LevelSwitch
	def check_stat(val,com,stat)
		return if(@on_proh == true and val == 'on')
		if(val == 'on')
			@last_av = 100 if(@last_av == nil)
			com['av'] = @last_av
		else
			com['av'] = 0
		end
	end
	def check_av(val,com,stat)
		val = @ao_range[1] if(val > @ao_range[1])
		val = @ao_range[0] if(val < @ao_range[0])
		com['av'] = val if(val != @av)
	end

	def update_level(val,cos,time,zwflag = false)
		val = nil if(val.class == Float && val.nan? == true)
		return if(val == nil)
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
		@battery_enable = false
		@unit_label = attr['unit_label'] # %
		@ao_range[0] = attr['ao_min']  # 0
		@ao_range[1] = attr['ao_max']  # 100
		@ao_step = attr['ao_step']     # 1
	end		
end
