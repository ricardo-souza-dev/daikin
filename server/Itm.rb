#coding: utf-8

require 'uri'
require 'net/http'
require 'time'
require_relative 'Device'
require_relative 'PointRequire'

class Itm < Device
	def initialize(id, data_man)
		super
		@port = 80
		@ipaddr = '192.168.0.1'
		@user = ''
		@passwd = ''
		# this is used to confirm point type in iTM
		@point_type = {}		# {id=>type,...}
		# this is used to get attribute
		# after getting attribute this hash will be empty
		@point_attr = {}		# {id=>attr_array,...}
		@temp_unit = 'C'
		@poling_wait = 5

		@id_list = []

		@url = nil
		@req = nil

		@latest_ppd_time = nil

		@clock_adjust = nil
	end

	attr_reader :point_attr
	attr_accessor :point_type, :id_list

	def key
		'itm'
	end

	def device_attr
		{'ip_addr'=>@ipaddr,'port'=>@port,'user'=>@user,'passwd'=>@passwd}
	end

	def set_attribute(attr)
		@ipaddr = attr['ip_addr'] if(attr['ip_addr'] != nil)
		@port = attr['port'] if(attr['port'] != nil)
		@user = attr['user'] if(attr['user'] != nil)
		@passwd = attr['passwd'] if(attr['passwd'] != nil)

		@url = URI.parse("http://#{@ipaddr}:#{@port}/cmd/")
		@req = Net::HTTP::Post.new(@url.path,{"Content-Type"=>"application/octet-stream"})
		@req.basic_auth(@user, @passwd)
	end

	def changed?(attr)
		return true if(@ipaddr != attr['ip_addr'])
		return true if(@port != attr['port'])
		return true if(@user != attr['user'])
		return true if(@passwd != attr['passwd'])
		return false
	end
	
	def connect
		@thread = Thread.new do
			hist_flag = true
			@latest_ppd_time = @data_man.get_latest_ppd_time(dev_id)
			loop {
				puts "Connect to iTM(#{@id}) #{@ipaddr}:#{@port}"
				contents = ['try_connect_itm',@ipaddr,@port]
				@data_man.add_history('System',contents) if(hist_flag)
				hist_flag = false
				begin
					# initialize device object
					# get system info
					ret = Itm.rcv_system_info(make_connection(Itm.req_system_info))
					ver = ret[0]
					temp_unit = ret[1]
					macaddr = ret[2]
					@temp_unit = 'C'
					@temp_unit = 'F' if(temp_unit == 1)
					# get point id list
					@id_list = Itm.rcv_point_list(make_connection(Itm.req_point_list))
					points = set_point_id_list
					puts "#{points}points recieved"
					attr_req_list = get_attr_req_list
					req_point_stat = []

					hist_flag = true
					contents = ['connected_itm']
					@data_man.add_history('System',contents) if(@connected == false)
					@connected = true
					loop {
#						begin
							if(@clock_adjust == true)
								# iTM clock adjustment
								puts "Adjust iTM time"
								Itm.rcv_clock_set(make_connection(Itm.req_clock_set()))
								@clock_adjust = nil
							end
							# get attribute
							if(attr_req_list.size > 0)
								attr = Itm.rcv_point_attribute(make_connection(Itm.req_point_attribute(attr_req_list)))
								if(set_point_attribute(attr) > 0)
									# register point to data_man
									@point_list = make_point_list
									@data_man.update_point_list(@point_list)
									attr_req_list = get_attr_req_list
									puts "All point attributes are received" if(attr_req_list.empty? == true)
									req_point_stat = get_req_stat_list	# point id list to request status 
								end
							end
							# ppd request at initial
							init_ppd_database if(@ready == false)

							# get point status
							# request point status in point_type
							stat = rcv_point_status(make_connection(Itm.req_point_status(req_point_stat)))
							# send point status to data_man as cos
							# convert to std format(hash) from device format
							status = convert_to_std(stat)
							status.each do |id, cos| @data_man.cos(id,@dev_id,cos) end

							@ready = true
#						rescue =>e
#							puts "Error #{e}"
#						end
						sleep(@poling_wait)
					}
					puts "Next connection"
				rescue => e
					dev_disconnected if(@ready == true)
					puts "Error: #{e}"
					@ready = false

					sleep(10)
				ensure
					puts "exit thread"
				end
			}
		end
		send_command 	# start send command thread
	end

	def dev_disconnected
		@data_man.add_history('System',['disconnected_itm',@ipaddr]) if(@connected)
		@connected = false

		@point_list.each_value do |point|
			@data_man.cos(point.pid,@dev_id,{'com_stat'=>false})
		end
	end

	# initialize PPD database at the first time when connected
	def init_ppd_database
		return if($ppd != true)
		time = @data_man.get_time-3600
		to = Time.new(time.year,time.month,time.day,time.hour)
		if(@latest_ppd_time == nil)
			y = time.year
			m = time.month
			from = Time.new(y,m,1)
		else
			t = @latest_ppd_time + 3600
			from = Time.new(t.year,t.month,t.day,t.hour)
		end
		from.to_i.step to.to_i,3600 do |t|
			tm = Time.at(t)
			puts "ppd #{tm}"
			if(req_ppd_data(tm) == true)
				@latest_ppd_time = tm
			else
				break
			end
		end
	end

	def req_ppd_data(time)
		1.upto 5 do |i|
			@data_man.add_history('System',["get_ppd",i,time.to_i,dev_id])
			return true if(send_ppd_req_command(time) == true)
			puts "retry"
			sleep(60)	# wait 1min and retry to get ppd data
		end
		return false
	end

	def send_ppd_req_command(time)
		ppd = Itm.rcv_ppd_data(make_connection(Itm.req_ppd(time,@id_list)))
		return false if(ppd == nil or ppd == false)
		success = ppd[1]
		return false if(success < 0)
		index = 6
		points = ppd[index]; index += 1
		time = ppd[index]; index += 1
		diff = ppd[index]; index += 1
		pdata = {}
		0.upto points-1 do |i|
			id = ManagementPoint.get_id(ppd[index],@dev_id); index += 1					
			p1 = ppd[index]; index += 1
			p2 = ppd[index]; index += 1
			pdata[id] = [p1,p2]
		end
		@data_man.store_ppd(time,@dev_id,pdata)
		@data_man.update_latest_ppd_time(@dev_id,time)
		return true
	end

	def send_command
		Thread.new do
			loop {
				begin
					make_connection(Itm.req_operation(make_command))
					sleep 2
				rescue => e
					puts "Error: #{e}"
					sleep 10
				end
			}
		end
	end

	# make device format command from std format in queue
	def make_command
		com_pack = {}
		while(@com_queue.empty? == false)
			command = @com_queue.pop 	# command is [id,{command}]
			id = command[0]
			pack = com_pack[id]
			pack = get_com_pack(@point_type[id],id)  if(pack == nil)
			set_command_to_pack(@point_type[id],pack,command[1])
			com_pack[id] = pack
		end
		com_pack.values
	end
	# return command packet of each point type
	def get_com_pack(type,id)
		case type
		when 101 	# indoor unit
			['V9eV4e2V2e2V12',[128,id,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
		when 107 	# hydrobox
			['V9eV4e2V2e2V9eVeVeV2',[144,id,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
		when 200 	# AHU
			['V9eV2',[48,id,0,0,0,0,0,0,0,0,0,0]]
		when 104 	# VAM
			['V14',[56,id,0,0,0,0,0,0,0,0,0,0,0,0]]
		when 4,6,27,31 		# Di,D3Di,External Di,BACnet Di
			['V4',[16,id,0,0]]
		when 7,26,32 		# D3Dio,External Dio,BACnet Dio
			['V9',[36,id,0,0,0,0,0,0,0]]
		when 29,33,16 	# External Ai,BACnet Ai,Internal Ai
			['V4',[16,id,0,0]]
		when 28,34 	# External Ao,BACnet Ao
			['V5e',[24,id,0,0,0,0]]
		when 5,30,24 		# Pi,External Pi,Internal Pi
			['V4',[16,id,0,0]]
		when 8 		# Outdoor Unit
			['V4',[16,id,0,0]]
		when 105 	# D3Chiller
			['V9eV6',[64,id,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
		when 108 	# Inv.Chiller
			['V9eVeV10',[88,id,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
		when 201 	# Chiller
			['V9eVeV2',[56,id,0,0,0,0,0,0,0,0,0,0,0,0]]
		when 35 	# BACnet MSi
			['V4',[16,id,0,0]]
		when 36 	# BACnet MSo
			['V6',[24,id,0,0,0,0]]
		end
	end
	# command is set to packet
	def set_command_to_pack(type,pack,command)
		command.each do |com,val|
			case com
			when 'maintenance'
				pack[1][2] = 1
				pack[1][3] = 1 if(val == true)
			when 'stat'
				case type
				when 101,107,200,104,7,26,32,105,108,201
					pack[1][4] = 1
					pack[1][5] = 1 if(val == 'on')
				end
			when 'mode'
				case type
				when 101,107,200,105,108,201
					pack[1][6] = 1
					pack[1][7] = 1 if(val == 'fan')
					pack[1][7] = 2 if(val == 'heat')
					pack[1][7] = 4 if(val == 'cool')
					pack[1][7] = 0x10 if(val == 'temp')
					pack[1][7] = 0x40 if(val == 'dry')
					pack[1][7] = 0x200 if(val == 'auto')
				end
			when 'sp'
				case type
				when 101,107,200
					pack[1][8] = 1
					pack[1][9] = val
				end
			when 'csp_limit_valid'
				case type
				when 101,107
					pack[1][12] = 1
					pack[1][13] = 1 if(val == true)
				end
			when 'hsp_limit_valid'
				case type
				when 101,107
					pack[1][16] = 1
					pack[1][17] = 1 if(val == true)
				end
			when 'csp_l'
				case type
				when 101,107
					pack[1][12] = 1
					pack[1][15] = val
				end
			when 'csp_h'
				case type
				when 101,107
					pack[1][12] = 1
					pack[1][14] = val
				end
			when 'hsp_l'
				case type
				when 101,107
					pack[1][16] = 1
					pack[1][19] = val
				end
			when 'hsp_h'
				case type
				when 101,107
					pack[1][16] = 1
					pack[1][18] = val
				end
			when 'fanstep'
				case type
				when 101
					pack[1][28] = 1
					pack[1][29] = 1 if(val == 'M')
					pack[1][29] = 2 if(val == 'H')
					pack[1][29] = 100 if(val == 'auto')
				end
			when 'flap'
				case type
				when 101
					pack[1][30] = 1
					pack[1][31] = val
					pack[1][31] = 7 if(val == 'swing')
				end
			when 'filter_clr'
				case type
				when 101
					pack[1][26] = 1
					pack[1][27] = 1 if(val == true)
				when 104
					pack[1][10] = 1
					pack[1][11] = 1 if(val == true)
				end
			when 'rc_proh_stat'
				case type
				when 101,107
					pack[1][20] = 1
					pack[1][21] = 1 if(val == 'st_only')
					pack[1][21] = 2 if(val == 'permit')
				when 104
					pack[1][12] = 1
					pack[1][13] = 1 if(val == 'st_only')
					pack[1][13] = 2 if(val == 'permit')
				when 105
					pack[1][10] = 1
					pack[1][11] = 1 if(val == 'st_only')
					pack[1][11] = 2 if(val == 'permit')
				end
			when 'rc_proh_sp'
				case type
				when 101,107
					pack[1][22] = 1
					pack[1][23] = 1 if(val == 'permit')
				when 105
					pack[1][12] = 1
					pack[1][13] = 1 if(val == 'permit')
				end
			when 'rc_proh_mode'
  			case type
  			when 101,107
  				pack[1][24] = 1
  				pack[1][24] = 1 if(val == 'permit')
  			when 105
  				pack[1][14] = 1
  				pack[1][15] = 1 if(val == 'permit')
  			end
  		when 'vmode'
  			case type
  			when 104
  				pack[1][6] = 1
  				pack[1][7] = 1 if(val == 'auto')
  				pack[1][7] = 2 if(val == 'heatex')
  				pack[1][7] = 4 if(val == 'bypass')
  			end
  		when 'vamount'
  			case type
  			when 104
  				freshup = false
  				freshup = command['fresh_up'] if(command['fresh_up'] != nil)
  				pack[1][8] = 1
  				pack[1][9] = 1 if(val == 'auto' and freshup == false)
  				pack[1][9] = 2 if(val == 'L' and freshup == false)
  				pack[1][9] = 4 if(val == 'H' and freshup == false)
  				pack[1][9] = 8 if(val == 'auto' and freshup == true)
  				pack[1][9] = 0x10 if(val == 'L' and freshup == true)
  				pack[1][9] = 0x20 if(val == 'H' and freshup == true)
  			end
  		when 'repeat'
  			case type
  			when 7,26,32
  				pack[1][6] = 1
  				pack[1][7] = 1 if(val == true)
  			end
  		when 'rep_duration'
  			case type
 	 			when 7,26,32
 	 				pack[1][6] = 1
 	 				pack[1][8] = val
 	 			end
 	 		when 'av'
 	 			case type
 	 			when 28,34
 	 				pack[1][4] = 1
 	 				pack[1][5] = val
 	 			end
 	 		when 'wreh_stat'
 	 			case type
 	 			when 107
 	 				pack[1][26] = 1
 	 				pack[1][27] = 1 if(val == 'on')
 	 			end
 	 		when 'wcsp'
 	 			case type
 	 			when 107
 	 				pack[1][28] = 1
 	 				pack[1][29] = val
 	 			when 108,201
 	 				pack[1][8] = 1
 	 				pack[1][9] = val
 	 			end
 	 		when 'whsp'
 	 			case type
 	 			when 107
 	 				pack[1][30] = 1
 	 				pack[1][31] = val
 	 			when 108,201
 	 				pack[1][10] = 1
 	 				pack[1][11] = val
 	 			end
 	 		when 'wstor_sp'
 	 			case type
 	 			when 107
 	 				pack[1][32] = 1
 	 				pack[1][33] = val
 	 			end
 	 		when 'low_noize_stat'
 	 			case type
 	 			when 107
 	 				pack[1][34] = 1
 	 				pack[1][35] = 1 if(val == 'on')
 	 			when 108,201
 	 				pack[1][12] = 1
 	 				pack[1][13] = 1 if(val == 'on')
 	 			end
 	 		when 'wsp'
 	 			case type
 	 			when 105
 	 				pack[1][8] = 1
 	 				pack[1][9] = val
 	 			end
 	 		when 'ms_val'
 	 			case type
 	 			when 36
 	 				pack[1][4] = 1
 	 				pack[1][5] = val
 	 			end
 	 		end
		end
	end

	# support function to comunicate with iTM
	# http communication handler
	# return return packet
	def make_connection(packet)
		http = Net::HTTP.new(@url.host, @url.port)
		http.open_timeout = 10
		http.read_timeout = 60
		http.start {|connection|
			@req.body = packet
			ret = connection.request(@req)
			itm = Time.parse(ret['Date']).localtime
			diff = (Time.now - itm).abs
			if($clock == 'internet'&& diff > 10 && diff < 300) # adjust time
				if($adjust_itm_clock == true && itm.min > 5 && itm.min < 55)
					# adjust iTM clock by controller clock
					puts "Adjust iTM Clock by SVM clock"
					@clock_adjust = true
				end
			elsif($clock == 'itm' && @id != 1 && diff > 10 && diff < 300) 	# slave iTM should be adjusted time
				if(itm.min > 5 & itm.min < 55)
					puts "Adjust iTM clock by SVM clock"
					@clock_adjust = true
				end
			elsif($clock == 'itm' && @id == 1 && diff > 10)	# clock is adjusted by iTM clock
				puts "Adjust time of SVM controller with iTM time"
				com = "date #{itm.strftime("%m%d%H%M%Y.%S")}"
				system(com)
			end
			ret.body
		}
	end

	# prepare point_attr by point id list
	# point_attr is initialized by this method
	# return point_attr size
	def set_point_id_list
		@point_attr = {}
		@point_type = {}
		@id_list.each do |id|
			@point_type[id] = -1
			@point_attr[id] = []
		end
		return @point_type.size
	end

	def get_attr_req_list
		@point_attr.keys
	end

	def get_req_stat_list
		list = []
		@point_type.each do |key,type|
			list << key if(type != -1)
		end
		list
	end

	# This method register point attribute get by rcv_point_attribute
	# attr is attribute array
	# return number of registered attributes 
	def set_point_attribute(attr)
		# if id is not registered, attribute will not be registered
		registered = 0
		attr.each do |point|
			next if(point[4] == 0) 	# attribute is disable
			if(@point_type[point[1]] == -1)
				@point_type[point[1]] = point[0]
				@point_attr[point[1]] = point
			end 
			registered += 1
		end
		registered
	end

	# make point list from attribute array to register data_man
	def make_point_list
		point_list = {}
		@point_attr.each do |id,attr|
			if(attr.empty? == false)
				@point_attr.delete(id) 
				point = make_point(attr)
				point_list[point.id] = point if(point != nil)
			end
		end
		point_list
	end

	# make point object from attribute
	def make_point(attr)
		case attr[0]
		when 101 	# indoor unit
			point = FcuItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 107 	# hydrobox
			point = HydroboxItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 200 	# AHU
			point = AhuItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 104 	# VAM
			point = VamItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 4,6,27,31 		# Di,D3Di,External Di,BACnet Di
			point = DiItm.new(attr[1],@dev_id)
			point.name = attr[2]
		when 7,26,32 		# D3Dio,External Dio,BACnet Dio
			point = DioItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 29,33,16 	# External Ai,BACnet Ai,Internal Ai
			point = AiItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 28,34 	# External Ao,BACnet Ao
			point = AoItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 5,30,24 		# Pi,External Pi,Internal Pi
			point = PiItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 8 		# Outdoor Unit
			point = nil
		when 105,108,201 	# D3Chiller,Inv.Chiller,Chiller
			point = ChillerItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 35 	# BACnet MSi
			point = MSiItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		when 36 	# BACnet MSo
			point = MSoItm.new(attr[1],@dev_id)
			point.name = attr[2]
			point.set_dev_attr(attr)
		end
		point
	end

	# convert device format status(array) to std format status(hash)
	def convert_to_std(stat)
		status = {}	# {id=>{status}}
		stat.each do |point|
			case @point_type[point[0]]
			when 101 	# indoor unit
				status[point[0]] = conv_indoor(point)
			when 107 	# hydrobox
				status[point[0]] = conv_hydrobox(point)
			when 200 	# AHU
				status[point[0]] = conv_ahu(point)
			when 104 	# VAM
				status[point[0]] = conv_vam(point)
			when 4,6,27,31 		# Di,D3Di,External Di,BACnet Di
				status[point[0]] = conv_di(point)
			when 7,26,32 		# D3Dio,External Dio,BACnet Dio
				status[point[0]] = conv_dio(point)
			when 29,33,16 	# External Ai,BACnet Ai,Internal Ai
				status[point[0]] = conv_aio(point)
			when 28,34 	# External Ao,BACnet Ao
				status[point[0]] = conv_aio(point)
			when 5,30,24 		# Pi,External Pi,Internal Pi
				status[point[0]] = conv_pi(point)
			when 8 		# Outdoor Unit
			when 105,108,201 	# D3Chiller,Inv.Chiller,Chiller
				status[point[0]] = conv_chiller(point)
			when 35 	# BACnet MSi
				status[point[0]] = conv_msio(point)
			when 36 	# BACnet MSo
				status[point[0]] = conv_msio(point)
			end
		end
		status
	end

	# convert deevice attribute to std hash format
	def conv_indoor(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[1] == 0 or attr[1] == 2)
		stat['stat'] = 'off' if(attr[1] == 1 or attr[1] == 3 or attr[1] == 6)
		stat['forced_off'] = false
		stat['forced_off'] = true if(attr[1] == 6)
		stat['sp'] = attr[3]
		if(attr[8] == 1)
			stat['csp_limit_valid'] = true 
			stat['csp_l'] = attr[10]
			stat['csp_h'] = attr[9]
		else
			stat['csp_limit_valid'] = false
		end
		if(attr[11] == 1)
			stat['hsp_limit_valid'] = true
			stat['hsp_l'] = attr[13]
			stat['hsp_h'] = attr[12]
		else
			stat['hsp_limit_valid'] = false
		end			
		stat['mode'],stat['actual_mode'] = get_mode(attr[2])
		stat['ch_master'] = false
		stat['ch_master'] = true if(attr[5] == 1)
		stat['fanstep'] = get_fanstep(attr[15]) if(attr[15] != -1)
		stat['flap'] = get_flap(attr[16]) if(attr[16] != -1)
		stat['filter'] = false
		stat['filter'] = true if(attr[14] == 1)
		stat['th_stat'] = 'off'
		stat['th_stat'] = 'on' if(attr[21] == 1)
		stat['defrost'] = 'off'
		stat['defrost'] = 'on' if(attr[22] == 1)
		stat['thermo_err'] = false
		stat['temp_avail'] = false
		if(attr[6] == 1)
			stat['temp'] = attr[7] 
			stat['temp_avail'] = true
		end
		stat['rc_proh_stat'] = 'permit'
		stat['rc_proh_stat'] = 'proh' if(attr[17] == 0)
		stat['rc_proh_stat'] = 'st_only' if(attr[17] == 1)
		stat['rc_proh_sp'] = 'permit'
		stat['rc_proh_sp'] = 'proh' if(attr[19] == 0)
		stat['rc_proh_mode'] = 'permit'
		stat['rc_proh_mode'] = 'proh' if(attr[18] == 0)
		stat['error'] = false
		stat['error'] = true if(attr[1] == 2 or attr[1] == 3)
		stat['alarm'] = false
		stat['err_code'] = attr[20]
		stat
	end
	def get_mode(attr)
		return 'fan','fan' if(attr == 1)
		return 'heat','heat' if(attr == 2)
		return 'cool','cool' if(attr == 4)
		return 'dry','cool' if(attr == 0x40)
		return 'auto','heat' if(attr == 0x100)
		return 'auto','cool' if(attr == 0x200)
		return '',''
	end

	def get_fanstep(attr)
		return 'L' if(attr == 0)
		return 'M' if(attr == 1)
		return 'H' if(attr == 2)
		return 'auto' if(attr == 100)
	end

	def get_flap(attr)
		return attr if(attr <= 4)
		return 'swing'
	end

	def conv_vam(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[1] == 0 or attr[1] == 2)
		stat['stat'] = 'off' if(attr[1] == 1 or attr[1] == 3)
		stat['forced_off'] = false
		stat['forced_off'] = true if(attr[1] == 6)
		stat['filter'] = false 
		stat['filter'] = true if(attr[4] == 1)
		stat['rc_proh_stat'] = 'permit'
		stat['rc_proh_stat'] = 'proh' if(attr[5] == 0)
		stat['rc_proh_stat'] = 'st_only' if(attr[5] == 1)
		stat['error'] = false
		stat['error'] = true if(attr[1] == 2 or attr[1] == 3)
		stat['alarm'] = false
		stat['err_code'] = attr[6]
		stat['vmode'] = get_vmode(attr[2])
		stat['vamount'],stat['fresh_up'] = get_vamount(attr[3])
		stat
	end
	def get_vmode(attr)
		return 'auto' if(attr == 1)
		return 'heatex' if(attr == 2)
		return 'bypass' if(attr == 4)
		return ''
	end
	def get_vamount(attr)
		freshup = false if(attr < 8)
		freshup = true if(attr >= 8)
		return 'auto',freshup if(attr == 1 or attr == 8)
		return 'L',freshup if(attr == 2 or attr == 0x10)
		return 'H',freshup if(attr == 4 or attr == 0x20)
		return '',''
	end
	
	def conv_di(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[1] == 0 or attr[1] == 2)
		stat['stat'] = 'off' if(attr[1] == 1 or attr[1] == 3)
		stat['error'] = false
		if(attr[1] == 2 or attr[1] == 3 or attr[2] > 0)
			stat['error'] = true 
			stat['err_code'] = 'D3' if(attr[2] == 1)
			stat['err_code'] = 'equip' if(attr[2] == 2)
			stat['err_code'] = 'port' if(attr[2] == 3)
		end
		stat
	end

	def conv_dio(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[1] == 0)
		stat['stat'] = 'off' if(attr[1] == 1)
		stat['error'] = false
		if(attr[1] == 2 or attr[1] == 3 or attr[2] > 0)
			stat['error'] = true 
			stat['err_code'] = 'D3' if(attr[2] == 1)
			stat['err_code'] = 'equip' if(attr[2] == 2)
			stat['err_code'] = 'port' if(attr[2] == 3)
		end
		stat['repeat'] = false
		stat['repaet'] = true if(attr[3] == 1)
		stat['rep_duration'] = attr[4]
		stat
	end

	def conv_aio(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['error'] = false
		stat['error'] = true if(attr[1] == 3)
		stat['err_code'] = 'port' if(attr[3] ==3)
		stat['err_code'] = 'ulimit' if(attr[3] ==4)
		stat['err_code'] = 'llimit' if(attr[3] ==5)
		stat['av'] = attr[2]
		stat
	end

	def conv_pi(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['error'] = false
		stat['error'] = true if(attr[1] == 3)
		stat['meter'] = attr[2]
		stat
	end

	def conv_hydrobox(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[1] == 0 or attr[1] == 2)
		stat['stat'] = 'off' if(attr[1] == 1 or attr[1] == 3 or attr[1] == 6)
		stat['forced_off'] = false
		stat['forced_off'] = true if(attr[1] == 6)
		stat['sp'] = attr[3]
		if(attr[8] == 1)
			stat['csp_limit_valid'] = true 
			stat['csp_l'] = attr[10]
			stat['csp_h'] = attr[9]
		else
			stat['csp_limit_valid'] = false
		end
		if(attr[11] == 1)
			stat['hsp_limit_valid'] = true
			stat['hsp_l'] = attr[13]
			stat['hsp_h'] = attr[12]
		else
			stat['hsp_limit_valid'] = false
		end			
		stat['mode'],val = get_mode(attr[2])
		stat['ch_master'] = false
		stat['ch_master'] = true if(attr[5] == 1)
		stat['th_stat'] = 'off'
		stat['th_stat'] = 'on' if(attr[18] == 1)
		stat['defrost'] = 'off'
		stat['defrost'] = 'on' if(attr[19] == 1)
		stat['thermo_err'] = false
		stat['temp_avail'] = false
		if(attr[6] == 1)
			stat['temp'] = attr[7] 
			stat['temp_avail'] = true
		end
		stat['rc_proh_stat'] = 'permit'
		stat['rc_proh_stat'] = 'proh' if(attr[14] == 0)
		stat['rc_proh_stat'] = 'st_only' if(attr[14] == 1)
		stat['rc_proh_sp'] = 'permit'
		stat['rc_proh_sp'] = 'proh' if(attr[16] == 0)
		stat['rc_proh_mode'] = 'permit'
		stat['rc_proh_mode'] = 'proh' if(attr[15] == 0)
		stat['error'] = false
		stat['error'] = true if(attr[1] == 2 or attr[1] == 3)
		stat['alarm'] = false
		stat['err_code'] = attr[17]
		stat['wreh_stat'] = 'off'
		stat['wreh_stat'] = 'on' if(attr[22] == 1) 
		stat['wstor_stat'] = 'off'
		stat['wstor_stat'] = 'on' if(attr[23] == 1)
		stat['wcsp'] = attr[24]
		stat['whsp'] = attr[25]
		stat['wstor_sp'] = attr[26]
		stat['low_noize_stat'] = 'off'
		stat['low_noize_stat'] = 'on' if(attr[27] == 1)
		stat
	end

	def conv_ahu(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[1] == 0 or attr[1] == 2)
		stat['stat'] = 'off' if(attr[1] == 1 or attr[1] == 3 or attr[1] == 6)
		stat['forced_off'] = false
		stat['forced_off'] = true if(attr[1] == 6)
		stat['sp'] = attr[3]
		stat['mode'],stat['actual_mode'] = get_mode(attr[2])
		stat['temp'] = attr[5]
		stat['error'] = false
		stat['error'] = true if(attr[1] == 2 or attr[1] == 3)
		stat
	end

	def conv_chiller(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[1] == 0 or attr[1] == 2)
		stat['stat'] = 'off' if(attr[1] == 1 or attr[1] == 3 or attr[1] == 6)
		stat['forced_off'] = false
		stat['forced_off'] = true if(attr[1] == 6)
		stat['mode'],val = get_mode(attr[2])
		stat['error'] = false
		stat['error'] = true if(attr[1] == 2 or attr[1] == 3)
		stat['alarm'] = false
		stat['err_code'] = attr[3]
		case @point_type[attr[0]]
		when 105 	# D3Chiller
			stat['rc_proh_stat'] = 'permit'
			stat['rc_proh_stat'] = 'proh' if(attr[5] == 0)
			stat['rc_proh_stat'] = 'st_only' if(attr[5] == 1)
			stat['rc_proh_sp'] = 'permit'
			stat['rc_proh_sp'] = 'proh' if(attr[7] == 0)
			stat['rc_proh_mode'] = 'permit'
			stat['rc_proh_mode'] = 'proh' if(attr[6] == 0)
			stat['wsp'] = attr[4]
			stat['iw_avail'] = false
			stat['iw_avail'] = true if(attr[8] == 1)
			stat['iw_temp'] = attr[9]
			stat['ow_avail'] = false
			stat['ow_avail'] = true if(attr[10] == 1)
			stat['ow_temp'] = attr[11]
		when 108 	# Inv.Chiller
			stat['defrost'] = 'off'
			stat['defrost'] = 'on' if(attr[10] == 1)
			stat['rc_proh_stat'] = 'permit'
			stat['rc_proh_stat'] = 'proh' if(attr[7] == 0)
			stat['rc_proh_stat'] = 'st_only' if(attr[7] == 1)
			stat['rc_proh_sp'] = 'permit'
			stat['rc_proh_sp'] = 'proh' if(attr[9] == 0)
			stat['rc_proh_mode'] = 'permit'
			stat['rc_proh_mode'] = 'proh' if(attr[8] == 0)
			stat['wcsp'] = attr[4]
			stat['whsp'] = attr[5]
			stat['low_noize_stat'] = 'off'
			stat['low_noize_stat'] = 'on' if(attr[6] == 1)
			stat['iw_avail'] = false
			stat['ow_avail'] = false
		when 201 	# Chiller
			stat['th_stat'] = 'off'
			stat['th_stat'] = 'on' if(attr[11] == 1)
			stat['wcsp'] = attr[4]
			stat['whsp'] = attr[5]
			stat['iw_avail'] = true
			stat['iw_temp'] = attr[6]
			stat['ow_avail'] = true
			stat['ow_temp'] = attr[7]
		end
		stat
	end

	def conv_msio(attr)
		stat = {'maintenance'=> false,'com_stat'=>true}
		if(attr[1] == 5)
			stat['maintenance'] = true 
			return stat
		elsif(attr[1] == 4)
			stat['com_stat'] = false
			return stat
		end
		stat['ms_val'] = attr[2]
		stat
	end

	##############################################
	# support methods to communiate iTM
	# these method convert array <--> communication binary data
	# dvice program does not care communication format
	# only care data format by array described in document
	##############################################
	# make request command packet
	# request system info
	def Itm.req_system_info
		# always check reboot flag
		[32,71310,1,0,0,0,0,0].pack('V8')
	end

	# request set current time
	# argument is Time object
	def Itm.req_set_time(time)
		[32,71300,time.to_i,0,0,0,0,0].pack('V8')
	end

	# request point list
	def Itm.req_point_list
		[32,71000,0,0,0,0,0,0].pack('V8')
	end

	# request point attribute
	# argument is point id array
	def Itm.req_point_attribute(point_list)
		raise ArgumentError,"argument should be Array" if(point_list.class != Array)
		points = point_list.size
		([32+points*4,71002,points,0,0,0,0,0]+point_list).pack('V*')
	end

	# request point status
	# argument is point id array
	def Itm.req_point_status(point_list)
		raise ArgumentError,"argument should be Array" if(point_list.class != Array)
		points = point_list.size
		([32+points*4,71004,points,0,0,0,0,0]+point_list).pack('V*')
	end

	# request operation of points
	# argument is command array
	# comamnd aray is [[command encoder of a point, command array of a point],[command encoder of a point, command array of a point],...]
	# up to 100 points command can be set
	def Itm.req_operation(command_array)
		raise ArgumentError,"argument should be Array" if command_array.class != Array
		raise ArgumentError,"points should be less than 100" if command_array.length > 100
		points = 0
		ret = ""
		size = 32
		command_array.each do |command|
			points = points+1
			raise ArgumentError, "command should be Array" if command.class != Array
			size = size + command[1][0]
			ret = ret +command[1].pack(command[0])
		end
		[size,71006,points,0,0,0,0,0].pack('V8')+ret
	end

	# request PPD data period
	def Itm.req_ppd_period
		[32,71102,0,0,0,0,0,0].pack('V8')
	end

	# request PPD data
	# time is Time object
	# point_list is id array
	def Itm.req_ppd(time,point_list)
		points = point_list.size
		size = 32+points*4
		([size,71100,points,time.to_i,time.to_i,0,0,0]+point_list).pack('V*')
	end

	# request database period
	def Itm.req_database_period
		[32,71152,0,0,0,0,0,0].pack('V8')
	end

	# request database data
	# from, to is Time object
	# point_list is array of point id
	def Itm.req_database(from,to,point_list)
		points = point_list.size
		size = 32+points*4
		([size,71150,points,from.to_i,to.to_i,0,0,0]+point_list).pack('V*')
	end

	# request set clock of iTM
	def Itm.req_clock_set()
		size = 32
		time_t = Time.now.to_i
		([size,71300,time_t,0,0,0,0,0]).pack('V*')
	end

	# receive data handling
	# receive system info
	# argument is data packet of return data
	# return value is hash include data ['version','temp_unit','MACaddr','itm_version']
	def Itm.rcv_system_info(packet)
		ret = []
		header = Itm.argument_check(packet, 71311)
		itm_version = packet[32,24].encode('utf-8','utf-16le').strip
		ret << header[2]
		ret << header[3]
		ret << sprintf('%2.2X',header[4]&0xff)+sprintf('%2.2X',(header[4]>>8)&0xff)+sprintf('%2.2X',(header[4]>>16)&0xff)+sprintf('%2.2X',(header[4]>>24)&0xff)+sprintf('%2.2X',header[5]&0xff)+sprintf('%2.2X',(header[5]>>8)&0xff)
		ret << itm_version
		ret
	end

	# receive point list
	# return value is id array [id, ...]
	def Itm.rcv_point_list(packet)
		header = Itm.argument_check(packet,71001)
		packet[32,header[2]*4].unpack('V*')
	end

	# receive point attributes
	# return value is point attribute hash {id => attribute}
	# point attribute is array [type,name,ppd,attributes of each point type]
	def Itm.rcv_point_attribute(packet)
		header = Itm.argument_check(packet,71003)
		points = header[2]
		start = 32
		ret = []
		1.upto points do
			size = packet[start..-1].unpack('V')[0]
			start = start+4
			type = packet[start..-1].unpack('V2')
			start = start+8
			name = packet[start,24].encode('utf-8','utf-16le').strip
			start = start+24
			type << name
			attr = packet[start..-1].unpack('lV')
			start = start+8
			type = type + attr
			case type[0]
			when 101 	# indoor unit
				type= type+Itm.convert_std_packet(packet,start,'V2e5V6',2,6)
				start = start+size-44
			when 107 	# hydrobox
				type= type+Itm.convert_std_packet(packet,start,'V2e5V6e5V2',2,6)
				18.upto 22 do |i| type[i] = type[i].round(1) end
				start = start+size-44
			when 200 	# AHU
				type= type+Itm.convert_std_packet(packet,start,'V2e5V3',2,6)
				start = start+size-44
			when 104 	# VAM
				type= type+Itm.convert_std_packet(packet,start,'V6')
				start = start+size-44
			when 4 		# Di
				type= type+Itm.convert_std_packet(packet,start,'V3')
				start = start+size-44
			when 6 		# D3Dio
				type= type+Itm.convert_std_packet(packet,start,'V2')
				start = start+size-44
			when 27 	# External Di
				type= type+Itm.convert_std_packet(packet,start,'V3')
				start = start+size-44
			when 31 	# BACnet Di
				type= type+Itm.convert_std_packet(packet,start,'V5')
				start = start+size-44
			when 7 		# D3Dio
				type= type+Itm.convert_std_packet(packet,start,'V3')
				start = start+size-44
			when 26 	# External Dio
				type= type+Itm.convert_std_packet(packet,start,'V7')
				start = start+size-44
			when 32 	# BACnet Dio
				type= type+Itm.convert_std_packet(packet,start,'V8')
				start = start+size-44
			when 29 	# External Ai
				type << packet[start,16].encode('utf-8','utf-16le').strip
				start = start+16
				type = type+Itm.convert_std_packet(packet,start,'VeVe3V4',3,5)
				type[7] = type[7].round(1)
				start = start+size-60
			when 33 	# BACnet Ai
				type << packet[start,16].encode('utf-8','utf-16le').strip
				start = start+16
				type = type+Itm.convert_std_packet(packet,start,'VeVe3V4',3,5)
				type[7] = type[7].round(1)
				start = start+size-60
			when 16 	# Internal Ai
				type << packet[start,16].encode('utf-8','utf-16le').strip
				start = start+16
				type = type+Itm.convert_std_packet(packet,start,'VeVeV2')
				type[7] = type[7].round(1)
				type[9] = type[9].round(1)
				start = start+size-60
			when 28 	# External Ao
				type << packet[start,16].encode('utf-8','utf-16le').strip
				start = start+16
				type = type+Itm.convert_std_packet(packet,start,'Ve2lV3',1,1)
				start = start+size-60
			when 34 	# BACnet Ao
				type << packet[start,16].encode('utf-8','utf-16le').strip
				start = start+16
				type = type+Itm.convert_std_packet(packet,start,'Ve2lV4',1,1)
				start = start+size-60
			when 5 		# Pi
				type << packet[start,16].encode('utf-8','utf-16le').strip
				start = start+16
				type = type+Itm.convert_std_packet(packet,start,'V2el',2,2)
				start = start+size-60
			when 30 	# External Pi
				type << packet[start,16].encode('utf-8','utf-16le').strip
				start = start+16
				type = type+Itm.convert_std_packet(packet,start,'V2el',2,2)
				start = start+size-60
			when 24 	# Internal Pi
				type << packet[start,16].encode('utf-8','utf-16le').strip
				start = start+16
				type = type+Itm.convert_std_packet(packet,start,'V2e2',2,3)
				start = start+size-60
			when 8 		# Outdoor Unit
				type = type+Itm.convert_std_packet(packet,start,'V2')
				start = start+size-44
			when 105 	# D3Chiller
				type = type+Itm.convert_std_packet(packet,start,'V5e3',5,7)
				start = start+size-44
			when 108 	# Inv.Chiller
				type = type+Itm.convert_std_packet(packet,start,'V5e5V2',5,9)
				start = start+size-44
			when 201 	# Chiller
				type = type+Itm.convert_std_packet(packet,start,'V3e5V2',3,7)
				start = start+size-44
			when 35 	# BACnet MSi
				type = type+packet[start..-1].unpack('V3')
				start = start+12
				strlen = 52
				1.upto 10 do |i|
					type << packet[start,strlen].encode('utf-8','utf-16le').strip
					start = start+strlen
				end
			when 36 	# BACnet MSo
				type = type+packet[start..-1].unpack('V4')
				start = start+16
				strlen = 52
				1.upto 10 do |i|
					type << packet[start,strlen].encode('utf-8','utf-16le').strip
					start = start+strlen
				end
			else
				start = start+size-44
				type = nil
			end
			ret << type if(type != nil)
		end
		ret
	end
	def Itm.convert_std_packet(packet,start,format,fp1=nil,fp2=nil)
		attr = packet[start..-1].unpack(format)
		fp1.upto fp2 do |i| attr[i] = attr[i].round(1) end if(fp1 != nil)
		return attr 
	end

	# receive point status
	# return value is point status array
	def rcv_point_status(packet)
		header = Itm.argument_check(packet,71005)
		points = header[2]
		reboot = header[3]
		start = 32
		ret = []
		raise StandardError.new('iTM is rebooted') if reboot > 0

		1.upto points do
			# info is [size,id]
			info = packet[start..-1].unpack('V2')
			type = @point_type[info[1]]		# get point attribute by id
			if(type == 0)	# attribute is not exist
				start += info[0]
				next
			end 
			start +=4
			case type 	# read from point ID
			when 101	# indoor unit
				stat = packet[start..-1].unpack('V3eVlVeVe2Ve2l6')
				start += 80
				stat << packet[start,12].encode('utf-8','utf-16le').strip
				start += 12
				stat += packet[start..-1].unpack('V4')
				start += 16
				stat[3] = stat[3].round(1)
				stat[7] = stat[7].round(1)
				stat[9] = stat[9].round(1)
				stat[10] = stat[10].round(1)
				stat[12] = stat[12].round(1)
				stat[13] = stat[13].round(1)
				ret << stat
			when 107 	# hydrobox
				stat = packet[start..-1].unpack('V3eVlVeVe2Ve2l3')
				start += 68
				stat << packet[start,12].encode('utf-8','utf-16le').strip
				start += 12
				stat += packet[start..-1].unpack('V4l2e3l')
				start += 40
				stat[3] = stat[3].round(1)
				stat[7] = stat[7].round(1)
				stat[9] = stat[9].round(1)
				stat[10] = stat[10].round(1)
				stat[12] = stat[12].round(1)
				stat[13] = stat[13].round(1)
				stat[24] = stat[24].round(1)
				stat[25] = stat[25].round(1)
				stat[26] = stat[26].round(1)
				ret << stat
			when 200 	# AHU
				stat = packet[start..-1].unpack('V3eVe')
				start += 24
				stat[3] = stat[3].round(1)
				stat[5] = stat[5].round(1)
				ret << stat
			when 104 	# VAM
				stat = packet[start..-1].unpack('V4l2')
				start += 24
				stat << packet[start,12].encode('utf-8','utf-16le').strip
				start += 12
				stat += packet[start..-1].unpack('V2')
				start += 8
				ret << stat
			when 4,6,27,31 		# Di,D3Dio,External Di,BACnet Di
				stat = packet[start..-1].unpack('V3')
				start += 12
				ret << stat
			when 7 		# D3Dio
				stat = packet[start..-1].unpack('V3lV2')
				start += 24
				ret << stat
			when 26,32 	# External Dio,BACnet Dio
				stat = packet[start..-1].unpack('V3lV')
				start += 20
				ret << stat
			when 29,33,16,28,34 	# External Ai,BACnet Ai,Internal Ai,External Ao,BACnet Ao
				stat = packet[start..-1].unpack('V2eV')
				start += 16
				stat[2] = stat[2].round(1)
				ret << stat
			when 5,30,24 		# Pi,External Pi,Internal Pi
				stat = packet[start..-1].unpack('V2E')
				start += 16
				stat[2] = stat[2].round(2)
				ret << stat
			when 8 		# Outdoor Unit
				stat = packet[start..-1].unpack('V2')
				start += 8
				ret << stat
			when 105 	# D3Chiller
				stat = packet[start..-1].unpack('V3')
				start += 12
				stat << packet[start,12].encode('utf-8','utf-16le').strip
				start += 12
				stat += packet[start..-1].unpack('el3VeVeV2')
				start += 40
				stat[4] = stat[4].round(1)
				stat[9] = stat[9].round(1)
				stat[11] = stat[11].round(1)
				ret << stat
			when 108 	# Inv.Chiller
				stat = packet[start..-1].unpack('V3')
				start += 12
				stat << packet[start,12].encode('utf-8','utf-16le').strip
				start += 12
				stat += packet[start..-1].unpack('eel4V4')
				start += 40
				stat[4] = stat[4].round(1)
				stat[5] = stat[5].round(1)
				ret << stat
			when 201 	# Chiller
				stat = packet[start..-1].unpack('V3')
				start += 12
				stat << packet[start,12].encode('utf-8','utf-16le').strip
				start += 12
				stat += packet[start..-1].unpack('e4V5')
				start += 36
				stat[4] = stat[4].round(1)
				stat[5] = stat[5].round(1)
				stat[6] = stat[6].round(1)
				stat[7] = stat[7].round(1)
				ret << stat
			when 35,36 	# BACnet MSi,BACnet MSo
				stat = packet[start..-1].unpack('V3')
				start += 12
				ret << stat
			end
		end
		ret
	end

	# receive command response
	# return command response hash for each id
	def Itm.rcv_command_response(packet)
		header = Itm.argument_check(packet,71007)
		packet[32..-1].unpack('V*')
	end

	# receive PPD data period
	def Itm.rcv_ppd_period(packet)
		header = Itm.argument_check(packet,71103)
		packet[8..-1].unpack('V*')
	end

	# receive PPD data
	def Itm.rcv_ppd_data(packet)
		header = Itm.argument_check(packet,71101)
		return false if(header[3] == 0)
		return nil if(header[3] != 1)
		packet[8..-1].unpack('V*')
	end

	# receive database period
	# return database period(Time) array 0:from, 1:to
	# if database data is not exist return empty array
	def Itm.rcv_database_period(packet)
		header = Itm.argument_check(packet,71153)
		header[2..-1]
	end

	# receive database data
	# return database data
	# data structure is [[time,zone,[id,type,data],[id,type,data],...],[time,zone,[id,type,data],...]]
	def Itm.rcv_database(packet)
		header = Itm.argument_check(packet,71151)
		hours = header[2]
		start = 32
		ret = header[2..-1]
		1.upto hours do
			header = packet[start,16].unpack('V4')
			ret += header
			start += 16
			1.upto header[1] do 
				p_head = packet[start,8].unpack('V2')
				start += 8
				ret += p_head
				case p_head[1]
				when 1 	# indoor unit
					data = packet[start,44].unpack('e3Ve3V4')
					start += 44
					data[0] = data[0].round(1)
					data[1] = data[1].round(1)
					data[2] = data[2].round(1)
					data[4] = data[4].round(1)
					data[5] = data[5].round(1)
					data[6] = data[6].round(1)
					ret += data
				when 2 	# VAM
					data = packet[start,8].unpack('V2')
					start += 8
					ret += data
				when 3 	# D3chiller
					data = packet[start,44].unpack('V4e3Ve3')
					start += 44
					data[4] = data[4].round(1)
					data[5] = data[5].round(1)
					data[6] = data[6].round(1)
					data[8] = data[8].round(1)
					data[9] = data[9].round(1)
					data[10] = data[10].round(1)
					ret += data
				when 4 	# Di/Dio
					data = packet[start,8].unpack('V2')
					start += 8
					ret += data
				when 5 	# Pi
					data = packet[start,8].unpack('E')
					start += 8
					data[0] = data[0].round(2)
					ret += data
				when 6 	# Ai
					data = packet[start,4].unpack('e')
					start += 4
					data[0] = data[0].round(1)
					ret += data
				end
			end
		end
		ret
	end

	# receive clock adjustment command return
	def Itm.rcv_clock_set(packet)
		header = Itm.argument_check(packet,71301)
	end

	# argument error check
	# return header array if packet is correct
	def Itm.argument_check(packet, command)
		header = packet.unpack('V8')
		raise ArgumentError,"command number is wrong #{header[1]} != #{command}" if(header[1] != command)
		raise ArgumentError,"packet size is wrong #{packet.length}" if(header[0] != packet.length)
		header
	end
end
