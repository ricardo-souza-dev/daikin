#coding: utf-8

require_relative 'Dio'

class RoomOcc < Di
	def initialize(pid, dev_id)
		super
		@duration = 60	# default duration 60sec
		@prewait = 60
		@door = nil			# door sensor point id
		@sensors = []		# motion sensor point id array
		@wait_th = nil

		@stat = 'off'
	end

	attr_accessor :door, :sensor

	def attribute
		super.merge({'duration'=>@duration,'prewait'=>@prewait,'door'=>@door,'sensors'=>@sensors})
	end

	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'duration'
				@duration = val
			when 'prewait'
				@prewait = val
			when 'door'
				@door = val
			when 'sensors'
				@sensors = val
			end
		end		
	end

	def init(data_man)
		# check sensor if it is on
#		puts "*********** CHECK INIT STATUS #{all_sensor_off?} #{@stat}"
		@stat = "on" if(all_sensor_off? == false)
		data_man.cos_internal(self.id,{"com_stat"=>true,"stat"=>@stat}) 
	end

	def update_statp(val,id)
    cos = {}	    
		if(id == @door)
			return if(val == 'on')	# door is opened
			return if(@stat == 'off')
			return if(@wait_th != nil)
			# check if all sensor is off
			# if on then nothing happen
			# watch sensor status for duration sec to off
			@wait_th = Thread.new do
				begin
#					puts "START TO CHECK OCC"
					sleep @prewait
					if(all_sensor_off? == false)
						@wait_th = nil
					else
						sleep @duration
						# status will be off
				    cos['stat'] = 'off' 
				    $data_man.cos_internal(self.id,cos) if(@ready)
				  end
			  ensure
#			  	puts "THREAD IS END"
				end
			end
		else	# sensor status
			return if(val == 'off')
#			puts "KILL WAITING THREAD" 
			@wait_th.kill if(@wait_th != nil)# kill wait thread to off
			@wait_th = nil
	    if(val.class == String && @stat == 'off')
		    cos['stat'] = 'on' # set on
		    $data_man.cos_internal(self.id,cos) if(@ready)
		  end
		end
	end

	def all_sensor_off?
		@sensors.each do |id|
			point = $data_man.point_list[id]
			next if(point == nil)
			begin
				return false if(point.stat == 'on')
			rescue
			end
		end
		return true
	end
end

############################################
# usage of RoomOcc
# 
# Di of door sensor and motion sensors does not registere as children
# Door sensor id have to registere as door
# Motion sensor id array have to registere as sensors
# Door sensor, motion sensor has to set RoomOcc id as a parent
#
# sample
# ["RoomOcc",{"type":"Di","subtype":null,"usage":null,"id":"***","pid":*,"dev_id":"***","name":"OccStat","icon":"DIO.png","attr":{"ppd":false,"parent":null,"children":null,"hide":false,"notuse":false,"battery":false,"notification":false, "inv":false, "alert":false,"offdelay":0,"duration":60,"prewait":60,"door":door_sensor,"sensors":[motion_sensor]}}]
# ["Di",{"type":"Di","subtype":null,"usage":null,"id":"***","pid":*,"dev_id":"***","name":"Door Sensor","icon":"DIO.png","attr":{"ppd":false,"parent":OccStat,"children":nil,"hide":false,"notuse":false,"battery":false,"notification":false, "inv":false, "alert":false,"offdelay":0}}]
# ["Di",{"type":"Di","subtype":null,"usage":null,"id":"***","pid":*,"dev_id":"***","name":"Motion Sensor","icon":"DIO.png","attr":{"ppd":false,"parent":OccStat,"children":nil,"hide":false,"notuse":false,"battery":false,"notification":false, "inv":false, "alert":false,"offdelay":0}}]

