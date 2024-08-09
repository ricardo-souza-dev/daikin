#coding: utf-8

require 'rmodbus'
require_relative 'Device'
require_relative 'WagoPoints'
require_relative 'SmartPi'

class WagoIo < Device
	def initialize(id, data_man)
		# id will be added ofset
		# Power: 60000
		# DALI: 50000
		# Di: 40000
		# Do: 30000
		# Ai: 20000
		# Ao: 10000
		super
		@ofset = [10000,20000,30000,40000,50000,60000]
		@ipaddr = '127.0.0.1'
		@port = 502
		@uid = 1 
		@slave = nil
		@poling_wait = 1
		# @point_list sotres WAGO points to convert value
		# pid=>converter object
		# converter object convert WAGO analog value to %

		# registers to store current status
		@register = {'di'=>[],'do'=>[],'ai'=>[],'ao'=>[],'dali'=>{},'spi'=>{}}
		@do_regs = []
		@ao_regs = []
		@dali_regs = []
		# type of WAGO Ai module
		@analog_types = {}
		# Ai 2port 12bit
		@analog_types['ai_2_12'] = [452,465,470,454,466,473,467]
		# Ai 4port 12bit
		@analog_types['ai_4_12'] = [453,455,459,468]
		# Ai 2port 13bit -10V-10V
		@analog_types['ai_2_13_c'] = [479]
		# Ai 2port 15bit -10V-10V
