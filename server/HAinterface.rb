require 'rmodbus'

class HAinterface
	def initialize(port)
		puts "waiting at #{port}"
		@server = ModBus::TCPServer.new port, 255, {:host => "0.0.0.0"} # UID is fixed to 255 depend on rmodbus
		@server.input_registers = [0] * 2384
		@server.holding_registers = [0] * 2192
		@comm_on = []	# store id and value array
		@comm_off = []
		@comm_sp = {}
		@code_table = ['0','A','C','E','H','F','J','L','P','U','9','8','7','6','5','4','3','2','1','G','K','M','N','R','T','V','W','X','Y','Z']

#		@server.debug = true
	end

	def init_ready
		@server.input_registers[0] = 1
		@server.input_registers[1] = 0xffff	# 16 indoor units are connected 1-00 to 1-15
		1000.step 1045, 3 do |r|
			@server.input_registers[r] = (cap_hp + cap_fanstep3)
			@server.input_registers[r+1] = 0x1020		#16 to 32
			@server.input_registers[r+2] = 0x1020		#16 to 32
		end
		@server.input_registers[1003] = (cap_hp + cap_fanstep2)
		@server.input_registers[1006] = (cap_hp + cap_fanstep5 + cap_swing)

		1.upto 16 do |id|
			off(id)
			set_fanstep id, 1
			set_mode id, 2
			set_point id, 22
			set_room_temp id, 21.4
			enable_temp id
			cool_heat_master id,0

			# set holding registers
			@server.holding_registers[2000+(id-1)*3] = 0x1000
			@server.holding_registers[2001+(id-1)*3] = 0x202
			@server.holding_registers[2002+(id-1)*3] = 220
		end
		cool_heat_master 1, 1
		cool_heat_master 8, 1
	end

	def update
		loop {
#			print "#{@server.holding_registers[2000].to_s(16)}: #{@server.input_registers[2000].to_s(16)} "
			1.upto 16 do |id|
				if @server.holding_registers[2000+(id-1)*3] & 0b1 > 0
					#puts "#{id},#{@comm_off},#{@comm_on}"
					on id unless @comm_off.include? id
					@comm_on.delete id if @comm_on.include? id
				else 
					off id unless @comm_on.include? id
					@comm_off.delete id if @comm_off.include? id
				end
				if (@server.holding_registers[2000+(id-1)*3] >> 4 & 0xf) == 6
					flap = (@server.holding_registers[2000+(id-1)*3] >> 8) & 0x7
					step = @server.holding_registers[2000+(id-1)*3] >> 12 
					set_fanstep id, step
					set_flap id, flap
				end
				mode = @server.holding_registers[2001+(id-1)*3] & 0xf
				set_mode id, mode
				if (@server.holding_registers[2001+(id-1)*3] & 0xf0) > 0
					clear_filter_sign id
				end
				sp = @server.holding_registers[2002+(id-1)*3]/10.0
				if @comm_sp[id] == sp
					@comm_sp.delete id
				elsif @comm_sp[id] == nil
					set_point id, sp
				end				 
			end			
#			puts "--> #{@server.input_registers[2000].to_s(16)} "
			sleep 1
		}
	end

	def start
		@server.start
		Thread.new {
			update
		}
		loop {
			print "> "
			com = gets.strip.split(/\s* \s*/)
			case com[0]
			when 'show'
				reg = com[1].to_i
				puts (@server.holding_registers[reg]).to_s(2)
			when 'shows'
				reg = com[1].to_i
				puts (@server.input_registers[reg]).to_s(2)
			when 'input'
				reg = com[1].to_i
				val = com[2].to_i
				@server.input_registers[reg] = val
			when 'quit'
				break
			when 'on'
				id = com[1].to_i
				@comm_on << id
				on id
			when 'off'
				id = com[1].to_i
				@comm_off << id
				off id
			when 'sp'
				id = com[1].to_i
				sp = com[2].to_f
				@comm_sp[id] = sp
				set_point id, sp
			when 'temp'
				id = com[1].to_i
				temp = com[2].to_f
				set_room_temp id, temp
			when 'error'
				id = com[1].to_i
				code = com[2]
				error_occur id, code
			when 'clerror'
				id = com[1].to_i
				error_clear id
			when 'mode'
				id = com[1].to_i
				mode = com[2].to_i
				set_mode(id,mode)
			when 'comm_err'
				comm_err
			when 'comm_normal'
				comm_normal
			when 'filter'
				id = com[1].to_i
				set_filter_sign(id)
			end
		}
	end

# monitor mask
# capability
# fan exist 0b1
# cool exist 0b10
# heat exist 0b100
# auto exist 0b1000
# dry exist 0b10000
# swing exist 0b111100000000
# fan steps 2 0b1010000000000000
# fan steps 3 0b1011000000000000
# fan steps 5 0b1101000000000000
# setpoint limit 0x1020

	def cap_hp
		0b10111
	end

	def cap_co
		0b10011
	end

	def cap_hr
		0b11111
	end

	def cap_swing
		0b111100000000
	end

	def cap_fanstep2
		0b1010000000000000
	end

	def cap_fanstep3
		0b1011000000000000
	end

	def cap_fanstep5
		0b1101000000000000
	end


