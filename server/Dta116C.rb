#coding: utf-8

require_relative 'Dta116'
require_relative 'FcuDta116C'

class Dta116C < Dta116
	def initialize(id, data_man)
		super
	end

	def key
		'hac'
	end

	# get attribute of id_list and register it to attr_list
	def make_point_list(reg)
		point_list = {}
		id_list = bitmap_to_array(reg)		
		id_list.each do |id|
			flag = ''
			sleep @silent_interval
			attr = @slave.input_registers[attr_addr(id)]		 
			(attr[0] = 0; flag = 'VAM') if((attr[0] & 0x1f) == 0)	# this is VAM or unknown equipment
			point = FcuDta116C.new(id,@dev_id)
			point.set_dev_attr(attr)
			if(flag != 'VAM')
				# additional capability read
				sleep @silent_interval
				attr = @slave.input_registers[attr2_addr(id)]
				point.set_dev_attr2(attr)
			end
			point_list[point.id] = point
			@point_list[id] = [[],[],flag,0,0]	# No.4 item is fan ctrl command, No.5 item is fan2 ctrl command sent information
		end
		point_list
	end

	def update_registers(id,stat,com_err_list)
		# get point status if communication is normal
		if(com_err_list.include?(id) == true)	# communication error
			@data_man.cos(id,@dev_id,{'com_stat'=>false})
		else 	# normal status
			sleep @silent_interval
			stat_reg = @slave.input_registers[stat_read_addr(id)]	# 6 data
			stat_reg += [0] #@slave.input_registers[stat_read_addr2(id)] # 1 data
			sleep @silent_interval
			stat_reg += @slave.input_registers[stat_read_addr3(id)] # 2 data

			# check auto mode 
			# if no auto cap but stat is auto then change mode depend on actual mode
			pid = ManagementPoint.get_id(id,@dev_id)
			if((stat_reg[1] & 0x000f) == 3 && @data_man.point_list[pid].auto_cap? == false)
				# set actual mode to mode				
				stat_reg[1] = (stat_reg[1] | 0xfff0) | ((stat_reg[1] >> 8) & 0x000f)
			end

			# stat_reg size is 9
			if(updated?(stat[0],stat_reg) == true) 	# status is changed
				# update holding register
				stat[1] = make_holding_reg(stat_reg)
				if(stat[3] != nil && stat[3] != 0)	# fan command sent
					if(stat[3] != stat_reg[0]&0xff00) # fan status is not updated yet
						stat[1][0] &= 0x00ff	# keep command without fan ctrol
						stat[1][0] |= stat[3]	# set command agains
					else # command response received
						stat[3] = 0
					end
				end
				# fan2 also check command sent status
				if(stat[4] != nil && stat[4] != 0) # fan2 command sent
					if(stat[4] != stat_reg[7]&0x700) # fan2 status is not updated yet
						stat[1][7] = 0 
						stat[1][7] = stat[4] # set command again
					else	# commend response received
						stat[4] = 0
					end
				end

				if(stat[2] == 'VAM')
					sleep @silent_interval
					@slave.holding_registers[stat_write_addr(id).begin] = stat[1][0]
				else
					if(stat[1][1] & 0xf0 == 0)	# no filter sign clear
