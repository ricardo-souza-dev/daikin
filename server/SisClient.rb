# coding: utf-8
#
# This object is a device object of multi site monitoring server

#require 'websocket-eventmachine-client'
require 'faye/websocket'
require 'json'
require_relative 'cgi.rb'
require_relative 'Timer'

class SisClient
	def initialize(addr,port,gid,id,comm_man)
		@name
		@port = port
		@ipaddr = addr
		@group_id = gid
		@site_id = id
		@ws = nil
		@comm_man = comm_man
		@comm_man.sis = self
#		@ping_timer = nil
#		@retry_timer = Timer.new
		@ping_timer = Timer.new
		@ping_interval = 90
#		@pong_timer = nil
		@pong_timer = Timer.new
		@pong_wait = 60
		@close_timer = Timer.new
		@close_wait = 30
		@max_data = 100000
		@multipart_data = {}
	end

	attr_accessor :name

	def connect
		sleep 3
		url = "wss://#{@ipaddr}:#{@port}"
		puts "Try to connect SIS #{url} from #{@group_id}"
		contents = ['con_sis']
		@comm_man.data_man.add_history('System',contents)

		EventMachine::run do
			connection_event(url)
		end
	end

	def connection_event(url)
		return if(@ws != nil)
		begin
#			ws = WebSocket::EventMachine::Client.connect(:uri => url)
			ws = Faye::WebSocket::Client.new(url,[],:tls=>{:verify_peer=>false})
#			ws.onopen do
			ws.on :open do |event|
				@ws = ws

				puts "SIS server connected #{@group_id}"
				putLog("SIS server connected #{@group_id}")
				contents = ['sis_connected']
				@comm_man.data_man.add_history('System',contents)

				message = JSON.generate(['connect',[@group_id,'local',@site_id]])
				@ws.send(message)
				if(@site_id != nil)
					message = JSON.generate(['',['ready']])
					@ws.send(message)
				end

				sendBgFiles(@group_id,@site_id)

				@ping_timer.periodic(@ping_interval) do
#					puts "Send ping"
#					putLog("Send ping")
					@pong_timer.one_time(@pong_wait) do
						puts "Close because no pong"
						putLog("Close because no pong")
#						contents = ['no_pong','','']
#						@comm_man.data_man.add_history('System',contents)
						# close this connection
						close_sock
					end
					@ws.ping('',&pong)
				end
			end


#			ws.onmessage do |msg,type|
			ws.on :message do |event|
				@pong_timer.cancel if(@pong_timer != nil)	# add to improve stability of communication
#				Thread.new do
					msg = event.data
	#				@pong_timer = nil
					com = JSON.parse(msg)
					st = Time.now
					puts "Receve Message: #{com[1][0]}"
					putLog("Receve Message: #{com[1][0]}")
	#				puts "Rcv Sis: #{com}"
					# send com to receiver for dispatch command
					id,ret = @comm_man.receive_command(com)
					send(id,ret)
					puts "Send back: #{Time.now-st}sec"
					putLog("Send back: #{Time.now-st}sec")
#				end
			end

#			ws.onclose do
			ws.on :close do |event|
				# kill close timer
				if(ws === @ws)
					@close_timer.cancel if(@close_timer != nil)
					puts "Close in onclose"
					putLog("Close in onclose")
					contents = ['close_called','','']
					@comm_man.data_man.add_history('System',contents)
					close_connection 
				elsif(@ws == nil)
					@close_timer.cancel if(@close_timer != nil)
					puts "Close in onclose"
					putLog("Close in onclose")
					contents = ['close_called','','']
					@comm_man.data_man.add_history('System',contents)
					close_connection 
				else
					puts "Wrong socket is closed"
					putLog("Wrong socket is closed")
				end
			end

#			ws.onerror do
			ws.on :error do |event|
				puts "Error"
				putLog("ERROR: Socket error")
				contents = ['sock_err','','']
				@comm_man.data_man.add_history('System',contents)
				close_sock
			end
		rescue => e
			close_sock
		end
	end

	def pong
#		putLog("Receive pong")
#		puts "pong timer cancel"
		@pong_timer.cancel if(@pong_timer != nil)
	end

	def close_sock
		puts "Close socket"
		putLog("Close socket")
		contents = ['con_closed','','']
		@comm_man.data_man.add_history('System',contents)
		@ws.close if(@ws != nil)
