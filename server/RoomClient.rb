# coding: utf-8
#
# This object is a device object of multi site monitoring server

#require 'websocket-eventmachine-client'
require 'faye/websocket'
require 'json'
require_relative 'Device'
require_relative 'FcuSvm'
require_relative 'cgi.rb'
require_relative 'Timer'

class RoomClient < Device
	def initialize(id, data_man)
		super
		@user = ''
		@passwd = ''
		@port = 60000
		@ipaddr = ''
		@ws = nil
		@close_timer = Timer.new
		@close_wait = 30
		@rent = false

		# add ping handler 2021-10-1 Hayashi
		@ping_timer = Timer.new
		@ping_interval = 90
		@pong_timer = Timer.new
		@pong_wait = 60
	end

	def key
		'svm'
	end

	def device_attr
		{'ip_addr'=>@ipaddr,'port'=>@port,'user'=>@user}
	end

	def set_attribute(attr)
		@ipaddr = attr['ip_addr'] if(attr['ip_addr'] != nil)
		@port = attr['port'] if(attr['port'] != nil)
		@user = attr['user'] if(attr['user'] != nil)
		@passwd = 'p'+@user+'w'
	end

	def changed?(attr)
		return true if(@ipaddr != attr['ip_addr'])
		return true if(@port != attr['port'])
		return true if(@user != attr['user'])
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
				message = ["login",{"user"=>@user,"passwd"=>@passwd}]
				puts "LOGIN MESSAGE #{message}"
				send(message)

				# add ping handler 2021-10-1 Hayashi
				@ping_timer.periodic(@ping_interval) do
					@pong_timer.one_time(@pong_wait) do
						puts "Close because no pong"
						# close this connection
						close_sock
					end
					send(['ping'])
				end
				#########################
			end


			ws.on :message do |event|
				# add ping handler 2021-10-1 Hayashi
				@pong_timer.cancel if(@pong_timer != nil)	# add to improve stability of communication
				#######################
				msg = event.data
				com = JSON.parse(msg)
				puts "Receve Message: #{com[1][0]}"
				# process received message
				if(com[1][0] == 'pong') # add pong handler 2021-10-1 Hayashi
				else
					command_dispatch(com[1][0],com[1][1],com[1][2])
				end
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

		# add ping handler 2021-10-1 Hayashi
		@ping_timer.cancel if(@ping_timer != nil)
		@pong_timer.cancel if(@pong_timer != nil)
		##########################

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
					next if(point['type'] != 'Fcu')
					point_list[point['id']] = make_point(point) 
					id_list.push(point['id'])
				end
				# add rent signal point as Di
				di = Di.new(1,@dev_id)
				di.name = "Rent Signal"
				@rent_id = di.id
				point_list[@rent_id] = di
				# add to point list of this system
				@data_man.update_point_list(point_list)
				# request point status
				send(['get_point_status',id_list])
				send(['get_rent_status'])
				send(['occ_status',@data_man.get_occ_stat]) if(@data_man.occ_exist?)
			else
				# could not get point list
			end
		when 'get_point_status'
			if(result == 'OK')
				data.each do |stat|
					@data_man.cos_internal(stat[0],stat[1])	# stat[0] is id, stat[1] is cos
				end
				# initial status of Di
				@data_man.cos(1,@dev_id,{'stat'=>'off','com_stat'=>true})
			end
		when 'get_rent_status'
			if(result == 'OK')
				@data_man.cos(1,@dev_id,{'stat'=>data})
			end
		when 'cos'
			@data_man.cos_internal(data[0],data[1])
		when 'rent'
			# rent command
			#   ['rent','OK','on'/'off']
			@data_man.cos(1,@dev_id,{'stat'=>data})
		end
	end

	def make_point(point_info)
		point = FcuSvm.new(point_info['pid'],point_info['dev_id'])
		point.name = point_info['name']
		point.icon = point_info['icon']
		point.svm_dev = @dev_id
		point.set_attr(point_info['attr'])
		return point
	end

	def operate(id, com)
		# send command to SVMPC1
		puts "COMMAND #{com}"
		command = ['operate',[[id,com]]]
		send(command)
	end
end