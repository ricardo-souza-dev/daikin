#coding: utf-8

require 'rmodbus'
require 'serialport'
require_relative 'Device'
require_relative 'FcuDta116'

class Dta116 < Device
	def initialize(id, data_man)
		super
		@addr = 1
		@port = '/dev/ttyUSB0'
		@speed = 19200
		@parity = 'EVEN'
		@stopbit = 1
		@parity_val = {'EVEN'=>SerialPort::EVEN,'NONE'=>SerialPort::NONE,'ODD'=>SerialPort::ODD}
		@slave = nil
		@timeout = false
		@poling_wait = 0.05
		@silent_interval = 0.03
		@code_table = ['0','A','C','E','H','F','J','L','P','U','9','8','7','6','5','4','3','2','1','G','K','M','N','R','T','V','W','X','Y','Z']
		@code_table2 = ['0','1','2','3','4','5','6','7','8','9','A','H','C','J','E','F']
		@counter = 0

		@proh_rc = {}	# {id=>{'stat'=>'proh/st_only/permit','sp'=>'proh/permit','mode'=>'proh/permit'}}
		@block_stat = {}
		@nonblock_com = {}
	end

	def key
		'ha'
	end

	def device_attr
		{'address'=>@addr,'port'=>@port,'speed'=>@speed,'parity'=>@parity,'stopbit'=>@stopbit}
	end

	def set_attribute(attr)
		@addr = attr['address'] if(attr['address'] != nil)
		@port = attr['port'] if(attr['port'] != nil)
		@speed = attr['speed'] if(attr['speed'] != nil)
		@parity = attr['parity'] if(attr['parity'] != nil)
		@stopbit = attr['stopbit'] if(attr['stopbit'] != nil)
	end

	def changed?(attr)
		return true if(@addr != attr['address'])
		return true if(@port != attr['port'])
		return true if(@speed != attr['speed'])
		return true if(@parity != attr['parity'])
		return true if(@stopbit != attr['stopbit'])
		return false
	end

	def connect
		@thread = Thread.new do
			hist_flag = true
			loop {
				puts "Connect to #{@port} by addr:#{@addr}, speed:#{@speed}, parity:#{@parity}, stop bit:#{@stopbit}"
				contents = ['try_connect_dta',@port,@addr,@speed,@parity,@stopbit]
				@data_man.add_history('System',contents) if(hist_flag)
				hist_flag = false
				begin
					ModBus::RTUClient.connect(@port, @speed, {:data_bits => 8, :stop_bits => @stopbit, :parity => @parity_val[@parity], :read_timeout => 1000}) do |cl| # read timeout change from 100 for stability 30/04/2017
						hist_flag = true
						connect_slave(cl)
					end
				rescue => e
					# dev_disconnected('disconnected_dta')	# remove this line for stealth re-connection 30/04/2017
					puts "Error: #{e}"
					@counter += 1
					if(@counter == 10) # communication error
						dev_disconnected('disconnected_dta')
					end
				end
				sleep 1
			}
		end
	end

	def connect_slave(client)
		client.with_slave(@addr) do |slave|
			puts "connect slave"
			puts @addr
			contents = ['connected_dta']
			@data_man.add_history('System',contents) if(@connected == false)
			@connected =true
			@slave = slave
			connected_reg = [0,0,0,0]
			# wait until DTA16 is ready
			wait_for_ready
			sleep @silent_interval
			@slave.holding_registers[2] = 5
			@counter =0
			@point_list = {}		# {id=>[input_reg,holding_rg],...}
			loop {
				# connected point id list
				sleep @silent_interval	# silent interval time
				connected_list = @slave.input_registers[1..4]
#				puts "CONNECTED #{connected_list}"
				# get newly connected is list
				# connected_reg is updated
				additional = new_connected(connected_reg,connected_list)
#				puts "ADDITIONAL #{additional}"
				if(additional != [0,0,0,0])	# something new point is connected
					# get capabilities of each FCU to make points
					# new point is generated and send it to data_man at the same time
#					puts "update point list"
					@data_man.update_point_list(make_point_list(additional))
				end
#				puts "check communication error"
				# communication status list
				sleep @silent_interval	# silent interval time
				com_err_list = bitmap_to_array(@slave.input_registers[5..8])
#				puts "POINTLIST #{@point_list}"
#				print "#{@slave.holding_registers[2000]} --> "
				@point_list.each do |id,stat|
					update_registers(id,stat,com_err_list)
				end
#				puts "#{@slave.holding_registers[2000]}"
				# send command to device
				send_command(@resend_queue)
				send_command(@com_queue)

				@ready = true
				sleep @poling_wait
			}
		end
	end

	def update_registers(id,stat,com_err_list)
		# get point status if communication is normal
		if(com_err_list.include?(id) == true)	# communication error
			@data_man.cos(id,@dev_id,{'com_stat'=>false})
		else 	# normal status
			sleep @silent_interval	# silent interval time
			stat_reg = @slave.input_registers[stat_read_addr(id)]
			# check auto mode
			# if no auto cap but stat is auto then change mode depend on actual mode
			pid = ManagementPoint.get_id(id,@dev_id)
			if((stat_reg[1] & 0x000f) == 3 && @data_man.point_list[pid].auto_cap? == false)
				# set actual mode to mode
				stat_reg[1] = (stat_reg[1] | 0xfff0) | ((stat_reg[1] >> 8) & 0x000f)
			end

			if(stat[4] != 0 && stat[4]+60 < Time.now)
				@timeout = true
				stat[4] = 0
			end
			if(updated?(stat[0],stat_reg) == true || @timeout == true) 	# status is changed
				# update holding register
				stat[1] = make_holding_reg(stat_reg)
