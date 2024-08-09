#coding: utf-8

require 'net/https'
require 'socket'
require 'uri'
require 'json'
require 'openssl'
require 'base64'
require 'timeout'

class DamaIotModule
	def initialize
		# DAMA IOT module server url
		@url = "https://ybmwz54r41.execute-api.ap-southeast-1.amazonaws.com/dev/"	# for development
#		@url = "https://ybmwz54r41.execute-api.ap-southeast-1.amazonaws.com/prod/"
		# access key id for DHOS
		@accesskeyid = "AKIAWW7P4GRAJDNSAEMS"
		@secretaccesskey = "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"

		@token = nil

		# module in this LAN
		# format is {"id":{"ip":ipaddr,"thingName":thing name,"key":key,"pid":pid},...}
		@modules = {}
		@pid_list = {}	# get id from pid {pid=>id,...}
		@max_id = 0

		@file = 'dama_iot_module.json'

		load(@file)
	end

	# access to DAMA IOT module server and get token of specified user
	# token is set to @token
	# if token could get reutrn true
	def get_token(user,passwd)
		command = "userlogin"
		req = {"requestData"=>{"accesskeyid"=>@accesskeyid, "secretaccesskey"=>@secretaccesskey, "username"=>user, "password"=>passwd}}
		ret = post(@url+command,req)
		if(ret != nil)
			@token = ret['idToken']
			save(@file)
			return true
		end
		return false
	end

	# get registered module list
	# return module id array
	def register_module
		get_paired_modules	# get registered module access keys 
		find_module	# get ip address of modules
		id_list = get_module_id
		id_list.each do |id|
			# remove unregistered module
			delete_module(id) if(@modules[id]['key'] == nil)
		end
		save(@file)
		return get_module_id
	end

	# return id array
	def get_module_id
		return @modules.keys
	end

	def get_pid(id)
		@modules[id]['pid']
	end
	def get_id(pid)
		@pid_list[pid]
	end

	def get_cloud_status
		command = "getdevicestate"
		reply = {}
		@modules.each do |id, info|
			req = {"requestData"=>{"accesskeyid"=>@accesskeyid, "secretaccesskey"=>@secretaccesskey, "thingName"=>info["thingName"]}}
			ret = post(@url+command,req,@token)
			next if(ret == nil)
			reply[id] = ret
		end
		return reply
	end

	def set_cloud_status(id,stat)
		command = "setdevicestate"
		thing_name = @modules[id]["thingName"]
		req = {"requestData"=>{"accesskeyid"=>@accesskeyid, "secretaccesskey"=>@secretaccesskey, "thingName"=>thing_name,"payload"=>{"state"=>{"desired"=>stat}}}}
		ret = post(@url+command,req,@token)
		return false if(ret == nil || ret["message"] != "success")
		return true
	end

	# get status of modules
	# return json object format is {id:{status response},...}
	def get_status
		command = {"action"=>"getStatus","version"=>-1,"thingName"=>nil}
		rep = {}
		@modules.each do |id,info|
			# select target
			command["thingName"] = info["thingName"]
			data = encrypt(command,info["key"])
			data = str_to_byte_str(data)
			data = "<"+JSON.generate({"payload"=>data})+">"
#			puts "SEND DATA: #{data}"
			begin
				raise "Communication Error" if(info["ip"] == nil)
				sock = Socket.tcp(info["ip"],7002)
				sent = sock.send(data,0)
				sock.flush

				pack = ""
				ret = ""
				1.upto 8 do |i|
					ret,addr = sock.recvfrom(1000)
					pack += ret
				end
				sock.close

				pack.gsub!('<','')
				pack.gsub!('>','') 
				pack.gsub!('}','},')
				pack += "{}"
				pack = "["+pack+"]"
#  			puts pack
				begin
					pack = JSON.parse(pack)
				rescue => e
					next
				end
#				puts "#{pack}"
				rep[id] = {}
				pack.each do |seg|
					next if(seg["payload"] == nil)
					reply = decrypt(seg["payload"],info["key"])
					rep[id].update(reply)
				end
			rescue => e