# status mask
# 2000, 2006,..., 2378
# on/off 0b1
# forced off 0b100
# flap >>8 & 0b111
# fan step >>12 & 0b111
#2001, 2007,..., 2379
# mode 0b1111
# filter sign 0b11110000
# actual mode >>8 & 0b1111
# cool/heat selector >>14 & 0b11
# 2002, 2008,..., 2380
# setpoint read as decimal
# 2003, 2009,..., 2381
# error code 0xff
# error status 0b1000000000
# alarm status 0b10000000000
# warning status 0b100000000000
# error unit >>12 & 0b1111
# 2004, 2010,..., 2382
# room temp read as decimal
# 2005, 2011,...2383
# temp sensor error 0b100000000
# temp data enable 0b1000000000000000


# control
# 2000, 2003,..., 2189
# on/off 0b1
# flap 0 0x060
# flap 1 0x160
# flap 2 0x260
# flap 3 0x360
# flap 4 0x460
# flap stop 0x660
# swing 0x760
# fan step 1 0x1060
# fan step 2 0x2060
# fan step 3 0x3060
# fan step 4 0x4060
# fan step 5 0x5060
# 2001, 2004,..., 2190
# fan 0
# heat 0x1
# cool 0x2
# auto 0x3
# temp 0x6
# dry  0x7
# filter reset 0xf0
# 2002, 2005,..., 2191
# setpoint write in decimal

	def on(id)
		reg = 2000+(id-1)*6
		@server.input_registers[reg] = @server.input_registers[reg] | 0b1
	end

	def off(id)
		reg = 2000+(id-1)*6
		@server.input_registers[reg] = @server.input_registers[reg] & 0xfffe
	end		

	def forced_off(id)
		reg = 2000+(id-1)*6
		@server.input_registers[reg] = @server.input_registers[reg] | 0b100
	end		

	def clear_forced_off(id)
		reg = 2000+(id-1)*6
		@server.input_registers[reg] = @server.input_registers[reg] & 0xfffb
	end		

	def set_flap(id, dir)
		reg = 2000+(id-1)*6
		dir = dir << 8
		@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0ff) | dir
	end		

	def set_fanstep(id, step)
		reg = 2000+(id-1)*6
		step = step << 12
		@server.input_registers[reg] = (@server.input_registers[reg] & 0x0fff) | step
	end		

	def set_mode(id, mode)
		reg = 2001+(id-1)*6
		if id == 1 or id == 8
			if mode == 1
				mode = mode+0x100
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | mode
				if id == 1 then	2.upto 7 do |i| set_mode i,mode; end;
				else 9.upto 16 do |i| set_mode i,mode; end;
				end
			elsif mode == 2 || mode == 7
				mode = mode+0x200
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | mode
				if id == 1 then	2.upto 7 do |i| set_mode i,2; end;
				else 9.upto 16 do |i| set_mode i,2; end;
				end
			elsif mode == 3
				mode = mode+0x200 	# in auto mode, select cooling
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | mode
			else
				mode = 0
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | mode
				if id == 1 then	2.upto 7 do |i| set_mode i,mode; end;
				else 9.upto 16 do |i| set_mode i,mode; end;
				end
			end
		elsif id < 8
			if mode == 0
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | mode
			elsif mode == 6 or mode == 1 or mode == 2
				mode = @server.input_registers[2001] & 0xf0f
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | mode
			elsif mode == 7 and ((@server.input_registers[2001] >> 8) & 0xf) == 2
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | 0x207
			end
		else
			if mode == 0
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | mode
			elsif mode == 6 or mode == 1 or mode == 2
				mode = @server.input_registers[2043] & 0xf0f
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | mode
			elsif mode == 7 and ((@server.input_registers[2043] >> 8) & 0xf) == 2
				@server.input_registers[reg] = (@server.input_registers[reg] & 0xf0f0) | 0x207
			end
		end
	end		

	def cool_heat_master(id, ms)
		reg = 2001+(id-1)*6
		mode = 0xc000 
		mode = 0x8000 if ms == 1 
		@server.input_registers[reg] = (@server.input_registers[reg] & 0x0fff) | mode
	end

	def set_filter_sign(id)
		reg = 2001+(id-1)*6
		@server.input_registers[reg] = @server.input_registers[reg] | 0x10
	end		

	def clear_filter_sign(id)
		reg = 2001+(id-1)*6
		@server.input_registers[reg] = @server.input_registers[reg] & 0xff0f
	end

	def set_point(id, val)
		reg = 2002+(id-1)*6
		val = val*10
		@server.input_registers[reg] = val
	end		

	def set_error(id)
		reg = 2003+(id-1)*6
		@server.input_registers[reg] = 0x22a
	end		

	def set_room_temp(id, val)
		reg = 2004+(id-1)*6
		val = (val*10).to_i
		@server.input_registers[reg] = val
	end		

	def enable_temp(id)
		reg = 2005+(id-1)*6
		@server.input_registers[reg] = 0x8000
	end		

	def desable_temp(id)
		reg = 2005+(id-1)*6
		@server.input_registers[reg] = 0x0000
	end		

	def error_occur(id, code)
		reg = 2003+(id-1)*6
		c1 = code[1].hex
		c2 = @code_table.index code[0]
		@server.input_registers[reg] = (0x200 | (c2 << 4) | c1)
	end

	def error_clear(id)
		reg = 2003+(id-1)*6
		@server.input_registers[reg] = 0
	end

	def comm_err
		@server.input_registers[5] = 0x1
	end

	def comm_normal
		@server.input_registers[5] = 0
	end
end

#print "Type port number: "
#port = gets.to_i
#puts "Start with port #{port}"
port = 59999
ha = HAinterface.new port
ha.init_ready
ha.start

