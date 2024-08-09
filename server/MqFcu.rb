#coding: utf-8

require 'rmodbus'
require 'serialport'
require_relative 'Device'
require_relative 'FcuMq'

class MqFcu < Device
	def initialize(id, data_man)
		super
		@addr = 1
		@port = '/dev/ttyUSB0'
		@speed = 19200
		@parity = 'EVEN'
		@stopbit = 1
		@parity_val = {'EVEN'=>SerialPort::EVEN,'NONE'=>SerialPort::NONE,'ODD'=>SerialPort::ODD}
		@slave = nil
		@poling_wait = 1 # change from 0.01 for stability 30/04/2017
		@counter = 0

		@block_stat = {}
		@nonblock_com = {}

		@add_history = true
	end

	def key
		'mq'
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
			loop {
				puts "Connect to #{@port} by addr:#{@addr}, speed:#{@speed}, parity:#{@parity}, stop bit:#{@stopbit}"
#				contents = ['try_connect_dta',@port,@addr,@speed,@parity,@stopbit]
#				@data_man.add_history('System',contents) if(@add_history && @counter == 0)
				begin
					ModBus::RTUClient.connect(@port, @speed, {:data_bits => 8, :stop_bits => @stopbit, :parity => @parity_val[@parity], :read_timeout => 1000}) do |cl| # read timeout change from 100 for stability 30/04/2017
						connect_slave(cl)
					end					
				rescue => e
					# dev_disconnected('disconnected_dta')	# remove this line for stealth re-connection 30/04/2017
					puts "Error #{@dev_id}: #{e}"
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
			@add_history = true
			@slave = slave
			@counter =0
			@point_list = {}		# {id=>[input_reg,holding_rg],...}
			sleep 0.5
			regs = @slave.input_registers[0..2]
			point = FcuMq.new(1,@dev_id)
			@data_man.update_point_list({point.id=>point})
			loop {
				sleep @poling_wait
				# read actual speed and motor status
				regs = @slave.input_registers[4..18]
#				puts "REGS #{regs}"
				sleep 0.5
				fan_com = @slave.holding_registers[2][0]
				stat = 'off'
				stat = 'on' if(regs[3] != 0)
				fan = regs[3]|fan_com
#				puts "Stat: #{stat}, Fan: #{fan.to_s(16)}"
				# send cos to data_man
				if(@ready == false)
					@data_man.cos(1,@dev_id,{'com_stat'=>true,'stat'=>stat,'fanstep'=>fan})
				else
					@data_man.cos(1,@dev_id,{'stat'=>stat,'fanstep'=>fan})
				end
				# send command to device
				send_command(@resend_queue)
				send_command(@com_queue)

				@ready = true
			}
		end
	end

	def dev_disconnected(dev)
		@data_man.add_history('System',[dev,@addr]) if(@add_history)
		@data_man.cos(1,@dev_id,{'com_stat'=>false})
		@add_history = false
	end

	# send command to device
	def send_command(queue)
		sleep 0.5
		regs = @slave.holding_registers[0..2]
		while(queue.empty? == false)
			command = queue.pop 	# command is [id,{command}]
			id = command[0]
			com = command[1]
			puts "SEND COMMAND #{id} #{com}"
			next if(com.empty? == true)
			begin
				sleep 0.5
				vals = conv_regs(com,regs)
				@slave.holding_registers[0..2] = vals
			rescue => e
				@resend_queue.push(command)
				raise e
			end
		end
	end

	def conv_regs(com,regs)
		com.each do |key,val|
			case key
			when 'stat'
				regs[0] = 0 if(val == 'off')
				regs[0] = 1 if(val == 'on')
			when 'fanstep'
				regs[2] = val
			end
		end
		puts "COMMAND REG #{regs}"
		return regs
	end
end