#				puts "#{id} #{e}"
				rep[id] = {"thingName"=>command["thingName"],"eventType"=>"disconnected"}
			end
		end
		return rep
	end

	# operation for specified module
	# return updated status
	def set_status(id,stat)
		command = {"action"=>"setStatus","version"=>-1,"state"=>nil,"thingName"=>nil}
		thing_name = @modules[id]["thingName"]
		command["thingName"] = thing_name
		command["state"] = stat
		puts "SEND: #{command}"
		data = encrypt(command,@modules[id]["key"])
		data = str_to_byte_str(data)
		data = "<"+JSON.generate({"payload"=>data})+">"
#			puts "SEND DATA: #{data}"
		sock = Socket.tcp(@modules[id]["ip"],7002)
		sent = sock.send(data,0)
#			puts "SENT: #{sent}"
		sock.flush

		pack = ""
#		1.upto 8 do |i|
			ret,addr = sock.recvfrom(1000)
			pack += ret
#		end
		sock.close

#		pack.gsub!('<','')
#		pack.gsub!('>','') 
#		begin
#			pack = JSON.parse(pack)
#		rescue => e
#			return true
#		end
#				puts "#{pack}"
#		reply = decrypt(pack["payload"],@modules[id]["key"])
#		puts "REP: #{reply}"
		return true
	end

###############################
# private method
	def delete_module(id)
		ret = @modules.delete(id)
		return false if(ret == nil)
		return true
	end

	# load settings for DAMA IOT module
	def load(file)
		begin
			File.open(file,"r") do |f|
				data = JSON.parse(f.gets)
				@token = data['token'] if(data['token'] != nil)
				@max_id = data['max_id'] if(data['max_id'] != nil)
				@modules = data['modules'] if(data['modules'] != nil)
			end
			@modules.each do |id,data|
				@pid_list[data['pid']] = id
				# remove ip address from module info
				data['ip'] = nil
			end
		rescue => e
			puts e
			return false
		end
		return true
	end

	# save setting for DAMA IOT module
	def save(file)
		data = {"modules"=>@modules,"max_id"=>@max_id,"token"=>@token}
		begin
			File.open(file,"w") do |f|
				f.puts(JSON.generate(data))
			end
		rescue => e
			puts e
			return false
		end
		return true
	end

	# find IOT modules in the LAN and return ip address and thingName pair array
	# [{"ip":ipaddr,"thingName":thing name},...]
	# waiting_time is seconds to waiting boradcast return
	def find_module(waiting_time = 1)
		@modules.each do |id,data|
			# remove ip address from module info
			data['ip'] = nil
		end
		waiting_port = 61245
		send_port = 61244
		udp = UDPSocket.open()
		udp.bind("0.0.0.0",waiting_port)
		# send broadcast to LAN
		udp.setsockopt(Socket::SOL_SOCKET,Socket::SO_BROADCAST,1)
		udp.send(JSON.generate({"LAN_DEV_DETECT"=>"LAN_DEV_DETECT"}),0,"255.255.255.255",send_port)
		# wait return from module
		th = Thread.new do	# return thread id
			loop do
				msg,addr = udp.recvfrom(128)
				ip = addr[3]	# IP address of sender
				msg.gsub!("\'",'"')	# this is for DAMA IOT module bug
				data = JSON.parse(msg)
#				puts "Receive: #{msg} from #{ip} #{addr}"
				reg_module(ip,data["LAN_DEV_DETECT"]["thingName"],nil)
			end
		end
		sleep(waiting_time)
		th.kill
		udp.close
