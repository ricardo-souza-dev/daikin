#coding: utf-8

require 'json'
require_relative 'RoomFcu'
require_relative 'Timer'

class Room
	def initialize(details, hotel, data_man)
		@hotel = hotel																#list of hotel settings
		@details = details
		
		@checkin = []																#checkin signal device ID (RENTAL SIGNAL)
		@keycard = []																#keycard signal device ID (OCCUPANCY SIGNAL)
		@fcu = []																	#fcu device ID
		@sensor = []																#list of door/window sensor/s device ID (ARRAY)
		@windowTimer = {}															#Window open timer, hash table. Key is Window Sensor ID, Value is Timer.new object
		
		begin
			@details['type'].each do |key, value|									#loop according to number of devices in "type"
				case value
				when 'hotelcheckin'
					@checkin << key
				when 'hotelkeycard'
					@keycard << key
				when 'hotelfcu'
					@fcu << key
				when 'hotelsensor'
					@sensor << key
					@windowTimer[key] = Timer.new 									#create window timer object here
				end
			end
		rescue => e
			puts "Error: #{e}"
		end	
		
		@sensorFCUPairing = @details['sensorFCUPairing']								#sensorFCUPairing info 

		@data_man = data_man														#data manager object
#CHECKIN SIGNAL CHECK
		@checkInExist = true
		if @checkin.empty?
			@checkInExist = false
		end
#INITIALIZE Timer		
		@unrentTimer = Timer.new													#unrent delay if no check in
		@unoccupiedTimer = Timer.new												#Unoccupied delay
		
#CREATE FCU OBJECT
		@fculist = {}
		
		@fcu.each do |id|
			@fculist[id] = RoomFcu.new(@hotel, id, @data_man, @checkInExist)
		end
		
		checkHotelCurrentStatus()
	end
	
	def checkHotelCurrentStatus()
		begin
			keycardcStatus = @data_man.check_point_status(@keycard[0])
			
			if keycardcStatus['stat'] == 'on'
				@fculist.each do |id, fcu|
					if fcu.nil?
						puts "Fculist object is nil"
					else
						fcu.occupied(false)
					end
				end
			end
		rescue => e
			puts "Error: #{e}"
		end	
	
		if @checkInExist == true													#only run check in signal status check if check in exist
			begin
				checkIncStatus = @data_man.check_point_status(@checkin[0])
				
				if checkIncStatus['stat'] == 'on'
					@fculist.each do |id, fcu|
						if fcu.nil?
							puts "Fculist object is nil"
						else
							fcu.rent(false)
						end
					end
				end
			rescue => e
				puts "Error: #{e}"
			end
		end
		
		if @hotel['offFCU'] == true													#If 'windows open/off fcu' enabled
			@sensor.each do |sensorpoint|											#check each sensor point
				sensorcStatus = @data_man.check_point_status(sensorpoint)

				if sensorcStatus['stat'] == 'on'									#only execute if sensor open
					@sensorFCUPairing.each do |key, value|							#loop according to @sensorFCUPairing
						if key == sensorpoint
							value.each do |fcu|
								if @fculist[fcu].nil?
									puts "Fculist object is nil"
								else
									@fculist[fcu].win_open(false)
								end
							end
						end
					end											
				end			
			end
		end
	end
	
	def check(point,cos)															#Hotel Interlock main status check function
		return if(@hotel.nil? || @hotel.empty?)										#return if hotel settings is not setup.

		pointtype = @details['type'][point]

		if pointtype.nil?
			return false
		else
			case pointtype
			when 'hotelcheckin'
				if cos['stat'] == 'on'												#check in signal
					@fculist.each do |id, fcu|
						if fcu.nil?
							puts "Fculist object is nil"
						else
							fcu.rent(true)
						end
					end
				else																#check out signal
					@fculist.each do |id, fcu|
						if fcu.nil?
							puts "Fculist object is nil"
						else
							fcu.unrent(true)
						end
					end
				end
			when 'hotelkeycard'				
				@data_man.send_occ_stat(cos['stat'])
				if cos['stat'] == 'on'												#keycard in
					@fculist.each do |id, fcu|
						if fcu.nil?
							puts "Fculist object is nil"
						else
							@unoccupiedTimer.cancel									############
							@unrentTimer.cancel
							fcu.occupied(true)
						end
					end
				else					 											#keycard out
					begin
						kcdelay = @hotel['keycardoutdelay']
						kcdelay = kcdelay.to_i * 60									#keycard out delay in minutes
						@unoccupiedTimer.one_time(kcdelay) do 
							@fculist.each do |id, fcu|
								fcu.unoccupied(true)							
							end

							if @checkInExist == false								#if no check in signal, delay check out
								codelay = @hotel['checkoutdelay']
								codelay = codelay.to_i * 60 * 60					#keycard out delay in hours
								@unrentTimer.one_time(codelay) do
									@fculist.each do |id, fcu|
										fcu.unrent(true)									
									end
								end								
							end
						end
					rescue => e
						puts "Warning: #{e}"
					end
				end
			when 'hotelsensor'					
				if @hotel['offFCU'] == true											#only check if "Off Fcu" when "Window Open" is "Enabled"
					if cos['stat'] == 'on'											#Window sensor open
						begin
							windelay = @hotel['windowopendelay']					#window open delay in minutes
							windelay = windelay.to_i * 60							#Window open delay in minutes

							@windowTimer[point].one_time(windelay) do 
								@sensorFCUPairing.each do |key, value|				#loop according to @sensorFCUPairing
									if key == point
										value.each do |fcu|
											@fculist[fcu].win_open(true)									
										end
									end
								end
							end
						rescue => e
							puts "Warning: #{e}"
						end
					else															#Window sensor close
						@sensorFCUPairing.each do |key, value|						#loop according to @sensorFCUPairing
							if key == point
								value.each do |fcu|
									if @fculist[fcu].nil?
										puts "Fculist object is nil"
									else
										@windowTimer[point].cancel
										@fculist[fcu].win_close(true)
									end
								end
							end
						end
					end
				end	
			else
				return false
			end
		end	
	end
end