#		@close_timer = EM::Timer.new(@close_wait) do
		@close_timer.one_time(@close_wait) do
			puts "onclose was not called"
			putLog("onclose was not called")
			contents = ['dont_call_close','','']
			@comm_man.data_man.add_history('System',contents)
			close_connection
		end
	end

	def close_connection
		puts "Call close connection"
		putLog("Call close connectino")
		@ping_timer.cancel if(@ping_timer != nil)
		@pong_timer.cancel if(@pong_timer != nil)
		@ws = nil

		# reconnection
		@close_timer.one_time(10) do
			puts "Try to reconnect to SIS"
			putLog("Try to reconnect to SIS")
			connect
		end
	end

	def send(id,command)
		if(@ws == nil)
			puts "SIS is not connected"
			return false
		else
			if(id == nil && command == nil)
				# old ping not use
			else
				#puts "Send #{command}"
				data = JSON.generate([id,command])
				puts "SEND DATA SIZE: #{data.length}"
#				if(data.length < @max_data)
					st = Time.now
					puts "Single Packet: #{data.length}"
					@ws.send(data)
					puts "Sent #{Time.now-st}"
#				else
#					multi_part_send(id,data)
#				end
			end
		end
	end

	def multi_part_send(id,data)
		packs = []
		start = 0
		section = 0
		max_section = (data.length.to_f/@max_data).ceil
		Thread.new do
			loop do
				seg = data.byteslice(start,@max_data)
				break if(seg == nil)
				snd = JSON.generate([id,['multipart',section,max_section,seg]])
				section += 1
				start += @max_data
				st = Time.now
				puts "Multi Packet: #{section}/#{max_section} #{snd.length}"
				@ws.send(snd)
				puts "Sent #{Time.now-st}"
				sleep(0.1)
			end
		end
	end
	
	# @multipart_data {command=>[seg,seg]} [seg,seg,..].length == max_section
	def join_multipart(mult_pack)
		if(@multipart_data[mult_pack[1]] == nil)
			@multipart_data[mult_pack[1]] = Array.new(mult_pack[3])
			@multipart_data[mult_pack[1]][mult_pack[2]] = mult_pack[4]
		else
			# wrong packet received max size is different
			return nil if(@multipart_data[mult_pack[1]].length != mult_pack[3])
			# wrong packet received receive same segment already
			return nil if(@multipart_data[mult_pack[1]][mult_pack[2]] != nil)
			@multipart_data[mult_pack[1]][mult_pack[2]] = mult_pack[4]
			return check_packet(mult_pack[1])
		end
	end

	def check_packet(command)
		packet = ""
		@multipart_data[command].each do |data|
			packet += data
			return nil if(data == nil)
		end
		# all packets received
		return packet
	end

	def sendBgFiles(gid,siteid)
		if(siteid == nil)
			id = gid
		else
			id = siteid 
		end
		info = getImgFileInfo
		utime = nil
		utime = Time.at(info['time']) if(info['time'] != nil)
		files = newFileList('../screen',info['file'],utime)
		return if(files.empty?)
		# send files to SIS
		res = postFile(@ipaddr,'/screen/ReceiveScreen.rb',id,'../screen',files)
		if(res == true)
			files.each do |f|
				info['file'].push(f) if(info['file'].include?(f) == false)
			end
			info['time'] = Time.now.to_i
			puts "New File: #{files}"
			saveImgFileInfo(info) if(files.length > 0)
		else
			puts "Faile to send image files"
		end
	end

	def getImgFileInfo
		info = {'file'=>[],'time'=>nil}
		begin
			File.open('bgimg.json','r:UTF-8') do |io|
				line = io.gets.strip
				info = JSON.load(line)
			end
		rescue 
		end
		return info
	end

	def saveImgFileInfo(info)
		begin
			File.open('bgimg.json','w') do |io|
				io.puts(JSON.generate(info))
			end
			File.chmod(0777,'bgimg.json')
		rescue => e
			return false
		end
		return true
	end

	def newFileList(path,files,utime)	# utime is Time object
		newFiles = []
		Dir.foreach(path) do |f|
			fname = path+'/'+f
			next if(File.directory?(fname))
			next if(File.zero?(fname))
			# check time stamp
			if(files.include?(f))
				newFiles.push(f) if(utime == nil || utime < File.mtime(fname))
			else
				newFiles.push(f)
			end
		end
		return newFiles
	end

	def putLog(message)
#		begin
#			File.open('SisConnection.log','a') do |io|
#				io.puts("#{Time.now} #{message}")
#			end
#		rescue
#		end
	end
end

#client = SisClient.new('localhost',50000,'id1')
#client.connect
#loop do
#	com = gets.strip
#	client.send(com)
#end
