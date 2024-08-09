#coding: utf-8

require_relative 'AccessController'

class RoomController < AccessController
	def initialize(data_man,user,passwd='')
		super
		@display_name = ''
		@rent_stat = false
		@occ_stat = false
	end

	attr_accessor :display_name, :rent_stat

	def set(ws)
		super
		# send cos to GUI
		@data_man.rcos(@user,{'connect'=>true})
	end

	def reset
		super
		# send cos to GUI
		@data_man.rcos(@user,{'connect'=>false})
	end

	def set_rent_stat(stat)
		@rent_stat = true if(stat == 'on')
		@rent_stat = false if(stat == 'off')
		begin
			@ws.send(JSON.generate(['',['rent','OK',stat]]))
			@data_man.db.update_stat(@user,@rent_stat)
		rescue
			return false
		end
		return true
	end

	def command_dispatch(command)
		return nil if(command == nil)
		case(command[0])
		when 'occ_status'	# ['occ_status','on'/'off']
			@occ_stat = true if(command[1] == 'on')
			@occ_stat = false if(command[1] == 'off')
			# send cos to GUI
			@data_man.rcos(@user,{'occ'=>@occ_stat})
			return
		when 'get_rent_status'
			stat = 'on' if(@rent_stat)
			stat = 'off' if(@rent_stat == false)
			@ws.send(JSON.generate(['',['get_rent_status','OK',stat]]))
			return
		else
			super
		end
	end

	def get_info
		connection = false
		connection = true if(@ws != nil)
		info = [@user,@display_name,connection,@rent_stat,@occ_stat,[]]
		@point_list.each_key do |id|
			info[5] << id
		end
		return info
	end
end
