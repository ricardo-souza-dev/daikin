#coding: utf-8

require 'rmodbus'
require 'serialport'
require_relative 'Device'
require_relative 'KRON'
require_relative 'Lovato'
require_relative 'ShPM5300'
require_relative 'SelecMfm383'
require_relative 'NeAce3e1'

# meters connects to the same modbus like up to 16
# each meter has meter type and address
class SmartMeter < Device
	def initialize(id, data_man)
		super
		@port = '/dev/ttyUSB0'
		@speed = 19200
		@parity = 'EVEN'
		@stopbit = 1
		@parity_val = {'EVEN'=>SerialPort::EVEN,'NONE'=>SerialPort::NONE,'ODD'=>SerialPort::ODD}
		@meters = {}	# {type=>addr,...}

		@poling_wait = 10 
	end

	def key
		'mb'
	end

	def device_attr
		{'port'=>@port,'speed'=>@speed,'parity'=>@parity,'stopbit'=>@stopbit,'meters'=>@meters}
	end

	def set_attribute(attr)
		@port = attr['port'] if(attr['port'] != nil)
		@speed = attr['speed'] if(attr['speed'] != nil)
		@parity = attr['parity'] if(attr['parity'] != nil)
		@stopbit = attr['stopbit'] if(attr['stopbit'] != nil)
		@meters = attr['meters'] if(attr['meters'] != nil)
	end

	def changed?(attr)
		return true if(@port != attr['port'])
		return true if(@speed != attr['speed'])
		return true if(@parity != attr['parity'])
		return true if(@stopbit != attr['stopbit'])
		return true if(@meters != attr['meter'])
		return false
	end
	
	def connect
		@thread = Thread.new do
			hist_flag = true
			loop {
				puts "Connect to #{@port}, speed:#{@speed}, parity:#{@parity}, stop bit:#{@stopbit}"
				contents = ['try_connect_mbmtr',@port,@speed,@parity,@stopbit]
				@data_man.add_history('System',contents) if(hist_flag)
				hist_flag = false
				begin
					ModBus::RTUClient.connect(@port, @speed, {:data_bits => 8, :stop_bits => @stopbit, :parity => @parity_val[@parity], :read_timeout => 1000}) do |cl| # read timeout change from 100 for stability 30/04/2017
						hist_flag = true
						connect_slave(cl)
					end					
				rescue => e
					puts "Error: #{e}"
				end
				sleep 5
			}
		end
	end

	def connect_slave(client)
		point_list = {}
		new_points = {}
		connection_status = {}
		@meters.each do |addr,type|
			addr = addr.to_i
			pid = ManagementPoint.get_id(addr,@dev_id)
			# if management point is not exist add management point with pid
			if(@data_man.point_list[pid] == nil)
				new_points[pid] = make_new_point(addr,type) 
				point_list[pid] = new_points[pid] 
			else
				point_list[pid] = @data_man.point_list[pid]
			end
			connection_status[pid] = true
		end
		@data_man.update_point_list(new_points)

		loop do
			point_list.each do |pid,point|
				addr = point.pid
				begin
					client.with_slave(addr) do |slave|
						data = point.read_data(slave)
						# set new value to the management point
						@data_man.cos(addr,@dev_id,data)
					end
					connection_status[pid] = true
				rescue
					connection_status[pid] = false
					dev_disconnected('disconnected_mbmtr',addr)
				end
			end
			reconnect = true
			connection_status.each do |pid,flag|
				if(flag == true)
					reconnect = false
					break
				end
			end
			raise "Modbus connection error" if(reconnect == true)
			sleep @poling_wait
		end
	end

	def dev_disconnected(dev,addr)
		@data_man.add_history('System',[dev,addr])
		@data_man.cos(addr,@dev_id,{'com_stat'=>false})
	end

	def make_new_point(addr,type)
		point = Module.const_get(type).new(addr,@dev_id)
	end
end
