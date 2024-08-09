#coding: utf-8

require 'rmodbus'
require_relative 'Device'
require_relative 'FcuDta116'
require_relative 'Dta116'

class Dta116tcp < Dta116
	def initialize(id, data_man)
		super
		@ipaddr = '192.168.10.20'
		@port = 59999
		@addr = 255  # this is fixed value depend on rmodbus
		@slave = nil
		@code_table = ['0','A','C','E','H','F','J','L','P','U','9','8','7','6','5','4','3','2','1','G','K','M','N','R','T','V','W','X','Y','Z']
	end

	def key
		'hatcp'
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
			loop {
				puts "Connect to DTA116tcp(#{id}) #{@ipaddr} at port #{@port}"
				contents = ['try_connect_dtatcp',@ipaddr,@port]
				@data_man.add_history('System',contents)
				begin
					ModBus::TCPClient.connect(@ipaddr, @port) do |cl|
						puts "Connected DTA116tcp(#{id})"
						connect_slave(cl)
					end					
				rescue => e
					dev_disconnected('disconnected_dtatcp')
					puts "Error: #{e}"
					sleep(10)
				end
			}
			puts "Thread existed"
		end
	end
end