#		@analog_types['ai_2_15_c'] = [461]
		# Ai 4port 12bit -10V-10V
		@analog_types['ai_4_12_c'] = [457]
		# Thermister 2port 15bit
		@analog_types['th_2_15'] = [461,469]
		# Thermister 4port 15bit
		@analog_types['th_4_15'] = [460,450]
		# Ao 2port 12bit
		@analog_types['ao_2_12'] = [552,554,550]
		# Ao 4port 12bit
		@analog_types['ao_4_12'] = [553,555,559]
		# Ao 2port 10bit
		@analog_types['ao_2_10'] = [560]
		# Ao 2port 12bit -10V-10V
		@analog_types['ao_2_12_s'] = [556]
		# Ao 4port 12bit -10V-10V
		@analog_types['ao_4_12_s'] = [557]

		# DALI
		@analog_types['dali'] = [647]
		# Power measurement
		@analog_types['power'] = [495]
	end

	def key
		'wago'
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
				puts "Connect to WAGO IO(#{id}) #{@ipaddr} at port #{@port}"
				contents = ['try_connect_wago',@ipaddr,@port]
				@data_man.add_history('System',contents) if(hist_flag)
				hist_flag = false
				begin
					ModBus::TCPClient.connect(@ipaddr, @port) do |cl|
						puts "Connected WAGO IO system(#{id})"
						hist_flag = true
						connect_slave(cl)
					end					
				rescue => e
					dev_disconnected('disconnected_wago')
					@ready = false
					puts "Error: #{e}"
					sleep(10)
				end
			}
		end
	end

	def connect_slave(client)
		client.with_slave(@uid) do |slave|
			puts "connect slave"
			contents = ['connected_wago']
			@data_man.add_history('System',contents) if(@connected == false)
			@connected = true
			@slave = slave
			terminals = [0,0,0,0]	# number of Ao,Ai,Do,Di 
			module_type = []	# module types
			@point_list = {}		# {id=>[input_reg,holding_rg],...}

			# read number of connected IOs
			terminals = @slave.read_input_registers(0x1022,4)
			module_type = @slave.read_input_registers(0x2030,65)

			# make point list from the types of IOs
			point_list,points = make_point_list(terminals,module_type)
			@data_man.update_point_list(point_list)

			num_of_do = points[0]
			num_of_di = points[1]
			num_of_ao = points[2]
			num_of_ai = points[3]
			dali_modules = points[4]
			power_modules = points[5]
			@dali_regs = Array.new(dali_modules)

			loop {
				# read status of all registeres
				# read Di and set status to point
				read_di(num_of_di)
				# read Do and set status to point
				read_do(num_of_do)
				# read Ai and set status to point
				read_ai(num_of_ai)
				# read Ao and set status to point
				read_ao(num_of_ao)
				# read DALI and set status to point
				read_dali(dali_modules)
				# read power module
				read_power(power_modules)
				# operate
				send_command

				@ready = true
				sleep @poling_wait
			}
		end
	end				

	def dev_disconnected(dev)
		@data_man.add_history('System',[dev,@uid]) if(@connected)
		@connected = false
		if(@point_list)
			@point_list.each_key do |id|
				@data_man.cos(id,@dev_id,{'com_stat'=>false})
			end
		end
	end

	# send command to device
	def send_command
		stat_out = false
		dali_out = false
		av_out = false
		return if(@com_queue.empty?)
		while(@com_queue.empty? == false)
			command = @com_queue.pop 	# command is [id,{command}]
			next if(command == nil)
			pid = command[0]
			com = command[1]
			next if(com == nil || com.empty? == true)
			# write value to holding register
			com.each do |key,val|
				case key
				when 'stat'
					write_do_stat(pid,val) 
					stat_out = true
				when 'av'
					if(pid < @ofset[4])
						converter = @point_list[pid]
						write_ao_val(pid,converter.get_val(val))
						av_out = true
					else	# DALI point
						write_dali_val(pid,val)
						dali_out = true
					end
				end
			end
		end
		write_dali if(dali_out)
		write_ao if(av_out)
		write_do if(stat_out)
	end

	# read Di status
	def read_di(num)
		return if(num == 0)
		reg = @slave.read_coils(0,num)
		1.upto num do |i|
			if(@ready == false || reg[i-1] != @register['di'][i-1])
				@data_man.cos(@ofset[3]+i,@dev_id,di_stat(reg[i-1])) 
				@register['di'][i-1] = reg[i-1]
			end
		end
	end

	# read Do status
	def read_do(num)
		return if(num == 0)
		reg = @slave.read_coils(512,num)
		@do_regs = reg.clone
		1.upto num do |i|
			if(@ready == false || reg[i-1] != @register['do'][i-1])
				@data_man.cos(@ofset[2]+i,@dev_id,di_stat(reg[i-1])) 
				@register['do'][i-1] = reg[i-1]
			end
		end
	end

	def write_do
		begin
			puts "Do #{@do_regs}"
			@slave.write_multiple_coils(0,@do_regs)
		rescue => e
			puts "Do: #{e}"
		end
	end

	def write_do_stat(pid,val)
		pid = pid-@ofset[2]-1
		stat = 0
		stat = 1 if(val == 'on')
		@do_regs[pid] = stat
		puts "Do ctrl #{pid} #{val}"
	end

	def read_ai(num)
		return if(num == 0)
		reg = @slave.read_input_registers(0,num)
		1.upto num do |i|
			pid = @ofset[1]+i
			next if(@point_list[pid] == nil) 
			nv = @point_list[pid].convert(reg[i-1])

			if(@register['ai'][i-1] == nil || nv != @register['ai'][i-1] || @data_man.point_list[ManagementPoint.get_id(pid,@dev_id)].get_status['com_stat'] == false)
				@data_man.cos(pid,@dev_id,ai_stat(nv)) 
				@register['ai'][i-1] = nv
			end
		end
	end

	def read_ao(num)
		return if(num == 0)
		reg = @slave.read_input_registers(512,num)
		@ao_regs = reg.clone
		1.upto num do |i|
			pid = @ofset[0]+i
			next if(@point_list[pid] == nil) 
			nv = @point_list[pid].convert(reg[i-1])

			if(@register['ao'][i-1] == nil || nv != @register['ao'][i-1] || @data_man.point_list[ManagementPoint.get_id(pid,@dev_id)].get_status['com_stat'] == false)
				@data_man.cos(pid,@dev_id,ai_stat(nv)) 
				@register['ao'][i-1] = nv
			end
		end
	end

	def write_ao
		begin
			puts "Ao REG: #{@ao_regs}"
			@slave.write_multiple_registers(0,@ao_regs)
		rescue => e
			puts "Ao: #{e}"
		end
	end

	def write_ao_val(pid,val)
		pid = pid-@ofset[0]-1
		@ao_regs[pid] = val
	end

	def read_dali(dali_modules)
		0.upto dali_modules-1 do |m|
			om = 32	# number of registeres for 1 DALI module(64 addresses)
			start_addr = 0x100+om*m
			dali_stat = @slave.read_input_registers(start_addr,om)
			@dali_regs[m] = dali_stat.dup
			dali_id = @ofset[4]+m*100
			1.upto om*2 do |i|
				id = dali_id+i
				# check point is exist or not
				point = @data_man.point_list[ManagementPoint.get_id(id,@dev_id)]
				next if(point == nil)
				# check current status
				val = 0
				reg = (i-1)/2
				if(i&0x1 != 0) # i is odd
					val = dali_stat[reg]&0xff 
				else	# i is even
					val = dali_stat[reg]>>8
				end
