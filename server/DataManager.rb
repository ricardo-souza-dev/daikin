#coding: utf-8

require 'json'
require 'fileutils'
require 'bigdecimal'
require 'net/https'

require_relative 'PointRequire'
require_relative 'CommunicationManager'
require_relative 'Device'
require_relative 'Itm'
require_relative 'Itc'
require_relative 'Dta116'
require_relative 'Dta116C'
require_relative 'Dta116tcp'
require_relative 'Dta116SP'
require_relative 'Dta116tcpSP'
require_relative 'WagoIo'
require_relative 'ZWave'
require_relative 'Dmobile'
require_relative 'DmobileA'
require_relative 'NetPro'
require_relative 'Spliton'
require_relative 'Emb'
require_relative 'MqFcu'
require_relative 'InternalDi'
require_relative 'InternalDo'
require_relative 'GlobalCache'
require_relative 'RoomClient'
require_relative 'RoomsClient'
require_relative 'FloorClient'
require_relative 'SvmClient'
require_relative 'DamaModules'
require_relative 'ManagementPoint'
require_relative 'ClockWork'
require_relative 'History'
require_relative 'Database'
require_relative 'Schedule'
require_relative 'HostNetworkInfo'
require_relative 'PiDummy'
require_relative 'SmartMeter'
require_relative 'DummySM'
require_relative 'SmartPi'
require_relative 'SmartPiMb'
require_relative 'KRON'
require_relative 'Interlock'
require_relative 'Scenes'
require_relative 'RemoteUpdate'
require_relative 'LutronThermo'
require_relative 'HaiLin'
require_relative 'AlCo2'
require_relative 'Tongdy'
require_relative 'RoomOcc'
#Kaiwei 12/07/2018 Added Reports
require_relative 'Reports'
require_relative 'Hotel'
require_relative 'MultiHotel'
require_relative 'BroadlinkRemote'

class DataManager
	def initialize
		@site_info = {'name'=>'','size'=>0,'location'=>'','model'=>$model.sub('LU','').sub('SVM-','')}
		@point_list = {}		# {id=>point object}
		@device_list = {}	# {dev_id=>device object}
		@room_client = nil
		@max_dev_id = 0
		@site_file = 'site_info.json'
		@point_file = 'point_list.json'
		@point_backup = 'point_list.bak.json'
		@device_file = 'device_list.json'
		@tenant_file = 'tenant_list.json'
		@bill_file = 'bill_info.json'
		@mailserver_file = 'mail_server.json'
		@clock_file = 'clock_adjust.json'
		@screen_file = 'screen_list.json'
		@string_file = '../script/StringTable.json'
		@network = HostNetworkInfo.new
		@sis_url = nil

		@lutron_thermo = {}	#{dev=>object}

		@clock = ClockWork.new(self)
		@history = History.new(@clock)
		@db = Database.new
		@comm_man = nil

		conv_schedule

		@schedule = Schedule.new(@clock,self)
		@mutex = nil
		@next_thread = Queue.new
		@history_size = 1000000 # R series: 1000, C series: 1000000 
		@point_data = $database	# store operation data or not
		@tenant_list = {}		# {tenant name => [[id list],limit,charged],...} if limit is nil then it's not target, charged is calculated time
		@controlled_tenant = []
		@price_map = [0]*24		# price map of each hour
		@limited_points = []	# registered id is prohibited operation
		@string_table = {}
