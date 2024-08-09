# coding: utf-8
#
# This object is a device object of multi site monitoring server

#require 'websocket-eventmachine-client'
require 'faye/websocket'
require 'json'
require_relative 'Device'
require_relative 'AhuSvm'
require_relative 'AiSvm'
require_relative 'DioSvm'
require_relative 'FcuSvm'
require_relative 'PiSvm'
require_relative 'SPiSvm'
require_relative 'VamSvm'
require_relative 'cgi.rb'
require_relative 'Timer'

class SvmClient < Device
	def initialize(id, data_man)
		super
		@passwd = 'DAIKINservice'
		@port = 60000
		@ipaddr = ''
		@ws = nil
		@close_timer = Timer.new
		@close_wait = 30
		@rent = false
	end

	def key
		'svm'
	end

	def device_attr
		{'ip_addr'=>@ipaddr,'port'=>@port}
	end

	def set_attribute(attr)
		@ipaddr = attr['ip_addr'] if(attr['ip_addr'] != nil)
		@port = attr['port'] if(attr['port'] != nil)
	end

	def changed?(attr)
		return true if(@ipaddr != attr['ip_addr'])
		return true if(@port != attr['port'])
		return false
	end

	def connect
		@thread = Thread.new do
			url = "ws://#{@ipaddr}:#{@port}"
			sleep 5
			puts "Connect to SVMPC1 #{@ipaddr} at port #{@port}"
			EventMachine::run do
				connection_event(url)
			end
		end
	end

	def connection_event(url)
		return if(@ws != nil)
		begin
			ws = Faye::WebSocket::Client.new(url)

			ws.on :open do |event|
				@ws = ws

				puts "Connected to SVMPC1"
				message = ["login",{"user"=>"admin","passwd"=>@passwd}]
#				puts "LOGIN MESSAGE #{message}"
				send(message)
			end


			ws.on :message do |event|
				msg = event.data
				com = JSON.parse(msg)
				puts "Receve Message: #{com[1][0]}"
				# process received message
				command_dispatch(com[1][0],com[1][1],com[1][2])
			end

			ws.on :close do |event|
				if(ws === @ws)
					@close_timer.cancel if(@close_timer != nil)
					puts "Close in onclose"
					close_connection 
				else
					close_connection
				end
			end

			ws.on :error do |event|
				puts "Error"
				close_sock
			end
		rescue => e
			close_sock
		end
	end

	def close_sock
		puts "Close socket"
		@ws.close if(@ws != nil)
		@close_timer.one_time(@close_wait) do
			puts "onclose was not called"
			close_connection
		end
	end

	def close_connection
		puts "Call close connection"
		@ws = nil

		# reconnection
		@close_timer.one_time(10) do
			puts "Try to reconnect to SVM"
			connect
		end
	end

	def send(command)
		if(@ws == nil)
			puts "SVMPC1 is not connected"
			return false
		else
			# first data is ignored when local connection
			# in MSM mode, first packet should be site id
			data = JSON.generate(['',command])
			@ws.send(data)
		end
	end

	def command_dispatch(command,result,data)
		puts "#{command} #{result} #{data}"
		case(command)
		when 'login'
			if(result == 'OK')
				send(['get_point_list'])
			else
				# login failed
			end
		when 'get_point_list'
			if(result == 'OK')
				point_list = {}
				id_list = []
				data.each do |point|
					point_list[@dev_id+point['id']] = make_point(point) 
					id_list.push(point['id'])
				end
				# add to point list of this system
				@data_man.update_point_list(point_list)
				# request point status
				send(['get_point_status',id_list])
			else
				# could not get point list
			end
		when 'get_point_status'
			if(result == 'OK')
				data.each do |stat|
					@data_man.cos_internal(@dev_id+stat[0],stat[1])	# stat[0] is id, stat[1] is cos
				end
			end
		when 'cos'
			@data_man.cos_internal(@dev_id+data[0],data[1])
		end
	end

	def make_point(point_info)
		point = nil
		case(point_info['type'])
		when 'Fcu'
			point = FcuSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Ahu'
			point = AhuSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Vam'
			point = VamSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Di'
			point = DiSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Dio'
			point = DioSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Ai'
			point = AiSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Ao'
			point = AoSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'LevelSw'
			point = LevelSwSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'RgbLevel'
			point = RgbLevelSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Shutter'
			point = ShutterSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'KeyLock'
			point = KeyLockSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Ir'
			point = IrSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'Pi'
			point = PiSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		when 'SPi'
			point = SPiSvm.new(point_info['pid'],@dev_id+point_info['dev_id'])
		end
		point.name = point_info['name']
		point.icon = point_info['icon']
		point.svm_dev = @dev_id
		point.sub_type = point_info['subtype']
		point.usage = point_info['usage']
		point.set_attr(point_info['attr'])
		return point
	end

	def operate(id, com)
		id.sub!(@dev_id,'')
		# send command to SVMPC1
		command = ['operate',[[id,com]]]
		send(command)
	end
end