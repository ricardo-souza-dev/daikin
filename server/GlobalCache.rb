#coding: utf-8

require 'net/http'
require 'uri'
require 'json'
require_relative 'Device'
require_relative 'Ir'

class GlobalCache < Device
	def initialize(id, data_man)
		super
		@connection = false
		@ip_addr
		# load Global Cache command file
		@uri
		begin
			@command = open('GlobalCache.json') do |io|
				JSON.load(io)
			end
		rescue => e
			puts "Load Error: #{e}"
		end
	end

	def key
		'glc'
	end

	def device_attr
		{'ip_addr'=>@ip_addr}
	end

	def set_attribute(attr)
		@ip_addr = attr['ip_addr'] if(attr['ip_addr'] != nil)
	end

	def changed?(attr)
		return true if(@ip_addr != attr['ip_addr'])
		return false
	end
	
	def connect
		Thread.new do
	 		# generate points
			point_list = {}
			1.upto 3 do |pid|
				point = Ir.new(pid,@dev_id)
				point_list[point.id] = point
			end
			@data_man.update_point_list(point_list)

			# communication status check
			Thread.new do
				loop do
#					puts "CHECK CONNECTION TO GLOBALCACHE"
					uri = URI.parse("http://#{@ip_addr}/api/v1/version")
					if(check_com(uri) == true)
						if(@connection == false)
							@connection = true
							@ready = true
							puts "Connect to Global Cache: #{@ip_addr}"
							contents = ['con_gc']
							@data_man.add_history('System',contents)

							point_list.each do |id,point|
								@data_man.cos(point.pid,@dev_id,{'com_stat'=>true})
							end
						end
					else
						if(@connection == true)
							@connection = false
							puts "Fail to connect to Global Cache: #{@ip_addr}"
							contents = ['con_gc_fail']
							@data_man.add_history('System',contents)

							point_list.each do |id,point|
								@data_man.cos(point.pid,@dev_id,{'com_stat'=>false})
							end
						end
					end
					sleep 10
				end
			end

			loop do
				command = @com_queue.pop 	# command is [id,{command}]
				id = command[0]
				com = command[1]
				next if(com.empty? == true)
				# send command to GlobalCache
		 		uri = URI.parse("http://#{@ip_addr}/api/v1/irports/#{id}/sendir")
				model = @data_man.point_list[ManagementPoint.get_id(id,@dev_id)].model
				com.each_key do |c|
					send_command(uri,model,c)
				end
			end
		end
	end

	def check_com(uri)
		header = {'Content-Type'=>'application/json'}
		http = Net::HTTP.new(uri.host,uri.port)
#		puts uri.request_uri
		http.open_timeout = 5
		request = Net::HTTP::Post.new(uri.request_uri,header)
		begin
			response = http.request(request)
#			puts "RES: #{response.code}:#{response.msg}"
			if(response.code.strip != '200') # faile to send
				return false
			end
			return true
		rescue => e
			puts "Timeout"
			return false
		end
	end

	def send_command(uri,model,command)
		header = {'Content-Type'=>'application/json'}
		http = Net::HTTP.new(uri.host,uri.port)
#		puts uri.request_uri
		request = Net::HTTP::Post.new(uri.request_uri,header)
		request.body = @command[model][command].to_json
#		puts request.body
		begin
			response = http.request(request)
#			puts "RES: #{response.code}:#{response.msg}"
			if(response.code.strip != '200') # faile to send
				@connection = false
				puts "Fail to connect to Global Cache: #{@ip_addr}"
				contents = ['con_gc_fail']
				@data_man.add_history('System',contents)
			else
				@connection = true
			end
		rescue => e
			@connection = false
			puts "Timeout"
		end
	end
end