#		@db_limit = 3  			# database stores data for 3 years
		@scenes = Scenes.new(self)

		if($model.start_with?("SVM-S2") == true)
			@hotel = Hotel.new(self)
		end	
		
		if($model.start_with?("SVM-S3") == true)
			@hotel = MultiHotel.new(self)
		end
		
		@interlock = Interlock.new(self)
				
		@cos_received = []		#COS check for hotel and interlock, to stop check for first interlock during startup
		
		#######################
		# Hotel guest rooms
		@guest_room = {}	# {"VERSION":ver,room name:{"connection":status(true/false),"rent":id,"ac":[point id,...]},...}

		########################
		# UUID for notification
		@uuid = []
		@uuid_file = 'uuid_list.json'
		########################
		# notification server key of Firebase
		@firebase_key = nil
		@firebase_key_file = "firebase_key.json"
		@firebase_url = "https://fcm.googleapis.com/fcm/send"

	  #################################################
		#Kaiwei 12/07/2018 Added Reports
    #################################################
		@reports = Reports.new(self)
		@categorizedPiType_file = 'categorizedPiType.json'
    @cat_file = 'piCategories.json'
    @reports_file = 'reports.json'
    #################################################
		
		@occ_stat = false # occupied status of the room true is occupied

		@ready = false
		@reboot = false
	end

	attr_reader :device_list, :comm_man, :tenant_list, :db, :site_info, :clock
	attr_accessor :point_list, :sis_url, :guest_room, :occ_stat

	def conv_schedule
		sched = get_file("schedule.json")
		return if(sched != nil)
		print "Schedule database is converting..."
		program_list = {} 	# {owner=>{name=>program,...},...}
		calendar = {}			# {owner=>calendar,...}
		pattern_list = {}	# {owner=>pattern_list,...}
		begin
			pattern = @db.get_all_pattern
			pattern.each do |pat|
				pattern_list[pat[0]] = pat[1] if(pat != nil)
			end
			calendardb = @db.get_all_calendar
			calendardb.each do |cal|
				calendar[cal[0]] = cal[1] if(cal != nil)
			end
			prog_list = @db.get_all_program
			prog_list.each do |program|
				next if(program == nil || program[0] == nil || program[1] == nil)
				program_list[program[0]] = {} if(program_list[program[0]] == nil)
				program_list[program[0]][program[1]] = program[2]
			end
		rescue
		end
		save_file("schedule.json",{"program"=>program_list,"calendar"=>calendar,"pattern"=>pattern_list})
		puts "end"
	end

	def start
		add_history('System',['sys_start'])
		@db.write_thread
		# load files
		load_firebase_key
		load_uuid
		load_site_info(@site_file)
		load_string_table(@string_file)
		load_points(@point_file)
		load_devices(@device_file)
		load_tenant(@tenant_file)
		load_price_zone
		load_clock(@clock_file)
		
		if($model.start_with?("SVM-S2") == true)
			@hotel.createFcuObjects()
		end
		
		
		@point_list.each do |id,point|
			@cos_received << id															#Adding all MPoints to @cos_received for first COS check
		end	
		# if comm error point is exist during start up then interlock cannot work
		# to prevent this problem, timer is set to start interlock
		Thread.new do 
			sleep 60 # wait 1min
			@cos_received = []	# clear cos check array
		end
		
		# make database for demo
		if($demo != nil) 
			puts "Generate dummy database #{Time.now}"
			l1 = @db.getLatestOptime
			l2 = @db.getLatestMeter
			l1 = $demo if(l1 == nil)
			l2 = $demo if(l2 == nil)
			now = Time.now.to_i
			l1 = l1.to_i+15*60
			l2 = l2.to_i+15*60
			generateDummyDb(l1,l2,now,1440)
			puts "end dummy database generation #{Time.now}"
		end
		@ready = true

		# connect to device
		begin 
			@device_list.each_value {|device|	device.connect}

			@lutron_thermo.each_value {|rcu| rcu.connect}
			@clock.start
		rescue => e
			puts "Error: #{e}"
		end
		# insert meter_daily data if doesnt exist
    	init_meter_daily()

	end

	def load_uuid
		begin
			File.open(@uuid_file,"r") do |io|
				@uuid = JSON.parse(io.gets)
			end
		rescue
		end
	end

	def save_uuid
		begin 
			File.open(@uuid_file,"w") do |io|
				io.puts(JSON.generate(@uuid))
			end
		rescue => e
			puts "UUID file write error: #{e}"
		end
	end

	def add_uuid(uuid)
		return if(uuid == nil)
		@uuid.push(uuid) if(@uuid.include?(uuid) == false)
		save_uuid
	end

	def load_firebase_key
		begin
			File.open(@firebase_key_file,"r") do |io|
				@firebase_key = io.gets
			end
		rescue
		end
	end

	# from,to: time_t, step: minutes 15,60,1440
	def generateDummyDb(from_op,from_pi,to,step)
		mult = step/150
		from_op.step(to,step*60) do |t|
			@point_list.each do |id,point|
				next if(point.is_a?(Di) == false)
				@db.add_optime(id,Time.at(t),(rand(0..900)*mult*6).to_i)
			end
		end
		from_pi.step(to,step*60) do |t|
			@point_list.each do |id,point|
				next if(point.is_a?(Pi) == false)
				meter = @db.get_latest_value(id)
				meter = 0 if(meter == nil)
				if(point.pid == 1)
					amount = rand(1..15) 
				elsif(point.pid == 4)
					amount = rand(0..3) 
				else
					amount = rand(1..8) 
				end
				amount = (amount*mult).to_i
				@db.add_meter(id,Time.at(t),meter+amount,amount)
			end
		end
	end
	
	def set_comm_man(comm_man)
		@comm_man = comm_man
		server = get_mail_server_info
		@comm_man.set_mail_server(server) if(@comm_man != nil)
	end

	# call from application
	def add_history(type,contents,target='',origin='',who='')
		# type,target,origin,who is string
		# contents is an array ['message key',param,...]
		# param is variable in the message
		return if(contents == nil || contents.length == 0)
		@history.add_history(type,contents,target,origin,who) 
	end

	def operate(id,command,from,who)
		point = @point_list[id]
		return nil if(point == nil)
		# for one time off timer, set off_timer to off
		#command['off_timer'] = 'off' if(from == 'off_timer')
		##############################################
		com,stat = point.operate(command)
		puts "OP: #{id} #{command} #{com} #{stat}" if(command.empty? == false || com.empty? == false || stat.empty? == false)
		# store to history
		@history.operate(id,com.merge(stat),from,who) if(@history != nil)

		# update point status
		# stat is not device command
		cos = cos(point.pid,point.dev_id,stat)
		save_points(@point_file) if(stat['notification'] != nil)	# update point_info file when notification is updated
		# send com to device
		dev = @device_list[point.dev_id]
		if(dev != nil)
			dev.operate(point.pid,com) 
		elsif(point.svm_dev != nil)