#				puts "DALI POINT: #{id}"
				stat = {}
				if(val&0x80 > 0) # error happen
#					puts "DALI ERROR #{point.id} #{val}"
					stat = {"error"=>true,'com_stat'=>true} 
				elsif(val == 101) # communication error
#					puts "DALI Communication error #{point.id} #{val}"
					stat = {'com_stat'=>false} 
				else
#					puts "DALI #{point.id} #{val}"
					stat = {"error"=>false,'com_stat'=>true,'level'=>val} 
				end
				if(@ready == false || stat != @register['dali'][id])
					@data_man.cos(id,@dev_id,stat) 
					@register['dali'][id] = stat
				end
			end
		end
#		write_dali  	# update holding register
	end

	def write_dali
		om = 32
		begin
			0.upto @dali_regs.size-1 do |m|
				start_addr = 0x300+om*m
				@slave.write_multiple_registers(start_addr,@dali_regs[m])
			end
		rescue => e
			puts "DALI error: #{e}"
		end
	end

	def read_power(power_modules)
		ofset = 46	# this has to set for multiple power module
		1.upto power_modules do |m|
			# check point is exist or not
			pid = @ofset[5]+m
			point = @data_man.point_list[ManagementPoint.get_id(pid,@dev_id)]
			next if(point == nil)
			start_addr = 0x301c+(m-1)*ofset
			power_val = @slave.read_input_registers(start_addr,2)
			meter_val = @slave.read_input_registers(start_addr+8,2)
			# power_val[0]: Total Active Power, power_val[4]: Total Active Energy
			meter = meter_val[1]<<16 | meter_val[0]
			power = power_val[1]<<16 | power_val[0]
			meter = meter/100.0/100.0
			power = power/100.0
			@data_man.cos(pid,@dev_id,{'com_stat'=>true,'meter'=>meter,'power'=>power}) 
		end
	end

	def write_dali_val(pid,val)
		id = pid-@ofset[4]
		mod = id/100
		id = id%100
		current = @dali_regs[mod][(id-1)/2]
		val = val.to_i
		if(id&0x1 != 0) # id is odd
			current = current&0xff00 | val
		else # id is even
			current = current&0xff|(val<<8)
		end
		@dali_regs[mod][(id-1)/2] = current
	end

	# get attribute of id_list and register it to attr_list
	def make_point_list(terminals,module_type)
		points = [0,0,0,0,0,0]	# Do,Di,Ao,Ai,DALI modules,power modules
		dali_modules = 0
		power_modules = 0
		point_list = {}
		# Do
		1.upto terminals[2] do |id|
			nid = @ofset[2]+id
			point = DioWago.new(nid,@dev_id)
			point_list[point.id] = point
			@point_list[nid] = true
		end
		points[0] = terminals[2]
		# Di
		1.upto terminals[3] do |id|
			nid = @ofset[3]+id
			point = DiWago.new(nid,@dev_id)
			point_list[point.id] = point
			@point_list[nid] = true
		end
		points[1] = terminals[3]

		# Ao and Ai
		# first module is communication module
		module_type.shift
		ai_id = @ofset[1]
		ao_id = @ofset[0]

		module_type.each do |type|
			next if(type & 0x8000 != 0)	# Di or Do
			break if(type == 0)
			puts "module type #{type}"
			key = find_analog_type(type)
			if(key == 'ai_2_9')
				puts "#{key}: #{type}"
				1.upto 2 do |i|
					ai_id += 1
					@point_list[ai_id] = Ai_9bit.new(ai_id)
					point = AiWago.new(ai_id,@dev_id)
					point_list[point.id] = point
					points[3] += 1
				end
			elsif(key == 'ai_2_12')
				puts "#{key}: #{type}"
				1.upto 2 do |i|
					ai_id += 1
					@point_list[ai_id] = Ai_12bit.new(ai_id)
					point = AiWago.new(ai_id,@dev_id) 
					point_list[point.id] = point
					points[3] += 1
				end
			elsif(key == 'ai_4_12')
				puts "#{key}: #{type}"
				1.upto 4 do |i|
					ai_id += 1
					@point_list[ai_id] = Ai_12bit.new(ai_id)
					point = AiWago.new(ai_id,@dev_id)
					point_list[point.id] = point
					points[3] += 1
				end
			elsif(key == 'ai_2_13_c')
				puts "#{key}: #{type}"
				1.upto 2 do |i|
					ai_id += 1
					@point_list[ai_id] = Ai_13bitC.new(ai_id)
					point = AiWago.new(ai_id,@dev_id)
					point_list[point.id] = point
					points[3] += 1
				end
			elsif(key == 'ai_2_15_c')
				puts "#{key}: #{type}"
				1.upto 2 do |i|
					ai_id += 1
					@point_list[ai_id] = Ai_15bitC.new(ai_id)
					point = AiWago.new(ai_id,@dev_id)
					point_list[point.id] = point
					points[3] += 1
				end
			elsif(key == 'ai_4_12_c')
				puts "#{key}: #{type}"
				1.upto 4 do |i|
					ai_id += 1
					@point_list[ai_id] = Ai_12bitC.new(ai_id)
					point = AiWago.new(ai_id,@dev_id)
					point_list[point.id] = point
					points[3] += 1
				end
			elsif(key == 'th_2_15')
				puts "#{key}: #{type}"
				1.upto 2 do |i|
					ai_id += 1
					@point_list[ai_id] = Ai_th.new(ai_id)
					point = Ai.new(ai_id,@dev_id)
					point_list[point.id] = point
					points[3] += 1
				end
			elsif(key == 'th_4_15')
				puts "#{key}: #{type}"
				1.upto 4 do |i|
					ai_id += 1
					@point_list[ai_id] = Ai_th.new(ai_id)
					point = Ai.new(ai_id,@dev_id)
					point_list[point.id] = point
					points[3] += 1
				end
			elsif(key == 'ao_2_10')
				puts "#{key}: #{type}"
				1.upto 2 do |i|
					ao_id += 1
					@point_list[ao_id] = Ao_10bit.new(ao_id)
					point = AoWago.new(ao_id,@dev_id)
					point_list[point.id] = point
					points[2] += 1
				end
			elsif(key == 'ao_2_12')
				puts "#{key}: #{type}"
				1.upto 2 do |i|
					ao_id += 1
					@point_list[ao_id] = Ao_12bit.new(ao_id)
					point = AoWago.new(ao_id,@dev_id)
					point_list[point.id] = point
					points[2] += 1
				end
			elsif(key == 'ao_4_12')
				puts "#{key}: #{type}"
				1.upto 4 do |i|
					ao_id += 1
					@point_list[ao_id] = Ao_12bit.new(ao_id)
					point = AoWago.new(ao_id,@dev_id)
					point_list[point.id] = point
					points[2] += 1
				end
			elsif(key == 'ao_2_12_s')
				puts "#{key}: #{type}"
				1.upto 2 do |i|
					ao_id += 1
					@point_list[ao_id] = Ao_12bitS.new(ao_id)
					point = AoWago.new(ao_id,@dev_id)
					point_list[point.id] = point
					points[2] += 1
				end
			elsif(key == 'ao_4_12_s')
				puts "#{key}: #{type}"
				1.upto 4 do |i|
					ao_id += 1
					@point_list[ao_id] = Ao_12bitS.new(ao_id)
					point = AoWago.new(ao_id,@dev_id)
					point_list[point.id] = point
					points[2] += 1
				end
			elsif(key == 'dali')
				next if(dali_modules >= 8)
				om = 32	# number of registeres for 1 DALI module(64 addresses)
				start_addr = 0x100+om*dali_modules
				dali_stat = @slave.read_input_registers(start_addr,om)
				dali_id = @ofset[4]+dali_modules*100
				1.upto om do |i|
					dali_id += 1
