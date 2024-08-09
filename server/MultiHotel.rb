#coding: utf-8

require 'json'
require_relative 'RoomFcu'
require_relative 'Timer'
require_relative 'Room'

class MultiHotel
	def initialize(data_man)	
		@room_file = 'room.json'
		@hotel_file = 'multihotel.json'
		
		@data_man = data_man
		
		@roomlist = {}
		
		begin
			if(File.exist?(@room_file))
				@roomDetails = @data_man.get_file(@room_file)
			else	
				if(@roomDetails == nil || @roomDetails.empty?)
					@roomDetails = {}												#default hotel hash
				end	
			end
		rescue => e
			puts "Hotel GET room.json Error: #{e}"
			return false
		end	

		begin
			if(File.exist?(@hotel_file))
				@hotel = @data_man.get_file(@hotel_file)				
			else	
				if(@hotel == nil || @hotel.empty?)
					@hotel = {														#default hotel hash
						'unrentedopMode' => 'opmodeoff',
						'unrentedOMSB' => '---',
						'unrentedOMSP' => '22.0',
						'unrentedfanstep' => 'L',
						'rentedopMode' => 'opmodeoff',
						'rentedOMSB' => '---',
						'rentedOMSP' => '22.0',
						'rentedfanstep' => 'L',
						'kcMode' => 'keycardoff',
						'KCSB' => '---',
						'KCSP' => '22.0',
						'FSL' => true,
						'keycardoutdelay' => 0,
						'windowopendelay' => 0,
						'checkoutdelay' => 0,
						'remotecontrol' => true,
						'offFCU' => true,
					}
				end	
			end
		rescue => e
			puts "Hotel GET hotel.json Error: #{e}"
			return false
		end

		createRoomObjects()
	end
	
	def save_hotel(hotel)															#to save and write hotel to JSON
		@hotel = hotel
		
		@data_man.save_file(@hotel_file,@hotel)
	end
	
	def save_room_details(roomDetails)
		@roomDetails = roomDetails
		
		@data_man.save_file(@room_file, @roomDetails)
		
		createRoomObjects()
	end
	
	def createRoomObjects()
		if(@roomDetails != nil && !@roomDetails.empty?)
			@roomDetails.each do |id, details|
				@roomlist[id] = Room.new(details, @hotel, @data_man) #if(@roomDetails == nil || @roomDetails.empty?)
			end
		end	
	end
	
	def check(point,cos)	
#DETERMINE ROOM, CHECK THAT ROOM WITH POINT/COS
		return if(@hotel.nil? || @hotel.empty? || @roomDetails.nil? || @roomDetails.empty?)

		roomName = nil

		@roomDetails.each do |id, details|
			details['type'].each do |key, value|
				if key == point
					roomName = id
				end
			end
		end		

		if roomName.nil?
			return false
		else
			@roomlist[roomName].check(point,cos)	if(@roomlist[roomName] != nil || !@roomlist.empty?)
		end
	end

	def get_hotel()																	#to get hotel JSON from server
		return @hotel
	end
	
	def get_room_details()
		return @roomDetails
	end

	def get_keycard_id
#RETURN ALL KEYCARD ID, HASH {"Room1":"KEYCARDID1", "Room2":"KEYCARDID2"}
		keycardList = {}
		
		@roomDetails.each do |id, details|
			details['type'].each do |key, value|
				if value == 'hotelkeycard'
					keycardList[id] = key
				end	
			end		
		end
		
		return keycardList
	end

	def keycard_registered?
		keycardList = get_keycard_id()
	
		return false if(keycardList.length == 0)
		return true
	end
end