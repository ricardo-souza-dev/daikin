#coding: utf-8

require 'em-websocket'
require 'json'
require 'csv'
require_relative 'DataManager'
require_relative 'AccessController'
require_relative 'RoomController'
require_relative 'AlertMail'
require_relative 'Rent'
require_relative 'HotelAccessController'

class CommunicationManager
	def initialize(data_man)
		raise(ArgumentError,'DataManager is nil') if(data_man == nil)
		@data_man = data_man

		@user_file = 'user_list.json'
		@room_file = 'room_list.csv'

		@port = 60000
		@connection_list = {}

		@user_list = {}
		@user_list['admin'] = AccessController.new(@data_man,'admin')
		@user_list['admin'].set_all_points
		@user_list['service'] = AccessController.new(@data_man,'service','ecivres')
		@user_list['service'].set_all_points

		@guest_room_version = nil

		@alert = AlertMail.new(@data_man)

		# load saved user information
		load(@user_file)
		@data_man.set_comm_man(self)

		# load room controller for hotel control
		load_room(@room_file)

		# sis connection
		@sis = nil
	end

	attr_reader :port, :user_list, :guest_room_version
	attr_accessor :sis, :data_man

	# start server to accept access from client
	def open(port = nil)
		putLog("Open Communication manager #{port} ***")
		@port = port if(port != nil)
		th = Thread.new {
			putLog("Start Communication manager thread")
			EventMachine::run do
				puts "start communication manager at port #{@port}"
				putLog("start communication manager at port #{@port}")
				begin
					# EventMachine::WebSocket.start is blocked
					EventMachine::WebSocket.start(:host => "0.0.0.0", :port => @port) do |ws|
						ws.onopen {
							puts "WebSocket is opened"
							putLog("WebSocket is opened")
						}

						ws.onmessage { |packet|
							return if packet == 'undefined'
							# command format
							# [command,argument]
							com = JSON.parse(packet)
							com = com[1]
							if(com[0] == 'version')
								ret = ['version','OK',$protocol]
							elsif(com[0] == 'ping') # add ping handler 2021-10-1 Hayashi
								ret = ['pong']
							else
								receiver = @connection_list[ws]
								begin
									if(receiver == nil)
										# packet should be login command
										receiver = get_receiver(com)
										# UUID for notification
										uuid = com[1]['UUID']
										client = Socket.unpack_sockaddr_in(ws.get_peername)[1]
										receiver.client = client if(receiver != nil)
										if(receiver != nil)
											puts "login #{com[1]['user']} from #{client}."
#											putLog("login #{com[1]['user']} from #{client}.")
											contents = ['cl_connected',com[1]['user'],client]
											@data_man.add_history('System',contents)

											# set UUID to DataManager
											@data_man.add_uuid(uuid)

											ret = ['login','OK',nil,receiver.limit]
											@connection_list[ws] = receiver
											receiver.set(ws)
										else
											puts "login failed #{com[1]['user']} from #{client}."
#											putLog("login failed #{com[1]['user']} from #{client}.")
											contents = ['login_fail',com[1]['user'],client]
											@data_man.add_history('System',contents)
											ret = ['login','NG']
										end
									else 	# already connected
										ret = receiver.command_dispatch(com)
										puts "RET #{ret}"
									end
								rescue => e
									puts "ERROR: #{e}"
									putLog("ERROR: #{e}")
									ret = ['login','NG']
								end
							end
							# return format
							# [command,OK/NG,argument]
							if(ret != nil)
								pack = JSON.generate(['',ret])
								#puts "#{pack}"
								ws.send(pack)
							end
						}

						ws.onclose {
							receiver = @connection_list[ws]
							if(receiver != nil)
								puts "connection closed: #{receiver.client}"
#								putLog("connection closed: #{receiver.client}")
								contents = ['close_connection',receiver.user,receiver.client]
								@data_man.add_history('System',contents)
								receiver.reset(ws)
								@connection_list.delete ws
							end
						}
					end
				rescue => e
					puts "WebSocket has some trouble: #{e.backtrace}"
					putLog("WebSocket has some trouble: #{e}:: #{e.backtrace}")
					exit
				end
			end
			putLog("************* Exit EventMachine ***************")
		}
		return th
	end

	# packet is [id,command]
	def receive_command(packet)
		id = packet[0]
		com = packet[1]
		if(com[0] == 'version')
			ret = ['version','OK',$protocol]
		else
			receiver = @connection_list[id]
			if(receiver == nil)
				if(com[0] == 'logout')
					puts "logout #{id}"
					return id,nil
				end
				# packet should be login command
				receiver = get_receiver_sis(com)
				client = 'Internet'
				if(receiver != nil)
					receiver.client = client
					puts "login #{com[1]['user']} from #{client}:#{id}."
					contents = ['cl_connected',com[1]['user'],client]
					@data_man.add_history('System',contents)

					ret = ['login','OK',@data_man.site_info,receiver.limit]	#,@data_man.clock.now.to_i] # time sync controller
					@connection_list[id] = receiver
				else
					puts "login failed #{com[1]['user']} from #{client}."
					contents = ['login_fail',com[1]['user'],client]
					@data_man.add_history('System',contents)
					ret = ['login','NG']
				end
			else 	# already connected
				if(com[0] == 'logout')
					receiver = @connection_list[id]
					if(receiver != nil)
						puts "connection closed: #{receiver.client} #{id}"
						contents = ['close_connection',receiver.user,receiver.client]
						@data_man.add_history('System',contents)
						@connection_list.delete id
					end

					ret = nil
				elsif(com[0] == 'login')
					if(receiver != get_receiver_sis(com))
						ret = ['login','NG',nil]
						puts "login failed from #{client}:#{id}."
					else
						puts "login #{com[1]['user']} from #{client}:#{id}."
						contents = ['cl_connected',com[1]['user'],client]
						@data_man.add_history('System',contents)

						ret = ['login','OK',@data_man.site_info,receiver.limit]	#,@data_man.clock.now.to_i] # time sync controller
						@connection_list[id] = receiver
					end
				else
					ret = receiver.command_dispatch(com)
				end
			end
		end
		return id,ret
	end

	def get_receiver(command)
		if(command[0] == 'login' and command[1] != nil and command[1].class == Hash)
			user = command[1]['user']
			passwd = command[1]['passwd']
			receiver = @user_list[user]

			# if login user is alertmail then send alart email and exit
			if(user == 'alertmail')
				puts "Send Test Alert mail"
				send_alert(@data_man.get_string(alert_lang,'test_mail_title'),@data_man.get_string(alert_lang,'test_mail_body'))
				return nil
			else
				return receiver if(receiver != nil and receiver.authentication(passwd) == true)
			end
		end
		return nil
	end

	def get_receiver_sis(command)
		# block login when the password is not set
		passwd = command[1]['passwd']
		return nil if(passwd == nil || passwd.length == 0)

		return get_receiver(command)
	end

	def save(file)
		begin
			File.open(file,'w') do |io|
				@user_list.each do |name,user|
					next if(name == 'service')
					io.puts(JSON.generate(user.get_info))
				end
			end
			File.chmod(0777,file)
		rescue => e
			puts "User file save error: #{e}"
			return false
		end
		true
	end

	# load has to be called after default user regstration
	def load(file)
		return false if(File.exist?(file) == false)
		begin
			File.open(file,"r:UTF-8") do |io|
				while(line = io.gets)
					user_info = JSON.parse(line)
					if(user_info[0] == 'admin')
						@user_list['admin'].set_passwd(user_info[1])
					elsif(@user_list[user_info[0]] != nil)
						@user_list[user_info[0]].set_passwd(user_info[1])
						@user_list[user_info[0]].set_points(user_info[2])
						@user_list[user_info[0]].set_tenant_list(user_info[3]) if(user_info[3] != nil)
						@user_list[user_info[0]].set_limit(user_info[4]) if(user_info[4] != nil)
					else
						user = AccessController.new(@data_man,user_info[0],user_info[1])
						user.set_points(user_info[2])
						if(user_info.length == 4) # this is SVMPR1/2 data
							user.set_limit(user_info[3]) if(user_info[3] != nil)
						else
							user.set_tenant_list(user_info[3]) if(user_info[3] != nil)
							user.set_limit(user_info[4]) if(user_info[4] != nil)
						end
						@user_list[user.user] = user
					end
				end
			end
		rescue => e
			puts "User file load error: #{e}"
			return false
		end
		true
	end

	def load_room(file)
		return false if(File.exist?(file) == false)
		version = 0
		# version 2 data
		user_list = {}	# {user name:{"point":[point id,...],"room":[room id,...]},...}
		room_list = {}	# {room id:{"connection":status(true/false),"rent":id,"ac":[point id,...]},...}
		dev_id = 'grs'
		pid = 1
		begin
			CSV.foreach(file) do |r|
				r[0].strip! if(r[0] != nil)
				next if(r[0] == nil || r[0].length == 0)
				next if(r[0][0] == '#')
				if(r[0].include?('Version') == true)
					version = r[1].to_i
					@guest_room_version = version
					room_list["VERSION"] = version
					next
				end
				if(version == 0)
					user = r.shift
					display_name = r.shift
					display_name = user if(display_name == nil)
					room = RoomController.new(@data_man,user,'p'+user+'w')
					room.display_name = display_name
					room.set_points(r)
					@user_list[user] = room
					room.rent_stat = @data_man.db.get_room_stat(room.user)
				elsif(version == 2)
					user = r.shift	# controller ID
					next if(user.length == 0 || user == '')
					display_name = r.shift	# room name
					user_list[user] = {"point"=>[],"room"=>[]} if(user_list.key?(user) == false)
					room_list[display_name] = {"connection"=>false,"rent"=>nil,"ac"=>[]} if(room_list.key?(display_name) == false)
					# rent status point create
					rent = Rent.new(pid,dev_id)	# this point is not saved in point list
					pid += 1
					rent.name = display_name+'_stat' # Rent point name is room name+_stat
					@data_man.update_point_list({rent.id=>rent})
					stat = @data_man.db.get_status(rent.id)
					if(stat != nil)
						rent.set_init_status(stat)
					else
						stat = {'stat'=>'off'} # initial status
					end
					cos = {'com_stat'=>true,'stat'=>stat['stat']}
					cos = rent.current_status.merge(cos)	# send cos to rent to enable
					cos["stat"] = "off" if(cos["stat"] == nil)
					@data_man.cos_internal(rent.id,cos)
					r.delete(nil)
					user_list[user]["point"] = user_list[user]["point"]+r 	# register point id to controller id
					user_list[user]["point"].push(rent.id)	# created Di is register for controller user
					user_list[user]["room"].push(display_name)
					room_list[display_name]["ac"] = room_list[display_name]["ac"]+r
					room_list[display_name]["rent"] = rent.id
				end
			end
		rescue => e
			puts "Room file load error: #{e}"
			return false
		end
		# for Ver.2
		# register each controller to user list
		if(version == 2)
			user_list.each do |user, data|
				 svmps3 = HotelAccessController.new(@data_man,user,'p'+user+'w')
				 svmps3.set_points(data["point"])	# register points in this controller
				 svmps3.set_rooms(data["room"])
				 @user_list[user] = svmps3
			end
			@data_man.guest_room = room_list
		end

		@data_man.db.remove_unupdated
		true
	end

	def add_user(user_info)
		return false if(@user_list[user_info[0]] != nil)	# same user name cannot register
		user = AccessController.new(@data_man,user_info[0],user_info[1])
		user.set_points(user_info[2])
		user.set_tenant_list(user_info[3]) if(user_info[3] != nil)
		user.set_limit(user_info[4]) if(user_info[4] != nil)
		@user_list[user.user] = user
		save(@user_file)
	end

	def delete_user(user)
		return false if(user == 'admin' or user ==  'service')
		return false if(@user_list.delete(user) == nil)
		save(@user_file)
	end

	def get_user(user)
		u = @user_list[user]
		return u if(u != nil && u.class == AccessController)
		return nil
	end

	def get_room(name)
		r = @user_list[name]
		return r if(r != nil && r.class == RoomController)
		return nil
	end

	def get_user_list
		list = []
		@user_list.each_value do |user|
			next if(user.class != AccessController)
			list << user.get_info if(user.user != 'admin' and user.user != 'service')
		end
		list
	end

	def get_room_list
		list = []
		@user_list.each_value do |room|
			next if(room.class != RoomController)
			list << room.get_info
		end
		list
	end

	def update_user_info(user_info)
		user = @user_list[user_info[0]]
		return false if(user == nil or user.user == 'admin' or user.user == 'service')
		user.set_passwd(user_info[1])
		user.set_points(user_info[2])
		user.set_tenant_list(user_info[3]) if(user_info[3] != nil)
		user.set_limit(user_info[4]) if(user_info[4] != nil)
		save(@user_file)
		return true
	end

	def update_passwd
		save(@user_file)
		return true
	end

	def cos(id,status)
		sent = false
		@connection_list.each do |ws,receiver|