#				puts "UPDATED: #{stat[1]}"
				if(stat[3] != nil && stat[3] != 0)	# fan command sent
					if(stat[3] != stat_reg[0]&0xff00 && @timeout == false) # fan status is not updated yet
						stat[1][0] &= 0x00ff
						stat[1][0] |= stat[3]
					else # command response received
						stat[3] = 0
						stat[4] = 0
						@timeout = false
					end
				end
				if(stat[2] == 'VAM')
					sleep @silent_interval	# silent interval time
					@slave.holding_registers[stat_write_addr(id).begin] = stat[1][0]
				elsif((stat_reg[1] && 0xc000) == 0) # cool/heat master is not set
					sleep @silent_interval	# silent interval time
					@slave.holding_registers[stat_write_addr(id).begin] = stat[1][0]
					sleep @silent_interval	# silent interval time
					@slave.holding_registers[stat_write_addr(id).last] = stat[1][2]
				else
#					puts "SET HOLDING REG: #{id}"
					begin
						sleep @silent_interval	# silent interval time
						@slave.holding_registers[stat_write_addr(id)] = stat[1]
					rescue => e
						puts "Error to write: #{e}"
					end
#								print "#{stat[1]} --> " if(id == 1)
				end
				# block cos
				if(@proh_rc != nil && @proh_rc[id] != nil && @proh_rc[id]['stat'] == 'proh')
					if((stat_reg[0] & 1) != (stat[0][0] & 1))
						com = 'off'
						com = 'on' if((stat[0][0] & 1) == 1)
						if(@nonblock_com != nil && @nonblock_com[id] != nil && @nonblock_com[id]['stat'] != nil && @nonblock_com[id]['stat'] != com)
#							puts "NON BLOCK COMMAND"
							@nonblock_com[id].delete('stat')
						else
#							puts "CURRENT STAT #{com}: #{@block_stat[id]}:"
							if(@block_stat[id] != nil && @block_stat[id]['stat'] != com)
#								puts "Blocked"
								@block_stat.delete(id)
							else
