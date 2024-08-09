#coding: utf-8

require 'rmodbus'
require_relative 'Device'
require_relative 'DamaIotModule'
require_relative 'FcuDama'

class DamaModules < Device
	def initialize(id, data_man)
		super
		@user = ''
		@passwd = ''
		@poling_wait = 2 
		@counter = 0

	end

	def key
		'dama'
	end

	def device_attr
		{'user'=>@user,'passwd'=>@passwd}
	end

	def set_attribute(attr)
		@user = attr['user'] if(attr['user'] != nil)
		@passwd = attr['passwd'] if(attr['passwd'] != nil)
	end

	def changed?(attr)
		return true if(@user != attr['user'])
		return true if(@passwd != attr['passwd'])
		return false
	end
	
	def connect
		@thread = Thread.new do
			hist_flag = true
			puts "Connect to DAMA IOT module"
			contents = ['try_connect_dama',@ipaddr,@port]
			@data_man.add_history('System',contents) if(hist_flag)

			loop {
				mod = DamaIotModule.new
				time = Time.now
				mod.get_token(@user,@passwd)
				# update connected modules
				id_list = mod.register_module	# id_list is pid array
				# check if new points are added
				added = add_points(id_list,mod)	# new point is added to point list
				# update point list			
				@data_man.update_point_list(added)

				loop {
					begin
						update = Time.now
						if(update-time > 3300) # 55min each
							mod.get_token(@user,@passwd) 
							time = update
						end
						comm_err = []
						# get status of DAMA IOT modules
						stat = mod.get_status
						stat.each do |id,data|
	#						break if(data["message"] != nil)	# token has to be get again
							# update status
							cos = make_cos(data)
							comm_err.push(id) if(data['eventType'] == 'disconnected')

							if(cos.empty? == false)
								# send cos to data_man
								@data_man.cos(mod.get_pid(id),@dev_id,cos)
							end
						end
						send_command(mod,comm_err)
						sleep @poling_wait
					rescue => e
						mod.find_module
					end
				}
			}
			puts "Thread existed"
		end
	end

	# if new point is exist in id_list then create point and register it
	def add_points(id_list,mod)
		points = {}
		id_list.each do |id|
			pid = mod.get_pid(id)
			if(@point_list[ManagementPoint.get_id(pid,@dev_id)] == nil)
				point = FcuDama.new(pid,@dev_id)
				@point_list[point.id] = point
				points[point.id] = point
			end
		end
		return points
	end

	def make_cos(data)
		cos = {'com_stat'=>true,'stat'=>'off','mode'=>'cool','actual_mode'=>'cool','sp'=>24,'fanstep'=>'L','flap'=>0,'temp'=>20,'error'=>false,'err_code'=>'','powerful'=>false}

		# communication error
		return {'com_stat'=>false} if(data['eventType'] == "disconnected")
		cos['stat'] = 'off' 
		cos['stat'] = 'on' if(data['Set_OnOff'] == 1)
		cos['fanstep'] = 'M' if(data['Set_Fan'] == 4)
		cos['fanstep'] = 'H' if(data['Set_Fan'] == 8)
		cos['fanstep'] = 'auto' if(data['Set_Fan'] == 128)
		cos['mode'] = 'fan' if(data['Set_Mode'] == 2)
		cos['mode'] = 'dry' if(data['Set_Mode'] == 4)
		cos['mode'] = 'heat' if(data['Set_Mode'] == 8)
		cos['mode'] = 'auto' if(data['Set_Mode'] == 10)
		cos['sp'] = data['Set_Temp']
		cos['powerful'] = true if(data['Set_Turbo'] == 1)
		cos['flap'] = 'swing' if(data['Set_Swing'] == 1)
		cos['err_code'] = data['Sta_ErrCode'].to_s(16) if(data['Sta_ErrCode'] != nil && data['Sta_ErrCode'] > 0)
		cos['error'] = true if(data['Sta_ErrCode'] != nil &&data['Sta_ErrCode'] > 0)
		cos['temp'] = data['Sta_IDRoomTemp']
		return cos
	end

	# send command to device
	def send_command(mod,comm_err)
		queues = [@resend_queue,@com_queue]
		resend = []
		queues.each do |queue|
			while(queue.empty? == false)
				command = queue.pop 	# command is [id,{command}]
				pid = command[0]
				com = command[1]
				next if(com.empty? == true)
				# if target is communication error then send later
				if(comm_err.include?(pid))
					resend.push(command)
					next
				end
				dama_com = make_command(com) # convert to DAMA IOT module commnad
				resend.push(command) if(mod.set_status(mod.get_id(pid),dama_com) == false)
			end
		end
		# store command if it could not be sent to resend queue
		resend.each do |com|
			@resend_queue.push(com)
		end
	end

	def make_command(command)
		dama_com = {}
		command.each do |com,val|
			case com
			when 'stat'
				dama_com['Set_OnOff'] = 0
				dama_com['Set_OnOff'] = 1 if(val == 'on')
			when 'mode'
				dama_com['Set_Mode'] = 1
				dama_com['Set_Mode'] = 2 if(val == 'fan')
				dama_com['Set_Mode'] = 4 if(val == 'dry')
				dama_com['Set_Mode'] = 8 if(val == 'heat')
				dama_com['Set_Mode'] = 10 if(val == 'auto')
			when 'sp'
				dama_com['Set_Temp'] = val.to_i
			when 'fanstep'
				dama_com['Set_Fan'] = 2
				dama_com['Set_Fan'] = 4 if(val == 'M')
				dama_com['Set_Fan'] = 8 if(val == 'H')
				dama_com['Set_Fan'] = 128 if(val == 'auto')
			when 'flap'
				dama_com['Set_Swing'] = 0
				dama_com['Set_Swing'] = 1 if(val == 'swing')
			when 'powerful'
				dama_com['Set_Turbo'] = 0
				dama_com['Set_Turbo'] = 1 if(val == true)
			end
		end
		return dama_com
	end	
end
