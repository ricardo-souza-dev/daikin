# encoding: utf-8

require_relative 'Dio'
require_relative 'GpioPin'

class InternalDi < Device
	def initialize(id,dataman)
		super

		# terminal to use as Di
		# usable pins are 2,3,4,5,6,13,19,26,15,8,7,12,16,20,21
#		@gpio = [9,11,5,6,13,19,26,25,8,7,12,16,20]
		@gpio = [25,8,7,12,16,20]
		@pins = []	# pin object array
	end

	def key
		'Int'
	end

	def set_attribute(attr)
		gpio = attr['pin']
		@gpio = gpio if(gpio != nil)
		@gpio.each do |p|
			@pins.push(GpioPin.new(p, 'in'))
		end
	end
	
	def connect
		Thread.new do
			puts "Starat monitoring internal Di"
			contents = ['con_int_di']
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
				sleep 0.5	# wait 0.5 sec
			}
		end
	end

	def generate_point
		point_list = {}
		1.upto @pins.length do |pid|
			point = Di.new(pid,@dev_id)
			point_list[point.id] = point
		end
		return point_list
	end
end