#			puts "SVMDEV COMMAND #{com} #{point.svm_dev} #{point.id}"
			dev = @device_list[point.svm_dev]
			dev.operate(point.id,com)
		end

		return cos 	# for test
	end
	def self_operate(id,command,from,who)
		Thread.new do
			sleep(3)
			#puts "self #{id} #{command}"
			point = @point_list[id]
			return nil if(point == nil)
			# store to history
			@history.operate(id,command,from,who) if(@history != nil)

			# send com to device
			dev = @device_list[point.dev_id]
			if(dev != nil)
				dev.operate(point.pid,command)
			elsif(point.svm_dev != nil)
				dev = @device_list[point.svm_dev]
				dev.operate(point.id,command) if(dev != nil)
			end
		end
	end

	def check_point_status(point_id)
		#Use by interlock, to check management point current status
		point = @point_list[point_id]
		return point.get_status if(point != nil)
		return {}
	end	
	
	# call from device
	def cos(pid,dev_id,stat)
		return {} if(@ready == false)
		cos_internal(ManagementPoint.get_id(pid,dev_id),stat)
	end

	def cos_internal(id,stat)
		point = @point_list[id]
		return nil if(point == nil)
		cos,com = point.update_status(stat,@clock,@db,@history) 
		puts "COS: #{point.id} #{cos} #{com}" if(cos.size > 0 or com.size > 0)
		return nil if(cos.length == 0 and com.length == 0)
		@lutron_thermo.each_value do |th|
			th.feedback(point.id,cos) if(cos.length > 0 and th != nil)
		end
		# send cos to CommunicationManager to update status
		@comm_man.cos(point.id,cos) if(cos.length > 0 and @comm_man != nil)
		# if cos is error then send e-mail
		if(@comm_man != nil && @comm_man.alert_mail_active? == true)
			if((cos['error'] != nil) && (cos['error'] == true)) 
				# make subject
				subject = alert_subject()
				# make mail body
				body = alert_mail(point,cos)
				# send it
				puts "#{subject}:#{body}"
				@comm_man.send_alert(subject,body)
			end
		end

		if(cos['error'] == true || (cos.key?('notify') && cos['notify'] != nil))
			notify_msg = "Alert detected"
			
			if(cos['error'] == true)
				notify_msg = "Error detected"
			end
			
			if(cos.key?('err_code'))
				notify_msg = "Error code: " + cos['err_code']
			end
			
			if(@site_info['model'].start_with?("C1"))
			    @toSend = {
				"registration_ids" => @uuid,
				"priority" => "high",
				"notification" => {
					"title" => point.name,
					"body" => notify_msg
				},
  				"data" => {
    					"notification_foreground" => "true",
  				}			
			    }.to_json
			else
			@toSend = {
				"registration_ids" => @uuid,
				"priority" => "high",
				"notification" => {
					"title" => point.name,
					"body" => notify_msg
				}
			}.to_json
			end

			uri = URI.parse(@firebase_url)
			https = Net::HTTP.new(uri.host,uri.port)
			https.use_ssl = true
			req = Net::HTTP::Post.new(uri.path, initheader = {'Content-Type' => 'application/json', 'Authorization' => 'key=' + @firebase_key})
			
			req.body = @toSend
			
			begin
				res = https.request(req)
				#puts "Response #{res.code} #{res.message}: #{res.body}"
			rescue
			end
		end

		if(@cos_received.length > 0)
			@cos_received.delete(point.id)													#Do not check if very first COS from initializing management point
			
			if(@cos_received.length == 0)	
				if($model.start_with?("SVM-S2") == true)
					@hotel.checkHotelCurrentStatus() 										#For hotel interlock, to check where to start after SVM restart
				end	
				
				if($model.start_with?("SVM-S3") == true)
					@hotel.createRoomObjects() 												#For hotel interlock, to check where to start after SVM restart
				end
			end	
		else
			@interlock.check(point.id,cos)													#COS always trigger interlock

			if $hotelctl == true															#send to @hotel only if $hotel is true
				@hotel.check(point.id,cos)
			end
		end	
		
		self_operate(point.id,com,'self_ctrl','') if(com != nil and com.empty? == false)
		return cos 	# for test
	end

	def rcos(room,cos)
		@comm_man.rcos(room,cos) if(@comm_man != nil)
	end
	
	def send_occ_stat(stat)
		return if(@room_client == nil)
		@room_client.send(['occ_status',stat])
	end

	# this method is called by device to update point list
	# loaded data has priority from this point_list
	def update_point_list(point_list)
		save = false
		if(@mutex != nil)
			@next_thread.push(Thread.current)
			Thread.stop
		end 
		@mutex = Thread.current if(@mutex == nil)
		point_list.each do |id, point|
			next if(id.length == 0)
			if(@point_list[id] == nil)
				@point_list[id] = point 
				stat = @db.registered?(point.id)
				@db.add_id(point.id) if(stat == false)	# make entry of the point in status db
				save = true
			else
				save = true if(@point_list[id].update_attr(point))

				if($model.start_with?('SVM-S1') && (point.name != @point_list[id].name))
					puts "Name is changed #{point.name}"
					@point_list[id].name = point.name
					save = true
				end
			end
		end
		save_points(@point_file) if(save == true)
		@mutex = nil
		@next_thread.pop.run if(@next_thread.empty? == false)
	end

	def load_site_info(file)
		puts "load site info #{file}"
		begin
			File.open(file,'r:UTF-8') do |io|
				line = io.gets.strip
				info = JSON.load(line)
				puts info
				@site_info = info
				@site_info['model'] = $model.sub('LU','').sub('SVM-','')
			end
		rescue => e
			return false
		end
		return true
	end

	def save_site_info(file)
		begin
			File.open(file,"w") do |io|
				io.puts(JSON.generate(@site_info))
			end
		rescue => e
			return false
		end
		return true
	end

	def load_points(file)
		@point_list = {}	# initialize point list
		retry_flag = false
		begin
			if(File.exist?(@point_backup) && FileUtils.cmp(@point_backup,file) == false)
				# point setting is different between current file and backup file
				File.open("error.json","a") do |io|
					io.puts "#{Time.now}"
					io.puts "point data is differrent"
				end
				# load from backup file 22.4.2022
				begin
					FileUtils.cp(file,file+'.diff')
				rescue
				end
				FileUtils.cp(@point_backup,file)
				File.chmod(0666,@point_file)
			end

			File.open(file,"r:UTF-8") do |io|
				while(line = io.gets)
					next if(line.strip.length == 0)
					begin
						info = JSON.load(line)
						point = Module.const_get(info[0]).new(info[1]['pid'],info[1]['dev_id'])
						point.name = info[1]['name']
						point.icon = info[1]['icon']
						point.icon.gsub!('icon/','') if(point.icon.include?('icon/'))
						point.sub_type = info[1]['subtype']
						point.set_attr(info[1]['attr'])
						point.set_db_value(@db)
						@point_list[point.id] = point

						stat = @db.registered?(point.id)
						if(stat == false)
							@db.add_id(point.id) 	# make entry of the point in status db
						else
							# read status and set it to point
							stat = @db.get_status(point.id)
							point.set_init_status(stat) if(stat != nil)
						end

						# for dummy pi
						point.set_data_man(self) if(point.is_a?(PiDummy))
					rescue => e
						File.open("error.json","a") do |io|
							io.puts "#{Time.now}"
							io.puts "point data creating error #{e.backtrace}"
							io.puts "======= #{e}"
						end
					end
				end
			end
			# create backup file at the begining if backup file is not exist
			if(File.exist?(@point_backup) == false)
				FileUtils.cp(file,@point_backup)
				File.chmod(0666,@point_backup)
			end

			Thread.new do 
				sleep 5
				# added from WAGO 2017/12/3
				@point_list.each_value do |point|
					point.init(self)
				end
			end

			puts "#{@point_list.size} points are loaded"
			return @point_list.size
		rescue => e
			File.open("error.json","a") do |io|
				io.puts "#{Time.now}"
				io.puts "point_list.json load error #{e.backtrace}"
				io.puts "======= #{e}"
			end
			puts "Warning: #{e}"
			# load from backup file 22.4.2022
			if(retry_flag == false && File.exist?(@point_backup)) # backup file is exist
				begin
					FileUtils.cp(file,@point_file+'.crash')
				rescue
				end
				FileUtils.cp(@point_backup,file)
				File.chmod(0666,file)
				retry_flag = true
				retry
			end
		end
	end

	def save_points(file)
		puts "Update point list: #{file}"
		begin			
			File.open(file,"w") do |io|
				@point_list.each_value do |point|
					io.puts(JSON.generate([point.class_type,point.point_info])) if(point.save == true)
				end
			end
			File.chmod(0666,file)

			FileUtils.cp(@point_file,@point_backup) # create backup file
			File.chmod(0666,@point_backup)
			return true
		rescue => e
			puts "Error: #{e}"
			File.open("error.json","a") do |io|
				io.puts "#{Time.now}"
				io.puts "point data save error #{e.backtrace}"
				io.puts "======= #{e}"
			end
			return false
		end
	end

	def load_devices(file)
		@device_list = {}		# initialize device list
		begin
			File.open(file,'r') do |io|
				while(line = io.gets)
					next if(line.strip.length == 0)
					next if(line[0] == '#')
					begin
						info = JSON.load(line)
						dev = Module.const_get(info[0]).new(info[1],self)
						@max_dev_id = info[1] if(@max_dev_id < info[1])
						dev.set_attribute(info[2])
						if(dev.class_type == 'LutronThermo')
							@lutron_thermo[dev.dev_id] = dev
						else
							@device_list[dev.dev_id] = dev
						end
						@room_client = dev if(dev.dev_id.start_with?('svm'))
					rescue => e
						puts "Fail to load device #{e.backtrace}"
					end
				end
			end
			return @device_list.size
		rescue => e
			puts "Warning: #{e}"
		end
	end

	def save_devices(file)
		puts "Update device list: #{file}"
		begin
			File.open(file,'w') do |io|
				@device_list.each_value do |dev|
					io.puts(JSON.generate(dev.device_info))
				end
			end
			return true
		rescue => e
			puts "Error: #{e}"
			return false
		end
	end

	def load_price_zone
		info = get_bill_info
		make_price_map(info['rate']) if(info != nil)
	end

	def load_clock(file)
		puts "Load clock file"
		begin
			File.open(file,'r') do |io|
				while(line = io.gets)
					next if(line.strip.length == 0)
					next if(line[0] == '#')
					begin
						info = JSON.load(line)
						return if(info[0] != 'internet' && info[0] != 'itm')
						$clock = info[0]
						$adjust_itm_clock = info[1]
					rescue => e
						puts "Fail to load clock file #{e.backtrace}"
					end
				end
			end
		rescue => e
			puts "Warning: #{e}"
		end
		com = ''
		if($clock == 'itm') # stop NTP access
			com = 'timedatectl set-ntp false'
		else 
			com = 'timedatectl set-ntp true'
		end
		puts com
		system(com)
	end

	def save_clock(file)
		puts "Update clock file"
		begin
			File.open(file,'w') do |io|
				io.puts(JSON.generate([$clock,$adjust_itm_clock]))
			end
			File.chmod(0777,file)
			return true
		rescue => e
			puts "Error: #{e}"
			return false
		end
	end

	# access from AccessController
	def clock_adjustment(arg)
		type = arg[0]
		itm = arg[1]
		return false if(type != 'internet' && type != 'itm')
		$clock = type
		if(itm == 'true' || itm == true)
			$adjust_itm_clock = true 
		else
			$adjust_itm_clock = false 
		end			
		save_clock(@clock_file)
		return true		
	end

	def get_clock_adjustment()
		return [$clock,$adjust_itm_clock]
	end

	def get_room_list
		return nil if(@comm_man == nil)
		return @comm_man.get_room_list
	end
	
	def get_user_list
		return nil if(@comm_man == nil)
		return @comm_man.get_user_list
	end
	def add_user(user_info)
		return false if(@comm_man == nil or user_info == nil or user_info.class != Array or user_info.size < 3)
		return @comm_man.add_user(user_info)
	end
	def delete_user(user)
		return @comm_man.delete_user(user)
	end
	def update_user_info(user_info)
		return false if(@comm_man == nil or user_info == nil or user_info.class != Array or user_info.size < 3)
		return @comm_man.update_user_info(user_info)
	end
	def update_passwd
		return false if(@comm_man == nil)
		return @comm_man.update_passwd
	end
	def set_point_info(point_info)
		update_info = []
		ret = false
		point_info.each do |id, info|
			point = @point_list[id]
			if(point != nil) 
				ret = true
				point.name = info['name'] if(info['name'] != nil)
				point.icon = info['icon'] if(info['icon'] != nil)
				point.set_attribute(info['attr']) if(info['attr'] != nil)
				update_info << point.point_info
			end
		end
		save_points(@point_file)
		@comm_man.sis.send('',['point_info_updated','OK',update_info]) if(@comm_man.sis != nil)
		return ret
	end	
	def set_point_order(id_list) 
		puts "Update point list order: #{@point_file}"
		begin
			File.open(@point_file,"w") do |io|
				points = id_list.length
				0.upto(points-1) do |i| 
					point = @point_list[id_list[i]]
					io.puts(JSON.generate([point.class_type,point.point_info]))
				end
			end
			return true
		rescue => e
			puts "Error: #{e}"
			return false
		end
	end
	def get_point_status(point_list)
		return nil if(point_list == nil or point_list.class != Array)
		ret = []
		point_list.each do |id|
			ret << [id,@point_list[id].current_status] if(@point_list[id] != nil)
		end
		ret
	end
	def get_icon_list
		list = []
		Dir::entries("../icon/").each do |icon|
			next if FileTest.directory?('../icon/'+icon)
			next if icon[0] == '.'
			list << icon
		end
		return list
	end
	def get_sceneicon_list
		list = []
		Dir::entries("../icon/scenes/").each do |icon|
			next if FileTest.directory?('../icon/scenes/'+icon)
			next if icon[0] == '.'
			list << icon
		end
		return list
	end
	def add_device(class_type, attr)
		return false if(attr == nil or attr.class != Hash)
		begin
			dev = Module.const_get(class_type).new(@max_dev_id+1,self)
			dev.set_attribute(attr)
			puts "add #{dev.dev_id}"
			@device_list[dev.dev_id] = dev
			@max_dev_id = dev.id
			dev.connect
			return true
		rescue
			puts "File to add device"
			return false
		end
	end
	def find_device(list,type,dev_id)
		begin
			list.each_value do |dev|
				if(dev.class_type == type && dev.id == dev_id)
					return dev
				end
			end
			return nil
		rescue
			return nil
		end		
	end
	def get_device_list
		ret = []
		@device_list.each_value do |dev|
			ret << dev.device_info
		end
		ret
	end
	def set_device_list(dev_list)
		begin
			backup_list = @device_list
			@device_list = {}
			dev_list.each do |dev|
				puts "#{dev}"
				if(dev[1] == '') # new controller
					puts "add controller"
					return false if(add_device(dev[0],dev[2]) == false) 
				else
					puts "update controller"
					current_dev = find_device(backup_list,dev[0],dev[1].to_i)
					puts "current #{current_dev}"
					if(current_dev != nil)
						if(current_dev.changed?(dev[2]))
							puts "update #{dev[2]}"
							current_dev.set_attribute(attr)
							current_dev.reconnect
						end
						@device_list[current_dev.dev_id] = current_dev
						puts "delete #{backup_list.delete(current_dev.dev_id)}"
					end
				end
			end
			puts "kill"
			backup_list.each_value do |dev|
				puts "kill #{dev.id}"
				dev.kill
			end
			save_devices(@device_file)
			return true;
		rescue
			return false;
		end
	end
	def set_device_info(dev_list)
		# write information to device_list.json
		puts "Save device list: #{@device_file}"
		begin
			File.open(@device_file,'w') do |io|
				dev_list.each do |dev|
					io.puts(JSON.generate(dev))
				end
			end
			return true
		rescue => e
			puts "Error: #{e}"
			return false
		end
	end
	def get_device_class
		{'Itm'=>'iTM','Itc'=>'iTC','Dta116'=>'DTA116A51'}
	end
	def get_network_info
		return nil if(RUBY_PLATFORM.downcase =~ /mswin(?!ce)|mingw|cygwin|bccwin/) # in the case of windows
		info = @network.get_network_info	# not supported machine will return false
		if(info != nil)
			info['internet'] = $internet
			info.update(get_wifi)
		end
		return info
	end
	def set_network_info(network_info)
		return false if(RUBY_PLATFORM.downcase =~ /mswin(?!ce)|mingw|cygwin|bccwin/) # in the case of windows
		@network.set_network(network_info)
		return false if(set_wifi(network_info['ssid'],network_info['passwd']) == false)
		return set_internet(network_info['internet'])
	end
	def set_internet(val)
		if(val == 'true') 
			val = true
		elsif(val == 'false') 
			val = false
		end

		host = 'sis-sin.ddns.net'
		if($region == 'DMB' || $region == 'DARG') 
			host = 'sis-br.ddns.net'
		elsif($region == 'DALA' || $region == 'DAMX') 
			host = 'sis-us.ddns.net'
		else 
			host = 'sis-sin.ddns.net'
		end

		internet = {'connect'=>val,
					'host'=>host,
					'port'=>50001}

		begin
			File.open('sis.json','w') do |io|
				io.puts(JSON.generate(internet))
			end
			return true
		rescue => e
			return false
		end
	end

	def get_wifi
		ssid = ''
		pin = ''
		if(RUBY_PLATFORM.index("linux"))
			path = HostNetworkInfo.wpa_path
			File.open(path, "r") do |f|
				f.each_line do |line|
					if(line.index("ssid="))
						info = line.split("=")
						ssid = info[1].gsub('"','').strip 
					elsif(line.index("psk="))
						info = line.split("=")
						pin = info[1].gsub('"','').strip 
					end
				end
			end
		end
		{'ssid'=>ssid,'passwd'=>pin}
	end
	def set_wifi(ssid,pin)
		path = HostNetworkInfo.wpa_path
		begin
			File.open(path, "w") do |f|
				f.puts "country=SG"
				f.puts "ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev"
				f.puts "update_config=1"
				
				f.puts "network={"
				f.puts "ssid=\"#{ssid}\""
				if(pin.length > 0) 
					f.puts "psk=\"#{pin}\""
				else
					f.puts "key_mgmt=NONE"
				end
				f.puts "}"
			end
		rescue
			return false
		end
		return true
	end

	def set_schedule_pattern(pattern_list,owner)
		# if Sis is connected with MSM mode then send pattern_list to MSM
		@comm_man.sis.send('',['schedule_pattern_set','OK',pattern_list]) if(@comm_man.sis != nil)
		@schedule.set_pattern(pattern_list,owner)
	end
	def get_schedule_pattern(owner)
		@schedule.get_pattern_list(owner)
	end
	def set_calendar(calendar,owner)
		@comm_man.sis.send('',['calendar_set','OK',calendar]) if(@comm_man.sis != nil)
		@schedule.set_calendar(calendar,owner)
	end
	def get_calendar(owner)
		@schedule.get_calendar_list(owner)
	end
	def add_schedule(name,owner)
		@schedule.add_program(name,owner)
