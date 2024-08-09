# encoding: utf-8

require_relative 'Dio'
require_relative 'GpioPin'
require_relative 'InternalDi'

class InternalDo < InternalDi
	def initialize(id,dataman)
		super

		# terminal to use as Di and Do
		# usable pins are 2,3,4,5,6,13,19,26,15,8,7,12,16,20,21
#		@gpio = [9,11,5,6,13,19,26,25,8,7,12,16,20]
		@gpio = [11,5,6,13,19,26]
		@pins = []	# pin object array
	end

	def key
		'IntDo'
	end
	
	def set_attribute(attr)
		@gpio = attr['pin']
		@gpio.each do |p|
			@pins.push(GpioPin.new(p, 'out',true))
		end
	end

	def connect
		Thread.new do
			puts "Starat monitoring internal Do"
			contents = ['con_int_do']
			@data_man.add_history('System',contents)
			@data_man.update_point_list(generate_point)
			#send initial status
			1.upto @pins.length do |pid|
				pin = @pins[pid-1]
				stat = {'stat'=>pin.stat,'com_stat'=>true}
				@data_man.cos(pid,@dev_id,stat)
			end
			loop {
				1.upto @pins.length do |pid|
					pin = @pins[pid-1]
					stat = pin.stat
					if(pin.changed?) #last_value != pin.value)
						stat = {'stat'=>stat}
						@data_man.cos(pid,@dev_id,stat)
					end
				end
				send_command(@com_queue)
				sleep 0.5	# wait 0.5 sec
			}
		end
	end

	def generate_point
		point_list = {}
		1.upto @pins.length do |pid|
			point = Dio.new(pid,@dev_id)
			point_list[point.id] = point
		end
		return point_list
	end

	# send command to device
	def send_command(queue)
		while(queue.empty? == false)
			command = queue.pop 	# command is [id,{command}]
			id = command[0]
			com = command[1]
			next if(com.empty? == true)
			puts "SEND COMMAND #{id} #{com}"
			# 
			pin = @pins[id-1]
			pin.write(com['stat']) if(pin != nil)
		end
	end
end