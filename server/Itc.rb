#coding: utf-8

require 'net/http'
require 'uri'
require_relative 'Device'
require_relative 'FcuItc'
require_relative 'VamItc'
require_relative 'DioItc'

class Itc < Device
	def initialize(id, data_man)
		super
		@port = 80
		@ipaddr = '192.168.0.1'
		@poling_wait = 2

		@point_type = {}

		@url = nil
		@req = nil
	end

	def key
		'itc'
	end

	def device_attr
		{'ip_addr'=>@ipaddr,'port'=>@port}
	end

	def set_attribute(attr)
		@ipaddr = attr['ip_addr'] if(attr['ip_addr'] != nil)
		@port = attr['port'] if(attr['port'] != nil)

		@url = URI.parse("http://#{@ipaddr}:#{@port}/cmd/")
		@req = Net::HTTP::Post.new(@url.path,{"type"=>"application/octet-stream"})
	end

	def changed?(attr)
		return true if(@ipaddr != attr['ip_addr'])
		return true if(@port != attr['port'])
		return false
	end
	
	def connect
		@thread = Thread.new do
			hist_flag = true
			loop {
				comm_counter = 0
				puts "Connect to iTC(#{@id}) #{@ipaddr}:#{@port}"
				contents = ['try_connect_itc',@ipaddr,@port]
				@data_man.add_history('System',contents) if(hist_flag)
				hist_flag = false
				begin
					# get point attribute
					attr_list = Itc.rcv_point_attribute(make_connection(Itc.req_point_attribute))
						puts "Connected iTC(#{@id})"
					contents = ['connected_itc']
					@data_man.add_history('System',contents) if(@connected == false)
					@connected = true

					# register point to data_man
					@point_list = make_point_list(attr_list)
					@data_man.update_point_list(@point_list)
					hist_flag = true

					@ready = true
					loop {
						# get point id list
						begin
							id_list = Itc.rcv_point_list(make_connection(Itc.req_point_list))
#						rescue => e
#							puts "ERROR: #{e}"
#						end

						# id_list is array of 16 8bit values
						# id_list is used to read point status					
						# get point status
						# request point status in point_type
#						begin
							stat = Itc.rcv_point_status(make_connection(Itc.req_point_status(id_list)))
							# send point status to data_man as cos
							# convert to std format(hash) from device format
							status = convert_to_std(stat)
							status.each do |id, cos| @data_man.cos(id,@dev_id,cos) end
							comm_counter = 0
						rescue => e
							comm_counter += 1
							puts "ERROR: #{e}"
							if(comm_counter > 5)
								comm_counter = 0
								raise e
							end
						end
#						make_connection(Itc.req_operation(make_command))
						sleep(@poling_wait)
					}
				rescue => e
					dev_disconnected if(@ready == true)
					puts "Error: #{e} #{e.backtrace}"
					@ready = false
					sleep(10)
					puts "Next connection"
				end
			}
		end
		send_command
	end

	def dev_disconnected
		@data_man.add_history('System',['disconnected_itc',@ipaddr]) if(@connected)
		@connected = false

		@point_list.each_value do |point|
			@data_man.cos(point.pid,@dev_id,{'com_stat'=>false})
		end
	end

	def send_command
		Thread.new do
			loop {
				begin
					make_connection(Itc.req_operation(make_command))
					sleep(1)
				rescue => e
					puts "Command send error: #{e}"
					sleep(10)
				end
			}
		end
	end

	def make_command
		com_pack = {}
		while(@com_queue.empty? == false)
			command = @com_queue.pop 	# command is [id,{command}]
			puts "SND: #{command}"
			pack = com_pack[command[0]]
			pack = [command[0]-1,0,0,0,0,0,0,0,0,0,0] if(pack == nil)
			command[1].each do |com,val|
				case com
				when 'stat'
					pack[1] |= 0b1
					pack[2] = 0 if(val == 'off')
					pack[2] = 1 if(val == 'on')
				when 'sp'
					pack[1] |= 0b10000
					pack[6] = val
				when 'mode'
					pack[1] |= 0b10
					pack[3] = get_mode_val(val)
				when 'fanstep'
					pack[1] |= 0b100000
					pack[7] = get_fanstep_val(val)
				when 'flap'
					pack[1] |= 0b1000000
					pack[8] = get_flap_val(val)
				when 'filter_clr'
					pack[9] = 1 if(val == true)
					pack[9] = 0 if(val == false)
				when 'vmode'
					pack[1] |= 0b100
					pack[4] = get_vmode_val(val)
				when 'vamount'
					pack[1] |= 0b1000
					pack[5] = get_vamount_val(val,command[1]['fresh_up'])
				end
			end
			com_pack[command[0]] = pack
		end
		com_pack.values
	end
	def get_mode_val(mode)
		return 1 if(mode == 'fan')
		return 2 if(mode == 'heat')
		return 4 if(mode == 'cool')
		return 0x10 if(mode == 'temp')
		return 0x40 if(mode == 'dry')
		return 0x200 if(mode == 'auto')
		return 0
	end
	def get_fanstep_val(fanstep)
		return 0 if(fanstep == 'L')
		return 1 if(fanstep == 'M')
		return 2 if(fanstep == 'H')
		return 100 if(fanstep == 'auto')
		return 0
	end
	def get_flap_val(flap)
		return 7 if(flap == 'swing')
		return flap
	end
	def get_vmode_val(vmode)
		return 1 if(vmode == 'auto')
		return 2 if(vmode == 'heatex')
		return 4 if(vmode == 'bypass')
		return 0
	end
	def get_vamount_val(vamount,freshup)
		if(freshup == nil or freshup == false)
			return 1 if(vamount == 'auto')
			return 2 if(vamount == 'L')
			return 4 if(vamount == 'H')
		else
			return 8 if(vamount == 'auto')
			return 0x10 if(vamount == 'L')
			return 0x20 if(vamount == 'H')
		end
		return 0
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
			ret.body
		}
	end

	# make point list from attribute array to register data_man
	def make_point_list(attr_list)
		point_list = {}
		id = 1
		attr_list.each do |attr|
			if(attr[2] > 0)
				point = make_point(id,attr)
				point_list[point.id] = point if(point != nil)
			end
			id += 1
		end
		point_list
	end
	def make_point(id,attr)
		point = nil
		case attr[2]
		when 6 	# D3Di
			point = DiItc.new(id,@dev_id)
			@point_type[id] = 'di'
		when 7 	# D3Dio
			point = DioItc.new(id,@dev_id)
			@point_type[id] = 'dio'
		when 9 	# Indoor or VAM
			if(attr[3] == 0) 	# indoor unit
				point = FcuItc.new(id,@dev_id)
				@point_type[id] = 'indoor'
			elsif(attr[3] == 3) 	# VAM
				point = VamItc.new(id,@dev_id)
				@point_type[id] = 'vam'
			end
		end
		point.name = attr[0] if(point != nil)
		point
	end

	# convert device format status(array) to std format status(hash)
	def convert_to_std(stat)
		status = {}	# {id=>{status}}
		stat.each do |point|
			id = point[0]+1
			case @point_type[id]
			when 'indoor' 	# indoor unit
				status[id] = conv_indoor(point)
			when 'vam' 	# VAM
				status[id] = conv_vam(point)
			when 'di' 		# D3Di
				status[id] = conv_dio(point)
			when 'dio' 		# D3Dio
				status[id] = conv_dio(point)
			end
		end
		status
	end

	# convert deevice attribute to std hash format
	def conv_indoor(attr)
		stat = {'com_stat'=>true}
		if(attr[1] == 0 and attr[2] == '')
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[3] == 1)
		stat['stat'] = 'off' if(attr[3] == 0)
		stat['sp'] = attr[9]
		stat['mode'],stat['actual_mode'] = get_mode(attr[4])
		stat['ch_master'] = true
		stat['fanstep'] = get_fanstep(attr[10]) if(attr[10] != -1)
		stat['flap'] = get_flap(attr[11]) if(attr[11] != -1)
		stat['filter'] = false
		stat['filter'] = true if(attr[12] > 0)
		stat['defrost'] = 'off'
		stat['defrost'] = 'on' if(attr[13] > 0)
		stat['temp_avail'] = false
		if(attr[7] & 0x2 > 0)
			stat['temp'] = attr[8] 
			stat['temp_avail'] = true
		end
		stat['error'] = false
		stat['error'] = true if(attr[1] == 0 or attr[2] != '')
		stat['alarm'] = false
		stat['err_code'] = attr[2]
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
		stat = {'com_stat'=>true}
		if(attr[1] == 0 and attr[2] == '')
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[3] == 1)
		stat['stat'] = 'off' if(attr[3] == 0)
		stat['filter'] = false
		stat['filter'] = true if(attr[12] > 0)
		stat['error'] = false
		stat['error'] = true if(attr[1] == 0 or attr[2] != '')
		stat['alarm'] = false
		stat['err_code'] = attr[2]
		stat['vmode'] = get_vmode(attr[5])
		stat['vamount'],stat['fresh_up'] = get_vamount(attr[6])
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
	
	def conv_dio(attr)
		stat = {'com_stat'=>true}
		if(attr[1] == 0 and attr[2] == '')
			stat['com_stat'] = false
			return stat
		end
		stat['stat'] = 'on' if(attr[3] == 1)
		stat['stat'] = 'off' if(attr[3] == 0)
		stat['error'] = false
		stat['error'] = true if(attr[1] == 0 or attr[2] != '')
		stat['alarm'] = false
		stat['err_code'] = attr[2]
		stat
	end

	##############################################
	# support methods to communiate iTM
	# these method convert array <--> communication binary data
	# dvice program does not care communication format
	# only care data format by array described in document
	##############################################
	# make request command packet
	# request point list
	def Itc.req_point_list
		[32,70000,0,0,0,0,0,0].pack('V8')
	end

	# request point attribute
	# argument is point id array
	def Itc.req_point_attribute
		[32,70002,0,0,0,0,0,0].pack('V8')
	end

	# request point status
	# argument is point id array
	def Itc.req_point_status(point_list)
		raise ArgumentError,"argument should be Array" if(point_list.class != Array)
		raise ArgumentError,'argument size is incorrect' if(point_list.size != 16)
		points = point_list.size
		([32,70004,0,0]+point_list).pack('V4C16')
	end

	# request operation of points
	# argument is command array
	# comamnd aray is [command array of a point,...]
	def Itc.req_operation(command_array)
		raise ArgumentError,"argument should be Array" if command_array.class != Array
		points = 0
		ret = ""
		size = 32
		command_array.each do |command|
			points = points+1
			raise ArgumentError, "command should be Array" if command.class != Array
			ret += command.pack('V2v4eC4')
			size += 24
		end
		[size,70006,points,0,0,0,0,0].pack('V8')+ret
	end

	# receive data handling
	# receive point list
	# return value is id array [id, ...]
	def Itc.rcv_point_list(packet)
		data = packet.unpack('V5C16')
		raise ArgumentError,"command number is wrong: #{data[1]}" if(data[1] != 70001)
		data[5..-1]
	end

	# receive point attributes
	# return value is point attribute array [[attribute],...]
	# point attribute is array [name,description,type,kind]
	def Itc.rcv_point_attribute(packet)
		header = packet.unpack('V8')
		raise ArgumentError,"command number is wrong: #{header[1]}" if(header[1] != 70003)

		start = 32
		ret = []
		1.upto 128 do
			type = []
			name = packet[start,16].encode('utf-8','utf-16le').strip
			start = start+16
			type << name
			description = packet[start,64].encode('utf-8','utf-16le').strip
			start = start+64
			type << description
			type += packet[start,4].unpack('Ss')
			start += 4
			ret << type
		end
		ret
	end

	# receive point status
	# return value is point status array
	def Itc.rcv_point_status(packet)
		header = packet.unpack('V8')
		raise ArgumentError,"command number is wrong: #{header[1]}" if(header[1] != 70005)

		points = header[7]
		start = 32
		ret = []
		1.upto points do
			# info is [size,id]
			info = packet[start..-1].unpack('Vs')
			start += 6
			if(packet[start,2].unpack('S')[0] == 0)
				info << '' 
			else
				info << packet[start,2] 
			end
			start += 2
			info += packet[start..-1].unpack('S4Ve2c4')
			start += 24
			info[8] = info[8].round(1)
			info[9] = info[9].round(1)
			ret << info
		end
		ret
	end

	# receive command response
	# return command response hash for each id
	def Itc.rcv_command_response(packet)
		header = packet.unpack('V5C16')
		raise ArgumentError,"command number is wrong: #{header[1]}" if(header[1] != 70007)
		header[5..-1]
	end
end
