#coding: utf-8

require 'net/http'
require_relative 'Dmobile'
require_relative 'FcuDmobile'

class DmobileA < Dmobile
	def initialize(id, data_man)
		super
		@ipaddr = '192.168.10.20'
		@port = 80
		@oldstat
		@last_sp = 22
		@hist_flag
	end

	def key
		'dma'
	end

	def connect
		@thread = Thread.new do
			@hist_flag = true
			loop {
				puts "Connect to D-Mobile A(#{id}) #{@ipaddr} at port #{@port}"
				contents = ['try_connect_dm',@ipaddr,@port]
				@data_man.add_history('System',contents) if(@hist_flag)
				@hist_flag = false
				begin
					connect_slave
				rescue => e
					dev_disconnected('disconnected_dm') if(@hist_flag)
					puts "Error: #{e.backtrace}"
					sleep(10)
				end
			}
			puts "Thread existed"
		end
	end

	def connect_slave
		# check model info
 		uri = URI.parse("http://#{@ipaddr}/aircon/get_model_info")
 		model = get_hash(Net::HTTP.get(uri))
 		raise if(model['ret'] != 'OK')

		puts "connect D-mobile A adaptor"
		contents = ['connected_dm']
		@data_man.add_history('System',contents)
		@hist_flag = true
		
		@counter =0
		pid = 1
		@point = make_point(pid,model)

		# update point list			
		@data_man.update_point_list({@point.id=>@point})
		loop {
			# get indoor unit status
	 		uri = URI.parse("http://#{@ipaddr}/aircon/get_control_info")
	 		data = get_hash(Net::HTTP.get(uri))
	 		uri = URI.parse("http://#{@ipaddr}/aircon/get_sensor_info")
	 		data2 = get_hash(Net::HTTP.get(uri))
	 		@oldstat = data

	 		@last_sp = data['stemp'] if(data['stemp'] != nil && data['stemp'] != '--')

			cos = make_cos(data,data2)
			if(cos.empty? == false)
				# send cos to data_man
				@data_man.cos(pid,@dev_id,cos)
			end
			# send command to device
			send_command

			@ready = true
			sleep @poling_wait
		}
	end

	def get_hash(ans)
		ret = {}
		ans.split(',').each do |i|
			param = i.split('=')
			ret[param[0]] = param[1]
		end
		return ret
	end

	def dev_disconnected(dev)
		@data_man.add_history('System',[dev,@ipaddr])
		@data_man.cos(@point.pid,@dev_id,{'com_stat'=>false}) if(@point != nil)
	end

	# get attribute of id_list and register it to attr_list
	def make_point(pid,model)
		# point id is fixed to 1 because only 1 unit is connected
		point = FcuDmobile.new(pid,@dev_id)
		attr = make_attribute(model)
		point.set_dev_attr(attr)	# [1000,1001,1002,1003,1004,1005,1006,1100,1101]
		return point
	end

	def make_attribute(model)
		puts "MODEL ATTR: #{model}"
		attr = Array[0x1f,0,0,0,0,0,0,0]
		fan_cap = model['en_frate']
		flap_cap = model['en_fdir']
		flap = model['s_fdir']
		attr[3] |= 0x3 if(fan_cap != nil && fan_cap == '1')
		if(flap_cap != nil && flap_cap == '1')
			attr[4] |= 0x1 if(flap == '1')
			attr[4] |= 0x3 if(flap == '3')
		end
		attr[7] = 0x2012  # 18 to 32
		attr[8] = 0x1E0E	# 14 to 30
		return attr
	end

	# make cos from status change
	def make_cos(data,data2)
		cos = {}
		# on/off
		cos['stat'] = status(data['pow']) if(data['pow'] != nil)
		# mode
		cos['mode'] = operation_mode(data['mode']) if(data['mode'] != nil)
		cos['ch_master'] = true
		cos['actual_mode'] = actual_mode(data['mode']) if(data['mode'] != nil)
		# setpoint
		cos['sp'] = data['stemp'].to_f if(data['stemp'] != nil)
		# fan step
		cos['fanstep'] = fanstep(data['f_rate']) if(data['f_rate'] != nil)
		# flap
		cos['flap'] = flap(data['f_dir']) if(data['f_dir'] != nil)
		# flap2
		cos['flap2'] = flap2(data['f_dir']) if(data['f_dir'] != nil)
		# room temperature
		cos['temp'] = data2['htemp'].to_f if(data2['htemp'])
		# error
		if(data2['err'] != '0')
			cos['error'] = true
			cos['err_code'] = error_code(data2['err'])
		else	# error clear
			cos['error'] = false
		end
		# other mode is not supported
		# kW not support yet
		# demand not support yet
		cos['com_stat'] = true if(cos.empty? == false)

		return cos
	end

	def status(val)
		stat = ['off','on']
		return stat[val.to_i]
	end

	def operation_mode(val)
		mode = ['auto','auto','dry','cool','heat','heat','fan','auto']
		return 'cool' if(val == 'HUM' || val == 'LND')
		return mode[val.to_i]
	end

	def actual_mode(val)
		mode = ['cool','cool','cool','cool','heat','heat','fan','heat']
		return 'cool' if(val == 'HUM' || val == 'LND')
		return mode[val.to_i]
	end

	def fanstep(val)
		step = ['L','LM','M','MH','H']
		return 'auto' if(val == 'A')
		return 'quiet' if(val == 'B')
		return step[val.to_i-3]
	end

	def flap(val)
		val = val.to_i
		return 'swing' if(val == 1 || val == 3)
		return 0
	end

	def flap2(val)
		val = val.to_i
		return 'swing' if(val == 2 || val == 3)
		return 0
	end

	def error_code(val)
		val = val.to_i
		# change number to error code
		return @code_table[val>>4]+@code_table2[val&0xf]
	end

	# send command to device
	def send_command
		queues = [@resend_queue,@com_queue]
		queues.each do |queue|
			while(queue.empty? == false)
				command = queue.pop 	# command is [id,{command}]
				id = command[0]
				com = command[1]
				next if(com.empty? == true)
				puts "COMMAND: #{id} #{com}"
				command = make_command(com,@oldstat)
				puts "COMMAND: #{command}"
				begin
			 		uri = URI.parse("http://#{@ipaddr}/aircon/set_control_info#{command}")
			 		data = get_hash(Net::HTTP.get(uri))	
			 		puts "RET: #{data}"	
			 		raise if(data['ret'] != 'OK')
				rescue => e
					@resend_queue.push(command)
					raise e
				end
			end
		end
	end

	def make_command(com,stat)
		mode_array = ['auto','dry','cool','heat','heat','fan','auto']
		fan_array = {'L'=>3,'LM'=>4,'M'=>5,'MH'=>6,'H'=>7,'auto'=>'A','quiet'=>'B'}
		flap = 0
		flap = stat['f_dir'].to_i if(stat['f_dir'] != nil)
		puts "ORIGINAL FLAP: #{flap}"

		com.each do |c,val|
			case c
			when 'stat'
				stat['pow'] = 0 if(val == 'off')
				stat['pow'] = 1 if(val == 'on')
			when 'sp'
				stat['stemp'] = val 
			when 'mode'
				i = mode_array.index(val)
				stat['mode'] = i+1 if(i != nil)
			when 'fanstep'
				stat['f_rate'] = fan_array[val] if(fan_array[val] != nil)
			when 'flap'
				flap &= 0xe
				flap |= 0x1 if(val == 'swing')
				puts "FLAP: #{flap}"
			when 'flap2'
				flap &= 0xd
				flap |= 0x2 if(val == 'swing')
				puts "FLAP2: #{flap}"
			end
		end
		stat['f_dir'] = flap
		stat['stemp'] = @last_sp if(stat['stemp'] == '--')

		return "?pow=#{stat['pow']}&mode=#{stat['mode']}&stemp=#{stat['stemp']}&shum=0&f_rate=#{stat['f_rate']}&f_dir=#{stat['f_dir']}"
	end
end
