#coding: utf-8

require 'rmodbus'
require 'serialport'
require_relative 'Device'
require_relative 'Ai'

# meters connects to the same modbus like up to 16
# each meter has meter type and address
class AlCo2 < HaiLin
	def initialize(id, data_man)
		super
		@speed = 115200
		@parity = 'NONE'
		@stopbit = 1

		@poling_wait = 2 
	end

	def key
		'al'
	end

	def connect_slave(client)
		connection_status = {}
		@sensors.each do |addr|
			connection_status[addr] = true
		end

		data = [nil,nil,nil,nil,nil] # PM2.5,CO2,temp,humi]
		data2 = []
		pm25 = []
		loop do
			@sensors.each do |addr|
				begin
					client.with_slave(addr) do |slave|
						data2 = slave.holding_registers[121..140]	# temp, humi, co2
						pm25 = slave.holding_registers[760..761] # PM2.5
						data[0] = pm25[0]+pm25[1] # PM2.5
						data[1] = data2[18] # co2
						data[2] = data2[0]/10.0 # temp
						data[3] = data2[19]/10.0  # humi
						send_cos(addr,data)
					end
					connection_status[addr] = true
				rescue => e
					puts e.backtrace
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

	def make_new_point(addr)
		# generate 4 points, 1:PM2.5, 2:CO2, 3:Temp, 4:Hum
		# if management point is not exist add management point with pid
		pid = ManagementPoint.get_id(addr*100 + 1,@dev_id)
		return {} if(@data_man.point_list[pid] != nil)

		pm25 = Ai.new(addr*100 + 1, @dev_id)
		pm25.name += '_PM2.5'
		pm25.set_attr({'unit_label'=>'µg/m3'})
		co2 = Ai.new(addr*100 + 2, @dev_id)
		co2.name += '_CO2'
		co2.set_attr({'unit_label'=>'ppm'})
		temp = Ai.new(addr*100 + 3, @dev_id)
		temp.name += '_Temperature'
		temp.set_attr({'unit_label'=>'°C'})
		hum = Ai.new(addr*100 + 4, @dev_id)
		hum.name += '_Humidity'
		hum.set_attr({'unit_label'=>'%'})

		return {pm25.id=>pm25,co2.id=>co2,temp.id=>temp,hum.id=>hum}
	end

	def send_cos(addr,data)
		1.upto 4 do |id|
			cos = {'com_stat'=>true,'error'=>false,'av'=>nil}
#			cos['error'] = true if(data[id-1] == 1)
			cos['av'] = data[id-1]
			# set new value to the management point
			@data_man.cos(addr*100+id,@dev_id,cos)
		end
	end

	def send_com_error(addr)
		1.upto 4 do |id|
			cos = {'com_stat'=>false}
			# set new value to the management point
			@data_man.cos(addr*100+id,@dev_id,cos)
		end
	end
end
