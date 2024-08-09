#coding: utf-8

require_relative 'AccessController'

class HotelAccessController < AccessController
	def initialize(data_man,user,passwd='')
		super
		@room_list = []
	end	

	def set_rooms(room)
		@room_list = room
	end

	def set(ws)
		super
		# send connected to each room
		@room_list.each do |room|
			@data_man.guest_room[room]["connection"] = true
			@data_man.rcos(room,{"version"=>2,"connection"=>true})
		end
	end

	def reset(ws)
		super
		return if(@ws != nil)
		# send disconnected to each room
		@room_list.each do |room|
			@data_man.guest_room[room]["connection"] = false
			@data_man.rcos(room,{"version"=>2,"connection"=>false})
		end
	end		
end
