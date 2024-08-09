#coding: utf-8
require_relative 'Dio'

class DiZw < Di
	def initialize(pid,dev_id)
		super
	end

	def set_dev_attr(attr)
		@battery_enable = true if(attr['pointData']['battery'] != nil)
	end

	def update_av(val,cos,time)
		stat = 'off'
		stat = 'on' if(val > 0)
		update_statv(stat,cos,nil)
	end
end

class AlarmZw < Di
	def initialize(pid,dev_id)
		super
		@alert = true
		@alarm_type = ''
	end

	def set_dev_attr(attr)
		@battery_enable = true if(attr['pointData']['battery'] != nil)
		@alarm_type = attr['pointData']['stat']['attr']['alarmType'] if(attr['pointData']['stat']['attr'] != nil)
		@name += "(#{@alarm_type})" if(@alarm_type.length > 0)		
	end

end

class DioZw < Dio
	def initialize(pid,dev_id)
		super
	end

	def set_dev_attr(attr)
		@battery_enable = true if(attr['pointData']['battery'] != nil)
	end
end

class KeyLockZw < Dio
	def initialize(pid,dev_id)
		super
	end

	def point_type
		'KeyLock'
	end

	def check_stat(val,com,stat)
		return if(@on_proh == true and val == 'on')
		com['lock'] = val 
	end

	def check_lock(val,com,stat)
		return if(@on_proh == true and val == 'on')
		com['lock'] = val 
	end

	def set_dev_attr(attr)
		@battery_enable = true if(attr['pointData']['battery'] != nil)
	end	

	def update_statv(val,cos,time)
		super
		if(@notification)
			cos.delete('notify') if(cos['notify'] != nil)
			cos['notify'] = 'lock_open' if(cos['stat'] != nil && cos['stat'] == 'off')
		end
	end
end

class ShutterZw < Dio
	def initialize(pid,dev_id)
		super
		@level = nil
		@last_com = nil
	end

	def point_type
		'Shutter'
	end

	def set_dev_attr(attr)
		@battery_enable = true if(attr['pointData']['battery'] != nil)
	end	

	def update_updown(val,cos)
		if(@ready == true && @stat != val)
			cos['updown'] = val
		end 
		@stat = val
	end

	def update_level(val,cos,time)
		@level = val.to_i
	end

	def current_status
		super.merge({'updown'=>@stat})
	end

	def check_updown(val,com,stat)
		if(val == 'stop')
			return if(@last_com == nil)
			if(@last_com.include?('on') && @level != 100)
				val = 'off'
			elsif(@last_com.include?('off') && @level != 0)
				val = 'on'
			else
				@last_com = nil
				return
			end
		end
		@last_com = val
		com['updown'] = val #if(val != @stat)
	end
end

class Shutter2Zw < ShutterZw
	def check_updown(val,com,stat)
		if(val == 'stop')
			return if(@last_com == 'stop')
			ofset = 5
			ofset *= -1 if(@last_com == 'off')
			if(@level != nil)
				val = @level+ofset 
				val = 99 if(val > 99)
				val = 0 if(val < 0)
			else
				val = @last_com
			end
			@last_com = 'stop'
		else
			@last_com = val
		end
		com['updown'] = val #if(val != @stat)
	end

end