#								puts "Send command #{com} to #{id}"
								@block_stat[id] = {'stat'=>com}
								Thread.new do
									sleep 1
									@resend_queue.push([id,{'stat'=>com}])
								end
							end
						end
					end
				end
				# update stat
				stat[0] = stat_reg
			end
			# send cos to data_man
			@data_man.cos(id,@dev_id,convert_to_std(stat_reg))
			# send command in command queue
		end
		send_one_command
	end

	def updated?(current,update)
		return true if(current == nil)
		return true if(current[0..2] != update[0..2])
		return false
	end

	def dev_disconnected(dev)
		@data_man.add_history('System',[dev,@addr]) if(@connected)
		@connected = false
		@point_list.each_key do |id|
			@data_man.cos(id,@dev_id,{'com_stat'=>false})
		end
	end

	def wait_for_ready
		# check HA interface status ready or not at register 0
		loop { # wait until HA interface is ready
			break if(@slave.input_registers[0][0]&0x1 == 1)
			sleep 10
		}
	end

	# old_reg is updated by new_reg information
	# return additional connected point infomation
	def new_connected(old_reg,new_reg)
		ret = []
		0.upto 3 do |i|
			marge = old_reg[i]|new_reg[i]
			ret[i] = marge^old_reg[i]
			old_reg[i] = marge
		end
		ret
	end

	# get attribute of id_list and register it to attr_list
	def make_point_list(reg)
		point_list = {}
		id_list = bitmap_to_array(reg)
		id_list.each do |id|
			flag = ''
			sleep @silent_interval	# silent interval time
			attr = @slave.input_registers[attr_addr(id)]
			(attr[0] = 0; flag = 'VAM') if((attr[0] & 0x1f) == 0)	# this is VAM or unknown equipment
			point = FcuDta116.new(id,@dev_id)
			point.set_dev_attr(attr)
			point_list[point.id] = point
			@point_list[id] = [[],[],flag,0,0]
		end
		point_list
	end

	# send command to device
	def send_command(queue)
		while(queue.empty? == false)
			command = queue.pop 	# command is [id,{command}]
			command_send(command)
		end
	end

	def send_one_command
		if(@resend_queue.empty? == false)
			command = @resend_queue.pop 	# command is [id,{command}]
		elsif(@com_queue.empty? == false)
			command = @com_queue.pop
		else
			return
		end
		command_send(command)
	end

	def command_send(command)
		id = command[0]
		com = command[1]
#		puts "SEND COMMAND #{id} #{com}" if(com.empty? == false)
		return if(com.empty? == true)
		@nonblock_com[id] = {} if(@nonblock_com[id] == nil)
		@nonblock_com[id].update(com)
		if(com['rc_proh_stat'] != nil)
			@proh_rc[id] = {} if(@proh_rc[id] == nil)
			@proh_rc[id]['stat'] = com['rc_proh_stat']
			com.delete('rc_proh_stat')
		end
		begin
			if(@point_list[id][2] == 'VAM')
				sleep @silent_interval	# silent interval time
				@slave.holding_registers[stat_write_addr(id).begin],fan_attr = convert_to_holding_reg(com,@point_list[id][1])[0]
			else
				sleep @silent_interval	# silent interval time
				@slave.holding_registers[stat_write_addr(id)],fan_attr = convert_to_holding_reg(com,@point_list[id][1])
				if(fan_attr != 0)	# fan command is sent
					@point_list[id][3] = fan_attr
					@point_list[id][4] = Time.now
				end
			end
		rescue => e
			@resend_queue.push(command)
			raise e
		end
	end

	def send_block_command(id,com)