#		puts "MODULES: #{@modules}"
	end

	# get keys for each DAMA IOT module 
	def get_key(thing_name)
		command = "getdevicekey"
		req = {"requestData"=>{"accesskeyid"=>@accesskeyid, "secretaccesskey"=>@secretaccesskey, "thingName"=>thing_name}}
		ret = post(@url+command,req,@token)
		return ret['key'] if(ret != nil)
		return nil
	end

	def get_paired_modules
		command = "getpairedmodule"
		req = {"requestData"=>{"accesskeyid"=>@accesskeyid, "secretaccesskey"=>@secretaccesskey}}
		ret = post(@url+command,req,@token)
		return if(ret == nil || ret.class != Array)
		ret.each do |mod|
			reg_module(nil,mod['thingName'],mod['key'])
		end
	end

	# return json object
	def post(url,data,token=nil)
	uri = URI.parse(url)
		begin
			http = Net::HTTP.new(uri.host,uri.port)
			http.use_ssl = true if(uri.scheme == "https")
			req = Net::HTTP::Post.new(uri.path)
			req['Authorization'] = token if(token != nil)
			data = JSON.generate(data)
			req.body = data
			res = http.request(req)
			ret = JSON.parse(res.body)
			return ret
		rescue => e 
			puts "POST:#{e} #{e.backtrace}"
			return nil
		end
	end

	# register module info to this object and assign id
	# id is from thingName
	def reg_module(ip,thingName,key)
		id = thingName.gsub('Daikin_','')
		if(@modules[id] == nil)
			@max_id += 1
			@modules[id] = {'ip'=>ip,'thingName'=>thingName,'key'=>key,'pid'=>@max_id}
			@pid_list[@max_id] = id
		else
			@modules[id]['ip'] = ip if(ip != nil)
			@modules[id]['key'] = key if(key != nil)
		end
	end

	# encrypt for Lan connection
	# msg is command json object
	# return encrypted data part
	def encrypt(msg,key)
		msg = JSON.generate(msg) #.gsub('"','\"')
#		puts "MSG: #{str_to_byte_str(msg)}"
		enc = OpenSSL::Cipher::AES.new(128, :CBC)
		enc.encrypt
		enc.key = [key].pack("H*")
		enc.iv = [key].pack("H*")
		data = ""
		data << enc.update(msg)
		data << enc.final
		return data
	end

	# decrypt for Lan connection
	# msg is received encrypted data
	# return json object of reply
	def decrypt(msg,key)
		dec = OpenSSL::Cipher::AES.new(128, :CBC)
		dec.decrypt
		dec.key = [key].pack("H*")
		dec.iv = [key].pack("H*")
		data = ""
		data << dec.update([msg].pack("H*"))
		data << dec.final
		return JSON.parse(data)
	end

	def str_to_byte_str(str)
		barray = str.bytes
		ret = ""
		barray.each do |v|
			if(v < 16)
				ret << "0#{v.to_s(16)}"
			else
				ret << v.to_s(16)
			end
		end
		return ret
	end
end

#mod = DamaIotModule.new

#loop do
#	mod.get_token("masayuki.hayashi@daikin.co.jp","Masayuki05")
#	id = mod.register_module
#	id = mod.get_module_id
#	puts "Registered ID: #{id}"
#	loop do
#		break_flag = false
#		stat = mod.get_cloud_status
#		puts "#{stat}"
#		stat.each do |id,data|
#			if(data["message"] != nil)
#				break_flag = true
#				break
#			end
#			if(data['eventType'] == "disconnected")
#				puts "#{id}: Communication error" 
#			else
#				puts "#{id}: #{data}"
#			end
#		end
#		break if(break_flag)
#		sleep 3600
#	end
#	puts "Get Token"
#end
#ret = mod.set_cloud_status(id[0],{"Set_OnOff"=>1, "Set_Fan"=>128})
#puts "Operation Result: #{ret}"
#stat = mod.get_cloud_status
#puts "Current Status: #{stat}"
#ret = mod.set_cloud_status(id[0],{"Set_OnOff"=>0, "Set_Fan"=>1})
#puts "Operation Result: #{ret}"
#stat = mod.get_cloud_status
#puts "Current Status: #{stat}"
#ret = mod.get_status
#puts "Status: #{ret}"
