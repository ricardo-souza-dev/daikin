#coding: utf-8

require 'rmodbus'
require 'serialport'
require_relative 'Device'
require_relative 'Ai'

# meters connects to the same modbus like up to 16
# each meter has meter type and address
class HaiLin < Device
	def initialize(id, data_man)
		super
		@port = '/dev/ttyUSB0'
		@speed = 9600
		@parity = 'NONE'
		@stopbit = 1
		@parity_val = {'EVEN'=>SerialPort::EVEN,'NONE'=>SerialPort::NONE,'ODD'=>SerialPort::ODD}
		@sensors = []	# [addr,...]

		@poling_wait = 20 
	end

	def key
		'hl'
	end

	def device_attr
		{'port'=>@port,'speed'=>@speed,'parity'=>@parity,'stopbit'=>@stopbit,'sensors'=>@sensors}
	end

	def set_attribute(attr)
		@port = attr['port'] if(attr['port'] != nil)
		@speed = attr['speed'] if(attr['speed'] != nil)
		@parity = attr['parity'] if(attr['parity'] != nil)
		@stopbit = attr['stopbit'] if(attr['stopbit'] != nil)
		@sensors = attr['sensors'] if(attr['sensors'] != nil)
	end

	def changed?(attr)
		return true if(@port != attr['port'])
		return true if(@speed != attr['speed'])
		return true if(@parity != attr['parity'])
		return true if(@stopbit != attr['stopbit'])
		return true if(@sensors != attr['sensors'])
		return false
	end
	
	def connect
		@thread = Thread.new do
			hist_flag = true
			loop {
				puts "Connect to #{@port}, speed:#{@speed}, parity:#{@parity}, stop bit:#{@stopbit}"
				contents = ['try_connect_ms',@port,@speed,@parity,@stopbit]
				@data_man.add_history('System',contents) if(hist_flag)
				hist_flag = false

				# make new points of HaiLin IAQ sensor
				new_points = {}
				sensors = []
				@sensors.each do |addr|
					addr = addr.to_i
					sensors.push(addr)
					new_points = make_new_point(addr) 
					@data_man.update_point_list(new_points)
				end
				@sensors = sensors

				begin
					ModBus::RTUClient.connect(@port, @speed, {:data_bits => 8, :stop_bits => @stopbit, :parity => @parity_val[@parity], :read_timeout => 1000}) do |cl| # read timeout change from 100 for stability 30/04/2017
						hist_flag = true
						connect_slave(cl)
					end					
				rescue => e
					puts "Error: #{e}"
				end
				sleep 5
			}
		end
	end

	def connect_slave(client)
		connection_status = {}
		@sensors.each do |addr|
			connection_status[addr] = true
		end

		loop do
			@sensors.each do |addr|
				begin
					client.with_slave(addr) do |slave|
						data = slave.holding_registers[2..15]
						send_cos(addr,data)
					end
					connection_status[addr] = true
				rescue
					dev_disconnected('disconnected_ms',addr)
					connection_status[addr] = false
				end
			end
			reconnect = true
			connection_status.each do |addr,flag|
				if(flag == true)
					reconnect = false
					break
				end
			end
			raise "Modbus connection error" if(reconnect == true)
			sleep @poling_wait
		end
	end

	def dev_disconnected(dev,addr)
		@data_man.add_history('System',[dev,addr])
		send_com_error(addr)
	end

	def make_new_point(addr)
		# generate 5 points, 1:PM2.5, 2:CO2, 3:TVOC, 4:Temp, 5:Hum
		# if management point is not exist add management point with pid
		pid = ManagementPoint.get_id(addr*100 + 1,@dev_id)
		return {} if(@data_man.point_list[pid] != nil)

		pm25 = Ai.new(addr*100 + 1, @dev_id)
		pm25.name += '_PM2.5'
		pm25.set_attr({'unit_label'=>'µg/m3'})
		co2 = Ai.new(addr*100 + 2, @dev_id)
		co2.name += '_CO2'
		co2.set_attr({'unit_label'=>'ppm'})
#		tvoc = Ai.new(addr*100 + 3, @dev_id)
#		tvoc.name += '_TVOC'
		temp = Ai.new(addr*100 + 4, @dev_id)
		temp.name += '_Temperature'
		temp.set_attr({'unit_label'=>'°C'})
		hum = Ai.new(addr*100 + 5, @dev_id)
		hum.name += '_Humidity'
		hum.set_attr({'unit_label'=>'%'})

#		return {pm25.id=>pm25,co2.id=>co2,tvoc.id=>tvoc,temp.id=>temp,hum.id=>hum}
		return {pm25.id=>pm25,co2.id=>co2,temp.id=>temp,hum.id=>hum}
	end

	def send_cos(addr,data)
		1.upto 5 do |id|
			next if(id == 3) # skip TVOC
			cos = {'com_stat'=>true,'error'=>false,'av'=>nil}
			cos['error'] = true if(data[id-1] == 1)
			cos['av'] = data[id+6]
			cos['av'] /= 10.0 if(id == 4) # temperature
			# set new value to the management point
			@data_man.cos(addr*100+id,@dev_id,cos)
		end
	end

	def send_com_error(addr)
		1.upto 5 do |id|
			next if(id == 3) # skip TVOC
			cos = {'com_stat'=>false}
			# set new value to the management point
			@data_man.cos(addr*100+id,@dev_id,cos)
		end
	end
end
