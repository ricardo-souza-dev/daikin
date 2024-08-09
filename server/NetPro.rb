#coding: utf-8

require 'rmodbus'
require 'serialport'
require_relative 'Device'
require_relative 'FcuNetPro'

class NetPro < Device
	def initialize(id, data_man)
		super
		@addrs = [];
		@port = '/dev/ttyUSB0'
		@speed = 9600
		@parity = 'EVEN'
		@stopbit = 1
		@parity_val = {'EVEN'=>SerialPort::EVEN,'NONE'=>SerialPort::NONE,'ODD'=>SerialPort::ODD}
		@poling_wait = 1 # change from 0.01 for stability 30/04/2017
		@code_table = ['0','A','C','E','H','F','J','L','P','U']
		@counter = 0
		@slaves = {}
		@point_stat = {}

		@proh_rc = {}	# {addr=>{'stat'=>'proh/st_only/permit','sp'=>'proh/permit','mode'=>'proh/permit'}}
		@block_stat = {}
		@nonblock_com = {}
	end

	def key
		'np'
	end

	def device_attr
		{'address'=>@addr,'port'=>@port,'speed'=>@speed,'parity'=>@parity,'stopbit'=>@stopbit,'netpro'=>@addrs}
	end

	def set_attribute(attr)
		@addr = attr['address'] if(attr['address'] != nil)
		@port = attr['port'] if(attr['port'] != nil)
		@speed = attr['speed'] if(attr['speed'] != nil)
		@parity = attr['parity'] if(attr['parity'] != nil)
		@stopbit = attr['stopbit'] if(attr['stopbit'] != nil)
		@addrs = attr['netpro'] if(attr['netpro'] != nil)
	end

	def changed?(attr)
		return true if(@addr != attr['address'])
		return true if(@port != attr['port'])
		return true if(@speed != attr['speed'])
		return true if(@parity != attr['parity'])
		return true if(@stopbit != attr['stopbit'])
		return true if(@addrs != attr['netpro'])
		return false
	end
	
	def connect
		@thread = Thread.new do
			hist_flag = true
			loop {
				puts "Connect to #{@port} by addr:#{@addr}, speed:#{@speed}, parity:#{@parity}, stop bit:#{@stopbit}"
				contents = ['try_connect_netpro',@port,@addr,@speed,@parity,@stopbit]
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
						dev_disconnected('disconnected_netpro')
					end
				end
				sleep 10
			}
		end
	end

	def connect_slave(client)
		connection_status = {}
		@point_stat = {}
		first_time = {}

		puts "connect slave"
		contents = ['connected_netpro']
		@data_man.add_history('System',contents) if(@connected == false)

		status_check = nil
		loop do
			status_check = []
			@addrs.each do |addr|
				begin
					first_time[addr] = true if(first_time[addr] == nil)

					if(first_time[addr] == true)
						@slaves[addr] = client.with_slave(addr) #slave
						# check NetPro is ready
						next if(@slaves[addr].input_registers[0][0]&0x1 != 1)
						connection_status[addr] = true
						@point_stat[addr] = [[0,0,0],[0,0,0]]		# [input_reg,holding_rg,flag,0]
						# indoor unit connection check
						connected_point = @slaves[addr].input_registers[1][0]&0x1
						next if(connected_point == 0)	# not connected

						# get capabilities of each FCU to make points
						# new point is generated and send it to data_man at the same time
	#						puts "update point list"
						@data_man.update_point_list(make_point(addr))
						first_time[addr] = false
					end
					# communication status list
					com_err = @slaves[addr].input_registers[5][0] & 0x1
					# get point status if communication is normal
					if(com_err == 1)	# communication error
						@data_man.cos(addr,@dev_id,{'com_stat'=>false})
					else 	# normal status
						stat_reg = @slaves[addr].input_registers[stat_read_addr]
						if(updated?(@point_stat[addr][0],stat_reg) == true) 	# status is changed
							# update holding register
							@point_stat[addr][1] = make_holding_reg(stat_reg)
	#						puts "UPDATED: #{@point_stat[1]}"

							@slaves[addr].holding_registers[stat_write_addr] = @point_stat[addr][1]

							# block cos
							if(@proh_rc != nil && @proh_rc[addr] != nil && @proh_rc[addr]['stat'] == 'proh')
								if((stat_reg[0] & 1) != (@point_stat[addr][0][0] & 1))
									com = 'off'
									com = 'on' if((@point_stat[addr][0][0] & 1) == 1)
									if(@nonblock_com != nil && @nonblock_com[addr] != nil && @nonblock_com[addr]['stat'] != nil && @nonblock_com[addr]['stat'] != com)
#										puts "NON BLOCK COMMAND"
										@nonblock_com[addr].delete('stat')
									else
#										puts "CURRENT STAT #{com}: #{@block_stat[addr]}:"
										if(@block_stat[addr] != nil && @block_stat[addr]['stat'] != com)
#											puts "Blocked"
											@block_stat[addr].delete(1)
										else