#					puts "DALI CONNECTION #{dali_id} #{dali_stat[i-1]&0xff}"
					if(dali_stat[i-1]&0xff != 101)
#						puts "Create DALI #{dali_id}"
						point = LevelSwWago.new(dali_id,@dev_id)
						point_list[point.id] = point
					end

					dali_id += 1
#					puts "DALI CONNECTION #{dali_id} #{dali_stat[i-1]&0xff}"
					if(dali_stat[i-1]>>8 != 101)
#						puts "Create DALI #{dali_id}"
						point = LevelSwWago.new(dali_id,@dev_id)
						point_list[point.id] = point
					end
				end
				dali_modules += 1
				points[4] = dali_modules
			elsif(key == 'power')
				power_modules += 1
				id = @ofset[5]+power_modules
				point = SmartPi.new(id,@dev_id)
				point_list[point.id] = point
				points[5] = power_modules
			end
		end
		return point_list,points
	end

	def find_analog_type(model)
		@analog_types.each do |key,list|
			return key if(list.include?(model))
		end
		return nil
	end

	def di_stat(val) # val is 0 or 1
		stat = {'com_stat'=>true}
		stat['stat'] = 'off'
		stat['stat'] = 'on' if(val == 1)
		return stat
	end

	def ai_stat(val) # val integer
		stat = {'com_stat'=>true}
		# convert val to point dimension
		stat['av'] = val
		return stat
	end

	def err_stat(err)
		stat = {}
		stat['error'] = false
		stat['error'] = true if(err == 1)
		return stat
	end

