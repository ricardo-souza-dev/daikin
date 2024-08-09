#coding: utf-8

require 'rmodbus'
require 'serialport'
require_relative 'Device'
require_relative 'Ai'
require_relative 'HaiLin'

# Tongdy IAQ sensor connects to the same modbus like up to 30
class Tongdy < HaiLin
	def initialize(id, data_man)
		super
		@poling_wait = 2 
	end

	def key
		'td'
	end

	def connect_slave(client)
		connection_status = {}
		@sensors.each do |addr|
			connection_status[addr] = true
		end

		data = [nil,nil,nil,nil,nil] # PM2.5,CO2,Temp,Humi,TVOC]
		rdata = [nil,nil,nil,nil,nil,nil] #PM2.5,PM10,Temp,Humi,CO2,TVOC
		loop do
			@sensors.each do |addr|
				begin
					client.with_slave(addr) do |slave|
						rdata = slave.input_registers[56..61]	# PM2.5, PM10, temp, humi, CO2, TVOC
						data[0] = rdata[0]/10.0	#PM2.5
						data[1] = rdata[4]	#CO2
						data[2] = rdata[2]/100.0	#Temp
						data[3] = rdata[3]/100.0	# Humi
						data[4] = rdata[5]/1000.0	#TVOC
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
		tvoc = Ai.new(addr*100 + 5, @dev_id)
		tvoc.name += '_TVOC'
		tvoc.set_attr({'unit_label'=>'µg/m3'})

		return {pm25.id=>pm25,co2.id=>co2,temp.id=>temp,hum.id=>hum,tvoc.id=>tvoc}
	end

	def send_cos(addr,data)
		1.upto 5 do |id|
			cos = {'com_stat'=>true,'error'=>false,'av'=>nil}
			cos['av'] = data[id-1]
			# set new value to the management point
			@data_man.cos(addr*100+id,@dev_id,cos)
		end
	end

	def send_com_error(addr)
		1.upto 5 do |id|
			cos = {'com_stat'=>false}
			# set new value to the management point
			@data_man.cos(addr*100+id,@dev_id,cos)
		end
	end
end
