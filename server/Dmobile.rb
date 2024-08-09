#coding: utf-8

require 'rmodbus'
require_relative 'Device'
require_relative 'FcuDmobile'

class Dmobile < Device
	def initialize(id, data_man)
		super
		@ipaddr = '192.168.10.20'
		@addr = 1
		@port = 502
		@slave = nil
		@poling_wait = 1 # change from 0.01 for stability 30/04/2017
		@code_table = ['0','A','C','E','H','F','J','L','P','U','M','6','8','9']
		@code_table2 = ['0','1','2','3','4','5','6','7','8','9','A','H','C','J','E','F']
		@counter = 0

		@point = nil
		@old_stat = nil
	end

	def key
		'dm'
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
			hist_flag = true
			loop {
				puts "Connect to D-Mobile(#{id}) #{@ipaddr} at port #{@port}"
				contents = ['try_connect_dm',@ipaddr,@port]
				@data_man.add_history('System',contents) if(hist_flag)
				hist_flag = false
				begin
					ModBus::TCPClient.connect(@ipaddr, @port) do |cl|
						puts "Connected D-Mobile(#{id})"
						hist_flag = true
						connect_slave(cl)
					end					
				rescue => e
					dev_disconnected('disconnected_dm') if(hist_flag)
					puts "Error: #{e}"
					sleep(10)
				end
			}
			puts "Thread existed"
		end
	end

	def connect_slave(client)
		client.with_slave(@addr) do |slave|
			puts "connect D-mobile adaptor"
			contents = ['connected_dm']
			@data_man.add_history('System',contents)
			@slave = slave
			# wait until DTA16 is ready
			wait_for_ready
			@counter =0
			pid = 1
			@point = make_point(pid)
			# update point list			
			@data_man.update_point_list({@point.id=>@point})
			@old_stat = nil
			loop {
				# get indoor unit status
				stat_reg = @slave.input_registers[2000..2010]
				cos = make_cos(stat_reg)
				if(cos.empty? == false)
					# send cos to data_man
					@data_man.cos(pid,@dev_id,cos)
				end
				# update stat
				@old_stat = stat_reg
				# send command to device
				send_command

				@ready = true
				sleep @poling_wait
			}
		end
	end

	def dev_disconnected(dev)
		@data_man.add_history('System',[dev,@ipaddr])
		@data_man.cos(@point.pid,@dev_id,{'com_stat'=>false}) if(@point != nil)
	end

	def wait_for_ready
		# check D-Mobile status is ready or not at register 0
		loop { # wait until D-Mobile is ready
			flag = @slave.input_registers[0][0]
			break if(flag&0x1 != 0)
			sleep 10
		}
	end

	# get attribute of id_list and register it to attr_list
	def make_point(pid)
		# point id is fixed to 1 because only 1 unit is connected
		attr = @slave.input_registers[1000..1006]
		sp_range = @slave.input_registers[1100..1101]		 
		point = FcuDmobile.new(pid,@dev_id)
		point.set_dev_attr(attr+sp_range)	# [1000,1001,1002,1003,1004,1005,1006,1100,1101]
		return point
	end

	# make cos from status change
	def make_cos(reg)
		cos = {}
		# on/off
		cos['stat'] = status(reg[0]&0x1) 
		# mode
		cos['mode'] = operation_mode((reg[0]>>8)&0xf) 
		cos['ch_master'] = true
		cos['actual_mode'] = cos['mode']
		cos['actual_mode'] = 'cool' if(cos['actual_mode'] == 'auto' || cos['actual_mode'] == 'dry')
		# setpoint
		cos['sp'] = reg[1]/10.0 if(reg[1] != 0x7FFE)
		# humidity
		cos['hum_sp'] = reg[2]&0xff
		# fan step
		cos['fanstep'] = fanstep(reg[3]&0xf)
		# flap
		cos['flap'] = flap(reg[4]&0x1)
		# flap2
		cos['flap2'] = flap((reg[4]>>1)&0x1)
		# room temperature
		cos['temp'] = reg[5]/10.0
		# outdoor temperature
		cos['out_temp'] = reg[6]/10.0
		# error
		if(reg[7]&0x1 != 0) # error happen
			cos['error'] = true
			cos['err_code'] = error_code(reg[7]>>8)
		elsif(reg[7]&0x2 != 0) # mode confrict happen
			cos['error'] = true
			cos['err_code'] = 'mode_confrict'
		else	# error clear
			cos['error'] = false
		end
		# Powerful mode
		cos['powerful'] = (reg[8]&0x2 != 0)
		# other mode is not supported
		# kW not support yet
		# demand not support yet
		cos['com_stat'] = true if(cos.empty? == false)

		return cos
	end

	def status(val)
		stat = ['off','on']
		return stat[val]
	end

	def operation_mode(val)
		mode = ['','auto','cool','heat','fan','dry','humid','temp']
		return mode[val]
	end

	def fanstep(val)
		step = ['auto','L','LM','M','MH','H','quiet']
		return step[0] if(val == 0xa)
		return step[6] if(val == 0xb)
		return step[val]
	end

	def flap(val)
		return 'swing' if(val == 1)
		return 0
	end

	def error_code(val)
		# change number to error code
		return @code_table[(val>>4)-2]+@code_table2[val&0xf]
	end

	# send command to device
	def send_command
		stat = @old_stat.dup
		send_flag = false
		queues = [@resend_queue,@com_queue]
		queues.each do |queue|
			while(queue.empty? == false)
				command = queue.pop 	# command is [id,{command}]
				id = command[0]
				com = command[1]
				next if(com.empty? == true)
				send_flag = true
				begin
					make_holding_register(stat,com)
				rescue => e
					@resend_queue.push(command)
					raise e
				end
			end
		end
		if(send_flag == true)
			puts "COMMAND SEND #{stat}"
			begin
				if(stat[1] != 0x7FFE)	# setpoint is normal
					@slave.holding_registers[2000..2001] = stat[0..1]
					@slave.holding_registers[2003..2004] = stat[3..4]
				else # setpoint is invalid value
					@slave.holding_registers[2000] = stat[0]
					@slave.holding_registers[2003..2004] = stat[3..4]
					mode = (stat[0]>>8)&0xf
					point = @data_man.point_list[ManagementPoint.get_id(1,@dev_id)]
					case mode
					when 1	# auto
						stat[1] = (point.csp*10).to_i if(point.actual_mode == 'cool')
						stat[1] = (point.hsp*10).to_i if(point.actual_mode == 'heat')
					when 2 	# cool
						stat[1] = (point.csp*10).to_i
					when 3	# heat
						stat[1] = (point.hsp*10).to_i
					end
					@slave.holding_registers[2001] = stat[1] if(stat[1] != 0x7FFE)
				end
				@slave.holding_registers[2008] = stat[8] if(@point.check_mode_cap)
				@slave.holding_registers[2010] = stat[10] if(@point.check_demand_cap)
			rescue => e
				puts "Write Holding register error: #{e}"
			end
		end
	end

	def make_holding_register(stat, com_list)
		check_op_mode(stat)
		com_list.each do |com,val|
			case com
			when 'stat'
				stat[0] |= 0x1 if(val == 'on')
				stat[0] &= 0xfffe if(val == 'off')
			when 'mode'
				map = ['','auto','cool','heat','fan','dry','humid','temp']
				code = map.index(val)
				if(code > 0 && code <= 7)
					stat[0] &= 0xf0ff
					stat[0] |= ((code<<8)&0x0f00)
				end
			when 'sp'
				stat[1] = (val*10).to_i
			when 'hum_sp'
				stat[2] &= 0xff00
				stat[2] |= (val&0xff)
			when 'fanstep'
				map = {'L'=>1,'LM'=>2,'M'=>3,'MH'=>4,'H'=>5,'auto'=>0xA,'quiet'=>0xB}
				code = map[val]
				if(code != nil)
					stat[3] &= 0xfff0
					stat[3] |= (code&0xf)
				end
			when 'flap'
				stat[4] &= 0xfffe
				stat[4] |= 1 if(val == 'swing')
			when 'flap2'
				stat[4] &= 0xfffd
				stat[4] |= 0x2 if(val == 'swing')
			when 'powerful'
				stat[8] &= 0xfffd
				stat[8] |= 0x2 if(val == true)
			end
		end
	end

	def check_op_mode(stat)
		return if(@point == nil)
		if((stat[0]>>8)&0xf == 1)	# auto mode is selected
			return if(@point.auto_enable?)
			# mode has to be changed because auto is not supported
			stat[0] &= 0xf0ff
			case @point.actual_mode
			when 'cool'
				stat[0] |= 0x0200
			when 'heat'
				stat[0] |= 0x0300
			when 'fan'
				stat[0] |= 0x0400
			end
		end
	end
end