#											puts "Send command #{com} to #{1}"
											@block_stat[addr] = {'stat'=>com}
											Thread.new do
												sleep 1
												send_block_command(addr,{'stat'=>com})
											end
										end
									end
								end
							end
						end
						# update stat
						@point_stat[addr][0] = stat_reg
					end
					# send cos to data_man
					@data_man.cos(addr,@dev_id,convert_to_std(stat_reg))
					# status is OK
					status_check.push(true)
					# send command in command queue
				rescue => e
					status_check.push(false)
					puts "Error: #{e}"
				end
			end
			@ready = true
			raise("Connection Error") if(status_check.include?(true) == false)
			# send command to device
			send_command(@resend_queue)
			send_command(@com_queue)
			sleep @poling_wait
		end
	end

	def updated?(current,update) 
#		puts "***** #{current} #{update}"
		# For NetPro operation mode issue
		# If the unit is stopped then operation mode will be 0xf
		# this has to be follow original operation mode
		current[1] = 0 if(current[1] == nil)
		update[1] = current[1] if(update[1]&0xf == 0xf)
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

	# get attribute of id_list and register it to attr_list
	def make_point(addr)
		point_list = {}
		flag = ''
		attr = @slaves[addr].input_registers[attr_addr]		 
		point = FcuNetPro.new(addr,@dev_id)
		point.set_dev_attr(attr)
		point_list[point.id] = point
		@point_stat[addr] = [[],[],flag,0]

		point_list
	end

	# send command to device
	def send_command(queue)
		while(queue.empty? == false)
			command = queue.pop 	# command is [id,{command}]
			id = command[0]
			com = command[1]
			puts "SEND COMMAND #{id} #{com}"
			next if(com.empty? == true)
			@nonblock_com[id] = {} if(@nonblock_com[id] == nil)
			@nonblock_com[id].update(com)
			if(com['rc_proh_stat'] != nil)
				@proh_rc[id] = {} if(@proh_rc[id] == nil)
				@proh_rc[id]['stat'] = com['rc_proh_stat']
				com.delete('rc_proh_stat')
			end
			begin
				puts "SLAVES #{id} #{@point_stat}"
				@slaves[id].holding_registers[stat_write_addr] = convert_to_holding_reg(id,com,@point_stat[id][1])
			rescue => e
				@resend_queue.push(command)
				raise e
			end
		end
	end

	def send_block_command(id,com)
			puts "SEND COMMAND #{id} #{com}"
		return if(com.empty? == true)
		begin
			@slaves[id].holding_registers[stat_write_addr] = convert_to_holding_reg(id,com,@point_stat[id][1])
		rescue => e
			@resend_queue.push(command)
			raise e
		end
	end

	# make holding register from input register
	def make_holding_reg(input_reg)
		reg = [0,0,0]
		reg[0] = (input_reg[0] & 0x7701)
		reg[1] = (input_reg[1] & 0xf)
		reg[2] = input_reg[2]
		return reg
	end

	# convert command to holding register format
	def convert_to_holding_reg(id,com,reg)
		com.each do |key,val|
			case key
			when 'stat'
				reg[0] |= 1 if(val == 'on')
				reg[0] &= 0xfffe if(val == 'off')
			when 'sp'
				reg[2] = (val.to_f*10).round
			when 'mode'
				reg[1] = 0
				reg[1] |= 0x1 if(val == 'heat')
				reg[1] |= 0x2 if(val == 'cool')
				reg[1] |= 0x3 if(val == 'auto')
				reg[1] |= 0x7 if(val == 'dry')
				# operation mode is changed even if status if off
				# update @point_stat[0][1] with mode operation command
				@point_stat[id][0][1] = reg[1] if(reg[0] & 0x1 == 0)
			when 'fanstep'
				reg[0] &= 0x0fff
				case val
				when 'L'
					reg[0] |= 0x1000
				when 'M'
					reg[0] |= 0x3000
				when 'H'
					reg[0] |= 0x5000
				end
			when 'flap'
				reg[0] &= 0xf0ff
				if(val == 'swing')
					reg[0] |= 0x700 
				else
					reg[0] |= 0x600
				end
			end
		end
		return reg
	end

	# convert status from input register to standard format
	def convert_to_std(input_reg)
		stat = {'com_stat'=>true}
		if((input_reg[0] & 1) == 1)
			stat['stat'] = 'on'
		else
			stat['stat'] = 'off'
		end
		flap = (input_reg[0] >> 8) & 0x7
		stat['flap'] = 0 if(flap < 5)
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
		case mode
		when 0
			stat['mode'] = 'fan'
			stat['actual_mode'] = 'fan'
		when 1
			stat['mode'] = 'heat' 
			stat['actual_mode'] = 'heat'
		when 2
			stat['mode'] = 'cool'
			stat['actual_mode'] = 'cool'
		when 3
			stat['mode'] = 'auto'
		when 7
			stat['mode'] = 'dry'
			stat['actual_mode'] = 'cool'
		end
#		if((input_reg[3]&0xf0) > 0)
#			stat['filter'] = true 
#		else
#			stat['filter'] = false
#		end
		stat['ch_master'] = true
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
		stat['thermo_err'] = false
		stat['temp_avail'] = true
		stat
 	end

	# make register address from id
	def attr_addr
		from = 1000
		to = 1002
		from..to
	end
	def stat_read_addr
		from = 2000
		to = 2005
		from..to
	end
	def stat_write_addr
		from = 2000
		to = 2002
		from..to
	end

	def get_error_code(reg)
		@code_table[(reg >> 4) & 0x1f]+(reg & 0xf).to_s(16).upcase
	end
end