end

# converter object
class Ai_converter
	def initialize(pid)
		@pid = pid
	end

	# convert from module val to %
	def convert(val)
		return val
	end

	# convert from % to module val
	def get_val(r)
		return 0
	end
end

class Ai_12bit < Ai_converter
	def convert(val)
		val = val >> 3
		r = (val.to_f/0xfff).round(3)
		return r
	end
end

class Ai_12bitC < Ai_converter
	def convert(val)
		flag = (val & 0x8000) >> 15
		val = (val & 0x7fff) >> 3
		val += 0x1000 if(flag == 0)
		r = (val.to_f/0x1fff).round(3)
		return r
	end
end

class Ai_13bitC < Ai_converter
	def convert(val)
		flag = (val & 0x8000) >> 15
		val = (val & 0x7fff) >> 2
		val += 0x2000 if(flag == 0)
		r = (val.to_f/0x3fff).round(3)
		return r
	end
end

class Ai_15bitC < Ai_converter
	def convert(val)
		flag = (val & 0x8000) >> 15
		val = (val & 0x7fff)
		val += 0x8000 if(flag == 0)
		r = (val.to_f/0xffff).round(3)
		return r
	end
end

class Ai_th < Ai_converter
	def convert(val)
		r = val/10.0
		return r
	end
end

class Ao_12bit < Ai_converter
	def convert(val)
		val = val >> 3
		r = (val.to_f/0xfff).round(3)
		return r
	end

	def get_val(r)
		(0xfff*r).to_i << 3
	end
end

class Ao_10bit < Ai_converter
	def convert(val)
		val = val >> 5
		r = (val.to_f/0x3ff).round(3)
		return r
	end

	def get_val(r)
		(0x3ff*r).to_i << 5
	end
end

class Ao_12bitS < Ai_converter
	def convert(val)
		flag = (val & 0x8000) >> 15
		val = (val & 0x7fff) >> 3
		val += 0x1000 if(flag == 0)
		r = (val.to_f/0x1fff).round(3)
		return r
	end

	def get_val(r)
		val = 0x1fff*r
		flag = (val & 0x1000) >> 12
		val = val & 0xfff
		val = val + 0x1000 if(flag == 0)
		val << 3
		return val
	end
end

class DataManTest
	def update_point_list(point_list) 
		point_list.each_value do |point|
			puts point.point_info
		end
	end

	def add_history(type,content)
		puts "#{type} #{content}"
	end

	def cos(id,dev_id,cos)
		puts "#{id} #{dev_id} #{cos}"
	end
end


#wago = WagoIo.new(1,DataManTest.new)
#puts wago.key
#wago.connect
#gets