#			print "+"
			next if(ws == nil or receiver == nil)
			cos = receiver.cos(id,status)
			next if(cos == nil)
			if(ws.kind_of?(Numeric) == false)
#				puts "send direct"
				ws.send(JSON.generate(['',cos]))
			else
#				puts "send sis"
				@sis.send('',cos) if(sent == false)
				sent = true
			end
		end
	end

	def rcos(room,status)	# room is room id, status is {'connect'=>true/false, 'occ'=>true/false}
		sent = false
		if(@guest_room_version == nil)
			return if(get_room(room) == nil)
		elsif(@guest_room_version == 2)
			return if(@data_man.guest_room[room] == nil)
		end
		return if(@connection_list == nil)
		@connection_list.each do |ws,receiver|
			next if(receiver.class != AccessController)
			next if(ws == nil or receiver == nil)
			rcos = receiver.rcos(room,status)
			if(ws.kind_of?(Numeric) == false)
				ws.send(JSON.generate(['',rcos]))
			else
				@sis.send('',rcos) if(sent == false)
				sent = true
			end
		end
	end

	# data update to MSM
	def dud(com,data)
#		@connection_list.each do |ws,receiver|
#			next if(ws == nil or receiver == nil)
#			if(ws.kind_of?(Numeric) == true)
				@sis.send('',['dud','OK',[com,data]]) if(@sis != nil)
#			end
#		end
	end

	def send_alert(subject,body)
		@alert.send(subject,body) if(@alert != nil)
	end

	def set_mail_server(server_info)
		@alert.set_server_info(server_info) if(@alert != nil)
	end

	def alert_mail_active?
		return @alert.active? if(@alert != nil)
		return false
	end

	def alert_lang
		@alert.lang
	end

	def putLog(message)
		begin
#			File.open('CommMan.log','a') do |io|
#				io.puts("#{Time.now} #{message}")
#			end
		rescue
		end
	end
end