#			puts "SEND BLOCK COMMAND #{id} #{com}"
		return if(com.empty? == true)
		begin
			if(@point_list[id][2] == 'VAM')
				sleep @silent_interval	# silent interval time
				@slave.holding_registers[stat_write_addr(id).begin],fan_attr = convert_to_holding_reg(com,@point_list[id][1])[0]
			else
				sleep @silent_interval	# silent interval time
				@slave.holding_registers[stat_write_addr(id)],fan_attr = convert_to_holding_reg(com,@point_list[id][1])
				if(fan_attr != 0)	# fan command is sent
					@point_list[id][3] = fan_attr
					@point_list[id][4] = Time.now
				end
			end
		rescue => e
			command = [id,com]
			@resend_queue.push(command)
			raise e
		end
	end

	# make holding register from input register
	def make_holding_reg(input_reg)
		reg = [0,0,0]
		reg[0] = ((input_reg[0] & 0x7701) | 0x60)
		reg[1] = (input_reg[1] & 0xf0f)
		if((input_reg[1] >> 14) & 0x3 != 2)	# if this fcu is not master then mode will be 6
			mode = input_reg[1] & 0x000f
			reg[1] = (reg[1] & 0xfff0) | 0x6 if(mode == 1 or mode == 2)
		end
		reg[2] = input_reg[2]
		return reg
	end

	# convert command to holding register format
	def convert_to_holding_reg(com,reg)
		fan_attr = reg[0] & 0xff00
		com.each do |key,val|
			case key
			when 'stat'
				reg[0] |= 1 if(val == 'on')
				reg[0] &= 0xfffe if(val == 'off')
			when 'sp'
				reg[2] = (val.to_f*10).round
			when 'mode'
				reg[1] &= 0xfff0
				reg[1] |= 0x1 if(val == 'heat')
				reg[1] |= 0x2 if(val == 'cool')
				reg[1] |= 0x3 if(val == 'auto')
				reg[1] |= 0x6 if(val == 'temp')
				reg[1] |= 0x7 if(val == 'dry')
			when 'fanstep'
				fan_attr &= 0x0fff
				reg[0] &= 0x0fff
				case val
				when 'L'
					reg[0] |= 0x1000
				when 'LM'
					reg[0] |= 0x2000
				when 'M'
					reg[0] |= 0x3000
				when 'MH'
					reg[0] |= 0x4000
				when 'H'
					reg[0] |= 0x5000
				end
				fan_attr |= (reg[0] & 0xf000)
			when 'flap'
				fan_attr &= 0xf0ff
				reg[0] &= 0xf0ff
				if(val == 'swing')
					reg[0] |= 0x700
				else
					reg[0] |= (val << 8)
				end
				fan_attr |= (reg[0] & 0x0f00)
			when 'filter_clr'
				reg[1] |= 0xf0 if(val == true)
			end
		end
		return reg,fan_attr
	end

	# convert status from input register to standard format
	def convert_to_std(input_reg)
		stat = {'com_stat'=>true}
		if((input_reg[0] & 1) == 1)
			stat['stat'] = 'on'
		else
			stat['stat'] = 'off'
		end
		if((input_reg[0] & 0x4) > 0)
			stat['forced_off'] = true
		else
			stat['forced_off'] = false
		end
		flap = (input_reg[0] >> 8) & 0x7
		stat['flap'] = flap if(flap < 5)
		stat['flap'] = 'swing' if(flap == 7)
		fanstep = (input_reg[0] >> 12) & 0x7
		case fanstep
		when 1
			stat['fanstep'] = 'L'
		when 2
			stat['fanstep'] = 'LM'
		when 3
			stat['fanstep'] = 'M'
		when 4
			stat['fanstep'] = 'MH'
		when 5
			stat['fanstep'] = 'H'
		when 0
			stat['fanstep'] = 'auto'
		end
		mode = input_reg[1] & 0xf
		actual_mode = (input_reg[1] >> 8) & 0xf
		case mode
		when 0
			stat['mode'] = 'fan'
		when 1
			stat['mode'] = 'heat'
		when 2
			stat['mode'] = 'cool'
		when 3
			stat['mode'] = 'auto'
		when 7
			stat['mode'] = 'dry'
		end
		case actual_mode
		when 0
			stat['actual_mode'] = 'fan'
		when 1
			stat['actual_mode'] = 'heat'
		when 2
			stat['actual_mode'] = 'cool'
		end
		if((input_reg[1]&0xf0) > 0)
			stat['filter'] = true
		else
			stat['filter'] = false
		end
		ch_master = (input_reg[1] >> 14) & 0x3
		stat['ch_master'] = false
		stat['ch_master'] = true if(ch_master == 2)
		stat['sp'] = (input_reg[2]/10.0).round(1)
		err = (input_reg[3] >> 9) & 0x3
		stat['error'] = false
		stat['alarm'] = false
		if(err > 0)
			stat['err_code'] = get_error_code(input_reg[3])
			stat['error'] = true if(err & 1 > 0)
			stat['alarm'] = true if(err & 2 > 0)
		end
		stat['temp'] = (input_reg[4]/10.0).round(1)
		if(input_reg[5] & 0x100 > 0)
			stat['thermo_err'] = true
		else
			stat['thermo_err'] = false
		end
		stat['temp_avail'] = true
		stat['temp_avail'] = false if(input_reg[5] & 0x8000 == 0)
		stat
 	end

	# convert bitmap information of id to array
	# bitmap is [0xffff,0xffff,0xffff,0xffff]
	# array is 1 to 64
	def bitmap_to_array(bitmap)
		id_list = []
		0.upto 3 do |u|
			next if(bitmap[u] == 0)
			0.upto 15 do |l|
				if(((bitmap[u] >> l) & 1) == 1)
					id_list << (u*16+l+1)
				end
			end
		end
		id_list
	end

	# make register address from id
	def attr_addr(id)
		from = 1000+(id-1)*3
		to = 1002+(id-1)*3
		from..to
	end
	def stat_read_addr(id)
		from = 2000+(id-1)*6
		to = 2005+(id-1)*6
		from..to
	end
	def stat_write_addr(id)
		from = 2000+(id-1)*3
		to = 2002+(id-1)*3
		from..to
	end

	def get_error_code(reg)
		@code_table[(reg >> 4) & 0x1f]+@code_table2[(reg & 0xf)]
	end
end