#		@comm_man.sis.send('',['schedule_added','OK',name]) if(@comm_man.sis != nil)
	end
	def get_schedule_program(owner)
		@schedule.get_program(owner)
	end
	def set_schedule_program(name,owner,program)
		@comm_man.sis.send('',['schedule_program_set','OK',[name,program]]) if(@comm_man.sis != nil)
		@schedule.set_program(name,owner,program)
	end
	def rename_schedule_program(name,newname,owner)
		@comm_man.sis.send('',['schedule_program_renamed','OK',[name,newname]]) if(@comm_man.sis != nil)
		@schedule.rename_program(name,newname,owner)
	end
	def delete_schedule_program(name,owner)
		@comm_man.sis.send('',['schedule_program_deleted','OK',name]) if(@comm_man.sis != nil)
		@schedule.delete_program(name,owner)
	end

	def get_interlock(owner)
		@interlock.get_interlock(owner)
	end
	
	def add_new_interlock(name,owner,program)
		@interlock.add_new_interlock(name,owner,program)
	end
	
	def save_interlock(id, owner, interlock)
		@interlock.save_interlock(id, owner, interlock)
	end
	
	def rename_interlock(id,newname,owner)
		@interlock.rename_interlock(id,newname,owner)
	end	

	def delete_interlock(id,owner)
		@interlock.delete_interlock(id,owner)
	end		
	
	def get_hotel()
		@hotel.get_hotel()
	end
	
	def get_room_details()
		@hotel.get_room_details()
	end
	
	def save_hotel(hotel)
		@hotel.save_hotel(hotel)
	end
	
	def save_room_details(roomDetails)
		@hotel.save_room_details(roomDetails)
	end
	
	def get_scenes(owner)
		@scenes.get_scenes(owner)
	end
	
	def set_interlock_enable(id,action)	# action is true/false 
		@interlock.set_enable(id,action)
	end

	def occ_exist?
		return false if(@hotel == nil)
		return @hotel.keycard_registered?
	end

	def get_occ_stat
		id = @hotel.get_keycard_id if(@hotel != nil)
		occ = @point_list[id]
		return 'off' if(occ == nil)
		return occ.current_status['stat']
	end

  #################################################
	#Kaiwei 12/07/2018 add reports
  #################################################
	def get_report_types(owner)
		@reports.get_report_types(owner)
	end
	
  #################################################
	#Kaiwei 15/08/2018 add categorized pi
  #################################################
  def get_pi_categories(owner)
    begin
      @reports.get_pi_categories(owner)
      rescue => e
      puts "Error: #{e}"
      return false
    end
  end
  
  def get_categorized_pi(owner)
    begin
      @reports.get_categorized_pi(owner)
      rescue => e
      puts "Error: #{e}"
      return false
    end
  end
  
  def set_categorized_pi(data)
    begin
      File.open(@categorizedPiType_file,'w') do |io|
        io.puts(JSON.pretty_generate(data))
      end
 			File.chmod(0777,@categorizedPiType_file)
      @reports.get_categorized_pi(nil)
      return true
    rescue => e
      puts "Error: #{e}"
      return false
    end
  end 
 
  def set_pi_categories(data)
    begin
      File.open(@cat_file,'w') do |io|
        io.puts(JSON.pretty_generate(data))
      end
			File.chmod(0777,@cat_file)
      @reports.get_pi_categories(nil)
      return true
    rescue => e
      puts "Error: #{e}"
      return false
    end
  end 
  
  def get_start_date(owner)
    begin
      @reports.get_start_date(owner)
      rescue => e
      puts "Error: #{e}"
      return false
    end
  end
  
  def set_start_date(data)
    begin
      File.open(@reports_file,'w') do |io|
        io.puts(JSON.pretty_generate(data))
      end
      FileUtils.chmod(0666,@reports_file)
      @reports.get_start_date(nil)
      return true
    rescue => e
      puts "Error: #{e}"
      return false
    end
  end 
  
  def get_bei_regulations(owner)
    begin
      @reports.get_bei_regulations(owner)
      rescue => e
      puts "Error: #{e}"
      return false
    end
  end
  
  def set_bei_regulations(data)
    begin
      File.open(@reports_file,'w') do |io|
        io.puts(JSON.pretty_generate(data))
      end
      FileUtils.chmod(0666,@reports_file)
      @reports.get_bei_regulations(nil)
      return true
    rescue => e
      puts "Error: #{e}"
      return false
    end
  end 
  
  def get_site_info(owner)
    begin
      load_site_info(@site_file)
      rescue => e
      puts "Error: #{e}"
      return false
    end
    return @site_info
  end
  
  #################################################
  #kaiwei 24/08/2018 added db functions for reports
  #################################################
  def get_av3(from, to, points)
    @db.read_analog3(from,to,points)
  end

  def get_pv_union_all(from, to, points,selectedTimePeriod, interval_list)
    begin
      return @db.read_meter_union_all(points, interval_list)
    rescue => e
      puts "Error Data Manager: #{e}"
    end
  end
  
  def get_pv_daily2(from, to, points,selectedTimePeriod, interval_list)
    begin
      return @db.read_meter_daily2(points, interval_list)
    rescue => e
      puts "Error Data Manager: #{e}"
    end
  end
  
  def get_point_data(from, to)
    begin
      return @db.read_point_data(from, to)
    rescue => e
      puts "Error Data Manager: #{e}"
    end
  end
  #################################################
	
	def run_scenes(id, owner)
		@scenes.run_scenes(id, owner)
	end	
	
	def add_new_scenes(name,owner,program)
		@scenes.add_new_scenes(name,owner,program)
	end
	
	def save_scenes(name, owner, scenes)
		@scenes.save_scenes(name, owner, scenes)
	end
	
	def rename_scenes(name,newname,owner)
		@scenes.rename_scenes(name,newname,owner)
	end	

	def delete_scenes(id,owner)
		@scenes.delete_scenes(id,owner)
	end	
	
	def find_broadlink()
		point = nil
		
		@point_list.each do |k, v|
			if k[0..2] == 'blr'
				point = v
			end
		end

		if point != nil
			device = @device_list[point.dev_id]
		end	
	end
	
	def find_broadlink_byid(deviceID)		
		point = @point_list[deviceID]
		device = @device_list[point.dev_id]
	end
	
	def get_broadlink()		
		device = find_broadlink()
	
		if device != nil
			command = device.get_broadlink
		end
	end
	
	def save_broadlink(command)
		device = find_broadlink()
		device.save_broadlink(command)
		
		@point_list.each do |k, v|
			if k[0..2] == 'blr'			
				attr = {'command' => []}
		
				command.each do |k,v|
					attr['command'] << k			#get IR command button names and update point list commands
				end
				
				v.set_attr(attr)
			end
		end
		
		save_points(@point_file)					#save point_list file with updated IR command button names
	end
	
	def broadlink_learning(deviceID)		
		device = find_broadlink_byid(deviceID)		
		device.broadlink_learning(deviceID)
	end
	
	def get_broadlink_ircode(deviceID)
		device = find_broadlink_byid(deviceID)
		learnedcode = device.get_broadlink_ircode(deviceID)
		
		return learnedcode
	end
	
	def send_ir_command(command, deviceID) 
		device = find_broadlink_byid(deviceID)		
		device.send_ir_command(command,deviceID)
	end
	
	def get_screen_list
		default = {"top"=>{"type"=>"default"}} 
		begin
			File.open(@screen_file,'r') do |io|
				line = io.gets.strip
				return default if(line.empty?)
				return JSON.load(line)
			end
		rescue
			return default
		end
	end

	def set_screen_list(data)
		begin
			File.open(@screen_file,'w') do |io|
				io.puts(JSON.generate(data))
			end
			FileUtils.chmod(0666,@screen_file)
			@comm_man.dud('screen_list',data)
			return true
		rescue
			return false
		end
	end

	###########################
	# File IO
	###########################
	def get_file(file_name)
		begin
			json = ''
			File.open(file_name,'r') do |io|
				json = JSON.load(io)
			end
			return json
		rescue
			return nil
		end
	end

	def save_file(file_name, json)
		begin
			File.open(file_name,'w') do |io|
				io.puts(JSON.generate(json))
			end
			File.chmod(0777,file_name)
			return true
		rescue
			return false
		end
	end

	###########################
	# system information
	###########################
	def get_timezone
		if(RUBY_PLATFORM.index("linux"))
			info = `timedatectl | grep 'Time zone'`
			zone_info = info.split(':')[1].split(' ')[0]
			return zone_info
		end
		return false
	end

	def set_timezone(timezone)
		com = "sudo ln -sf /usr/share/zoneinfo/#{timezone} /etc/localtime"
		res = system(com)
		com = "sudo /usr/bin/timedatectl set-timezone #{timezone}; sudo echo '#{timezone}' > /etc/timezone"
		system(com) if(res)
		return res
	end

	def get_ntp
		if(RUBY_PLATFORM.index("linux"))
			ntp = `timedatectl | grep "Network time"`.include?('yes')
			return ntp
		end
		return false	
	end	

	def get_datetime
		if(RUBY_PLATFORM.index("linux"))
			datetime = Time.now
			return datetime
		end
		return false
	end
	
	def set_ntp(ats) #enable/disable automatic time update with NTP
		if(ats == true)
			com = "sudo /usr/bin/timedatectl set-ntp 1"
		else	
			com = "sudo /usr/bin/timedatectl set-ntp 0"
		end
		return system(com)
	end
	
	def set_datetime(datetime)
		com = "sudo /usr/bin/timedatectl set-time #{datetime}"
		return system(com)
	end	
	
	def broadlink_exist?
		device_list.each do |id,dev|
			return true if(id.start_with?('blr'))
		end
		return false
	end

	def system_update
		if($internet && @sis_url != nil)
			Thread.new do
				rnd = Random.new
				sleep(rnd.rand(1800))	# 0 to 30min delay generated 
				update = RemoteUpdate.new(@sis_url,$model,$update,$region)
				if(update.check_updater)
					puts "New version is found"
					puts "Start update procedure"
					add_history('system',['found_update'])

					if(update.preparation)
						puts "Backup current version"
						if(update.backup)
							puts "Copy new version files"
							if(update.update)
								update.clean_up
								puts "Update completed" 
								add_history('system',['sys_updated'])
								@reboot = true
							else
								puts "Update failed"
								add_history('system',['sys_update_fail'])
							end
						else
							puts "Backup failed to update"
							add_history('system',['sys_backup_fail'])
						end
					else
						puts "File to download update file"
						add_history('system',['download_fail'])
					end
				end
			end
		end
	end

	###################
	# database access method
	###################
	def get_ppd(from, to, points) 
		@db.read_ppd(from,to,points)
	end

	def get_op_time(from, to, points)
		@db.read_optime(from,to,points)
	end

	def get_on_times(from, to, points)
		@db.read_ontimes(from,to,points)
	end

	def get_pv(from, to, points)
		@db.read_meter(from,to,points)
	end

	def get_pv_daily(from, to, points)
		@db.read_meter_daily(from,to,points)
	end

	def get_av(from, to, points)
		@db.read_analog(from,to,points)
	end

	def get_bill_data(from, to, points)
		ppd = @db.read_ppd(from,to,points)
		# modify 2018/11/1 bill data read only ppd
		op_time = {} #@db.read_optime(from,to,points)
		on_times = {} #@db.read_ontimes(from,to,points)
		pv = {} #@db.read_meter(from,to,points)
		{'ppd'=>ppd,'op_time'=>op_time,'on_times'=>on_times,'pv'=>pv}
	end

	def get_error_info(from,to)
		statistics = {} # {point_id=>[datetime, error code],...}
		#return [datetime, target, contents]
		error = @history.get_error({'from'=>from,'to'=>to})
		error.each do |data|
			datetime = data[0]
			point_id = data[1]
			err_code = data[2][0]['err_code']
			err_code = 'NC' if(err_code == nil)
			statistics[point_id] = {} if(statistics[point_id] == nil)
			statistics[point_id][err_code] = [] if(statistics[point_id][err_code] == nil)
			statistics[point_id][err_code] << datetime
		end
		return statistics
	end

	###################
	# tenant relate method
	###################
	def save_tenant(file)
		puts "Update tenant list: #{file}"
		begin
			File.open(file,'w') do |io|
				io.puts(JSON.generate(@tenant_list))
			end
			File.chmod(0777,file)
			return true
		rescue => e
			puts "Error: #{e}"
			return false
		end
	end
	def load_tenant(file)
		@tenant_list = {}		# initialize tenant list
		begin
			File.open(file,"r:UTF-8") do |io|
				line = io.gets
				@tenant_list = JSON.load(line)
			end
			puts "Load tenant list"
			return true
		rescue => e
			puts "Warning: #{e}"
			return false
		end
	end

	def add_tenant(name,id_list)
		return false if(name == nil or name.length == 0)
		return false if(@tenant_list[name] != nil)
		return false if(id_list.class != Array)
		@tenant_list[name] = [id_list,nil,nil,0]	# nil is a initial value of limit and no calculated
		save_tenant(@tenant_file)
		return true
	end
	def remove_tenant(name)
		return false if(name == nil or name.length == 0)
		tenant = @tenant_list[name]
		# clear R/C prohibition when tenant is removed
		if(tenant != nil && tenant[1] != nil)
			@controlled_tenant.delete(name)
			# clear control
			clear_limit_control(tenant[0])
		end
		return false if(@tenant_list.delete(name) == nil)
		save_tenant(@tenant_file)
		return true
	end
	def register_tenant_point(name, id_list)
		return false if(name == nil or @tenant_list[name] == nil or id_list == nil)
		limit = @tenant_list[name][1]
		charged = @tenant_list[name][2]
		low = @tenant_list[name][3]
		@tenant_list[name] = [id_list,limit,charged,low]
		save_tenant(@tenant_file)
		return true
	end
	def get_tenant(name)
		return nil if(name == nil or @tenant_list[name] == nil)
		return @tenant_list[name]
	end
	def get_tenant_list
		return @tenant_list
	end

	def set_tenant_to_user(user,tenant_list)
		return false if((usr = @comm_man.get_user(user)) == false)
		usr.set_tenant_list(tenant_list)
		return true
	end

	def get_specified_tenant_list(tenant_list)
		list = {}
		tenant_list.each do |name|
			list[name] = @tenant_list[name]
		end
		return list
	end

	def update_tenant_info(old_name, new_name, id_list)
		return false if(old_name == nil or new_name == nil or @tenant_list[old_name] == nil or id_list == nil or old_name.length == 0 or new_name.length == 0)
		if(old_name == new_name)
			@tenant_list[new_name][0] = id_list
			save_tenant(@tenant_file)
			return true
		end

		limit = @tenant_list[old_name][1]
		charged = @tenant_list[old_name][2]
		low = @tenant_list[old_name][3]
		return false if(@tenant_list.delete(old_name) == nil)
		if(add_tenant(new_name,id_list) == true)
			@tenant_list[new_name][1] = limit
			@tenant_list[new_name][2] = charged
			@tenant_list[new_name][3] = low
			save_tenant(@tenant_file)
			return true
		else
			return false
		end
	end

	def set_bill_info(bill_info)
		begin
			File.open(@bill_file,'w') do |io|
				io.puts(JSON.generate(bill_info))
			end
			File.chmod(0777,@bill_file)
			make_price_map(bill_info['rate'])
			return true
		rescue => e
			puts "Error: #{e}"
			return false
		end
	end

	def get_bill_info()
		begin
			bill_info = {}
			File.open(@bill_file,"r:UTF-8") do |io|
				line = io.gets
				bill_info = JSON.load(line)
				break
			end
			return bill_info
		rescue 
			return nil
		end
	end

	def set_charged(user,name, val,low = 0) 
		tenant = @tenant_list[name]
		return false if(tenant == nil)
		if(val == nil)
			tenant[1] = nil
			tenant[2] = nil
			tenant[3] = 0
		else
			charge = val
			charge = charge - tenant[1]	if(tenant[1] != nil) # amount of charge
			charge = charge.round(2)
			tenant[1] = val
			tenant[3] = low
			# add to history
			add_history('charge',['charge',charge,val],name,'GUI',user)
		end
		check_tenant_limit
		return true
	end

	def get_charge_log
		now = Time.now
		lastyear = Time.local(now.year-1,now.month,now.day)
		opt = {'from'=>lastyear.to_i,'to'=>now.to_i,'type'=>'charge'}
		@history.get_history(5000,opt)
	end
	
	def get_history(option)
		@history.get_history(0,option)
	end	
	
	def get_first_id_number
		@history.get_first_id_number
	end
	
	###################################################
	# tenant limit control
	###################################################
	# every hour this method is called
	def check_tenant_limit
		@tenant_list.each do |name, info|
			if(limit(name,info) == true)
				if(@controlled_tenant.include?(name) == false)
					@controlled_tenant.push(name)
					# newly control target
					register_limit_control(info[0])
				end
			else
				if(@controlled_tenant.include?(name) == true)
					@controlled_tenant.delete(name)
					# clear control
					clear_limit_control(info[0])
				end
			end
		end
		save_tenant(@tenant_file)
	end

	def limit(name,tenant_info)
		return false if(tenant_info == nil) 
		return false if(tenant_info[1] == nil)	# this tenant is not a target of pre-payed
		usage,tenant_info[2] = calc_usage(tenant_info[0],tenant_info[2])	# calc last hour usage
		tenant_info[1] = tenant_info[1]-usage
		puts "#{tenant_info[1]} #{usage} #{tenant_info[2]}"
		return true if(tenant_info[1] <= 0)	# if charge is empty then it will be limited
		return false
	end

	# calculate usage from the charged time
	def calc_usage(id_list,charged)
		now = Time.now
		latest = Time.new(now.year,now.month,now.day,now.hour)
		if(charged == nil)
			# first check 
			from = latest
		else 
			from = Time.at(charged)
		end

		total = 0	# total price
		# calc each point power consumption
		data = get_ppd(from,latest,id_list)
		data.each do |id, values|
			values.each do |val|
				t = Time.at(val[0]).hour # hour of the data
				total = total + (val[1]+val[2])*@price_map[t]
			end
		end
		sum = BigDecimal.new((((total/10.0).ceil)/100.0).to_s)
		usage = sum.round(2)	# modify for 0.01 unit calculation
		puts "#{from} : #{latest} #{total/1000.0} #{latest.to_i}"
		return usage.to_f,latest.to_i
	end

	# register limit control target
	def register_limit_control(id_list)
		# stop and and prohibit control for all indoor unit in id_list
		id_list.each do |id|
			# send stop and R/C prohibition command 
			com = {'stat'=>'off','rc_proh_stat'=>'prof','on_proh'=>true}
			operate(id,com,'System','System')
		end
	end

	# remove from limit control target
	def clear_limit_control(id_list)
		# clear prohibition of control of id_list
		id_list.each do |id|
			# send clear R/C prohibition command
			com = {'rc_proh_stat'=>'permit','on_proh'=>false}
			operate(id,com,'System','System')
		end
	end

	def make_price_map(rate_info)
		return if(rate_info == nil)
		4.downto 0 do |i|
			if(rate_info[i][0] == 'enable')
				from = rate_info[i][1].to_i
				to = rate_info[i][2].to_i - 1
				price = rate_info[i][3]
				from.upto to do |t|
					@price_map[t] = price
				end
			end
		end
	end


	################################################
	# alert mail functions
	################################################
	def set_mail_server_info(server)
		# server data structure
		# {'active'=>active,address'=>addr,'port'=>port,'domain'=>domain,'user'=>user,'passwd'=>passwd,'to'=>[mail addr, mail addr],'site'=>site name,'lang'=>language}
		@comm_man.set_mail_server(server) if(@comm_man != nil)
		save_file(@mailserver_file,server)
		return true
	end

	def get_mail_server_info()
		server = get_file(@mailserver_file)
		return server
	end

	def alert_subject
		return get_string(@comm_man.alert_lang,'alert_subject')
	end

	def alert_mail(point,cos)
		body = get_string(@comm_man.alert_lang,'alert_equip')+" "+point.name+"\n"
		body += get_string(@comm_man.alert_lang,'contents')+": "+get_string(@comm_man.alert_lang,cos['err_code'])+"\n" if(cos['err_code'] != nil)
		return body
	end

	def load_string_table(file)
		@string_table = {}
		begin
			File.open(file,"r:UTF-8") do |io|
				line = io.gets
				@string_table = JSON.load(line)
			end
		rescue => e
			puts "String Table load file: #{e}"
		end
	end

	def get_string(lang,key)
		word = @string_table[lang][key]
		if(word == nil) 
			return key
		else 
			return word
		end
	end

	###################################################
	# clock
	def get_time
		@clock.get_time
	end
	###################################################
	# database 
	def store_ppd(time,dev_id,data)
		@db.add_ppd(time, dev_id, data)
	end

	def update_latest_ppd_time(dev_id,time)
		@db.update_latest_ppd_time(dev_id,time)
	end
	def get_latest_ppd_time(dev_id)
		@db.get_latest_ppd_time(dev_id)
	end

	def close_db
		@db.close
	end
	###################################################
	# Clock related functions

	# call from ClockWork
	# exec is hash array [{id=>[{action},from,who]}, ...]
	def time_exec(exec)
		exec.each do |command|
			command.each do |id, action|
				puts "time_exec #{id} #{action}"
				run_scenes(id,action[2]) if(action[0]['scene'] != nil)
				set_interlock_enable(id,action[0]['interlock']) if(action[0]['interlock'] != nil)
				operate(id,action[0],action[1],action[2]) if(@occ_stat == false)
			end
		end
	end

	# continuously done every time interval
	# store operation data every 15 min and sotre analog data every 5 min
	def every_min_exec
		time = @clock.get_min_time	# get 0 sec time

		if(time.min%5 == 0)
			# check reboot flag
			if(@reboot && RUBY_PLATFORM.index("linux"))
				`systemctl daemon-reload`
				`systemctl restart svm`
			end
		end
		# database function
		return if(@db == nil)
		return if(@point_data != true)
		if(time.min%15 == 0)
			puts "call every 15 min"
      @point_list.each_value do |point|
        point.store_running_data(time,@db)
      end
      #########################################################
      # Kaiwei added function for inserting into meter_daily
      #########################################################
      #sleep 10
      #@point_list.each_value do |point|
      #  if(point.point_type == 'Pi')
      #    sql = sql + point.get_insert_sql(time,@db)
      #  end
      #end
      #@db.push_meter_daily(sql)
      #########################################################
		end
		if(time.min%5 == 0)
			puts "call every 5 min"
			if($model.start_with?("SVM-C1") == true)
				@point_list.each_value do |point|
          
					point.store_sample_value(time,@db)
				end
			end
		end
	end

	def every_hour_exec
		puts "call every_hour"
		@schedule.update_schedule_all
		# get ppd data
		return if(@point_data != true)
		return if($ppd != true)
		threads = []
		@device_list.each_value do |device| 
			t = Thread.new do
				device.init_ppd_database
			end
			threads.push(t)
		end
		if($prepaied == true)
			Thread.new do
				threads.each do |t|
					t.join
				end
				check_tenant_limit
			end
		end
	end

	def every_day_exec
		puts "call every_day"
		Thread.new do
			@history.limit_database
#			limit = Time.now.to_i - @db_limit*365*24*60*60
			@db.limit_database
		end
		# system update check and update
		system_update
	end

  #########################################################
  # Kaiwei added function for inserting into meter_daily
  #########################################################
	def init_meter_daily()
    time = @clock.get_min_time
    begin
      sql = ""
      @point_list.each_value do |point|
        sql = sql + point.get_insert_sql(time,@db) if(point.point_type == 'Pi' || point.point_type == 'SPi')
      end
      @db.push_meter_daily(sql)
    rescue => e
      puts "Error DM.rb: #{e}"
    end
  end
  #########################################################
end