#						# skip operation mode 
						sleep @silent_interval
						@slave.holding_registers[stat_write_addr1(id)] = stat[1][0]
						sleep @silent_interval
						@slave.holding_registers[stat_write_addr12(id)] = stat[1][2]
					else	# filter sign clear included in command
						# once mode will be cool or heat
						sleep @silent_interval
						@slave.holding_registers[stat_write_addr(id)] = stat[1][0..2]
					end
					sleep @silent_interval
					@slave.holding_registers[stat_write_addr2(id)] = stat[1][3]
					sleep @silent_interval
					@slave.holding_registers[stat_write_addr3(id)] = stat[1][4..5]
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
		# [32001,32002,32003,32004,32005,32006,32804,34001,34002]
		return true if(current == nil)
		return true if(current[0..2] != update[0..2])
		return true if(current[6..8] != update[6..8])
		return false
	end

	def command_send(command)
		id = command[0]
		com = command[1]
		puts "COM:+++ #{com}"
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
				sleep @silent_interval
				@slave.holding_registers[stat_write_addr(id).begin],fan_attr,fan2_attr = convert_to_holding_reg(com,@point_list[id][1])[0]
			else 
				regs,fan_attr,fan2_attr = convert_to_holding_reg(com,@point_list[id][1])
				sleep @silent_interval
				@slave.holding_registers[stat_write_addr1(id)] = regs[0]
	#			@slave.holding_registers[stat_write_addr11(id)] = regs[1]
				sleep @silent_interval
				@slave.holding_registers[stat_write_addr12(id)] = regs[2]
	#			@slave.holding_registers[stat_write_addr2(id)] = reg[3]
				sleep @silent_interval
				@slave.holding_registers[stat_write_addr3(id)] = regs[4..5]
				@point_list[id][3] = fan_attr if(fan_attr&0xff00 != 0)	# fan command is sent
				@point_list[id][4] = fan2_attr if(fan2_attr != 0) # fan2 command is sent
			end
		rescue => e
			@resend_queue.push(command)
			raise e
		end
	end

	# make holding register from input register
	def make_holding_reg(input_reg)
		reg = [0,0,0,0,0,0]	#[42001,42002,42003,42404,44001,44002]
		reg[0] = ((input_reg[0] & 0x7f01) | 0x60)
		reg[1] = (input_reg[1] & 0xf0f)
		if((input_reg[1] >> 14) & 0x3 != 2)	# if this fcu is not master then mode will be 6
			mode = input_reg[1] & 0x000f
			reg[1] = (reg[1] & 0xfff0) | 0x6 if(mode == 1 or mode == 2)
		end
		reg[2] = input_reg[2]
		reg[3] = input_reg[6]
		reg[4] = input_reg[7]
		reg[5] = input_reg[8]
		return reg
	end

	# convert command to holding register format
	def convert_to_holding_reg(com,reg)
		fan_attr = reg[0] & 0xff00
		fan2_attr = 0
		com.each do |key,val|
			case key
			when 'stat'
				reg[0] |= 1 if(val == 'on')
				reg[0] &= 0xfffe if(val == 'off')
			when 'sp'
				reg[2] = (val.to_f*10).round
			when 'mode'
				reg[1] &= 0xfff0
				reg[5] &= 0xfff0
				(reg[1] |= 0x1; reg[5] |= 0x1) if(val == 'heat')
				(reg[1] |= 0x2; reg[5] |= 0x2) if(val == 'cool')
				(reg[1] |= 0x3; reg[5] |= 0x3) if(val == 'auto')
				(reg[1] |= 0x6; reg[5] |= 0x6) if(val == 'temp')
				(reg[1] |= 0x7; reg[5] |= 0x7) if(val == 'dry')
				reg[5] &= 0xff0f
				reg[5] &= 0xfff0 if(val == 'fan')
				reg[5] |= 0x12 if(val == 'confort')
				reg[5] |= 0x22 if(val == 'automoist')
				reg[5] |= 0x32 if(val == 'sleep')
				reg[5] |= 0x40 if(val == 'dry')
				reg[5] |= 0x51 if(val == 'pre_heat')
				puts "REG #{reg[1]} #{reg[5]}"
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
				end	# if not above command it will be auto automatically
				fan_attr |= (reg[0] & 0xf000)
			when 'flap'
				fan_attr &= 0xf0ff
				reg[0] &= 0xf0ff
				if(val == 'swing')
					reg[0] |= 0x700 
				elsif(val == 'auto')
					reg[0] |= 0x800
				else
					reg[0] |= (val << 8)
				end
				fan_attr |= (reg[0] & 0x0f00)
			when 'flap2'
				reg[4] &= 0xf8ff
				if(val == 'swing')
					reg[4] |= 0x700
				else
					reg[4] |= (val << 8)
				end
				fan2_attr = reg[4]
			when 'filter_clr'
				reg[1] |= 0xf0 if(val == true)
			when 'fvmode'
				reg[3] &= 0xff3f
				case val
				when 'auto'
					reg[3] |= 0x40
				when 'ahex'
					reg[3] |= 0x80
				when 'std'
					reg[3] |= 0xc0
				end
			when 'bvmode'
				reg[5] &= 0x3fff
				reg[5] |= 0x4000 if(val == 'L')
				reg[5] |= 0x8000 if(val == 'H')
			when 'dehum_mode'
				reg[5] &= 0xcfff
				reg[5] |= 0x1000 if(val == 'M')
				reg[5] |= 0x2000 if(val == 'H')
			end
		end
		return reg,fan_attr,fan2_attr
	end

	# convert status from input register to standard format
	def convert_to_std(input_reg)
		stat = super
		stat['flap'] = 'auto' if(((input_reg[0] >> 11) & 0x1) != 0)
		vent = (input_reg[6] >> 6) & 0x3
		case vent
		when 0
			stat['fvmode'] = 'none'
		when 1
			stat['fvmode'] = 'auto'
		when 2
			stat['fvmode'] = 'ahex'
		when 3
			stat['fvmode'] = 'std'
		end
		flap2 = (input_reg[7] >> 8) & 0x7
		stat['flap2'] = flap2 if(flap2 < 5)
		stat['flap2'] = 'swing' if(flap2 == 7)
		mode2 = (input_reg[8] >> 4) & 0x7
		case mode2
		when 0
		when 1
			stat['mode'] = 'confort'
		when 2
			stat['mode'] = 'automoist'
		when 3
			stat['mode'] = 'sleep'
		when 4
			stat['mode'] = 'dry'
		when 5
			stat['mode'] = 'pre_heat'
		end
		hum_ctrl = (input_reg[8] >> 12) & 0x3
		case hum_ctrl
		when 0
			stat['dehum_mode'] = 'L'
		when 1
			stat['dehum_mode'] = 'M'
		when 2
			stat['dehum_mode'] = 'H'
		end
		bath_vent = (input_reg[8] >> 14) & 0x3
		case bath_vent
		when 0
			stat['bvmode'] = 'stop'
		when 1
			stat['bvmode'] = 'L'
		when 2
			stat['bvmode'] = 'H'
		end
		return stat
 	end

	def attr2_addr(id)
		from = 1403+(id-1)*4
		to = 1403+(id-1)*4
		from..to
	end
	def stat_read_addr2(id)
		from = 2803+(id-1)*4
#		to = 2803+(id-1)*4
		from #..to
	end
	def stat_read_addr3(id)
		from = 4000+(id-1)*2
		to = 4001+(id-1)*2
		from..to
	end
	def stat_write_addr1(id)
		from = 2000+(id-1)*3
		from
	end
	def stat_write_addr11(id)
		from = 2001+(id-1)*3
		from
	end
	def stat_write_addr12(id)
		from = 2002+(id-1)*3
		from
	end
	def stat_write_addr2(id)
		from = 2403+(id-1)*4
#		to = 2403+(id-1)*4
		from #..to
	end
	def stat_write_addr3(id)
		from = 4000+(id-1)*2
		to = 4001+(id-1)*2
		from..to
	end

end
