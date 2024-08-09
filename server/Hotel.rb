#coding: utf-8

require 'json'
require_relative 'RoomFcu'
require_relative 'Timer'

class Hotel
	def initialize(data_man)																			
		@checkin = []
		@keycard = []																#keycard signal device ID
		@sensor = []																#list of door/window sensor/s device ID
		@cos_received = []															# id array when cos is received then remove from this array

		@checkInExist = true
		
		@hotel_file = 'hotel.json'
		
		@data_man = data_man
		
		@unrentTimer = Timer.new													#unrent delay if no check in
		@unoccupiedTimer = Timer.new												#Unoccupied delay
		
		@windowTimer = {}															#Window open timer, hash table. Key is Window Sensor ID, Value is Timer.new object
		@windowTimer5sec = {}														#Window open timer for 5sec, hash table. Key is Window Sensor ID, Value is Timer.new object
		
		@fiveSecTimer = Timer.new													#for 5 sec rerun unrent delay
		
		begin
			if(File.exist?(@hotel_file))
				@hotel = @data_man.get_file(@hotel_file)
			else	
				if(@hotel == nil || @hotel.empty?)
					@hotel = {'type' => {},											#default hotel hash
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
							'sensorFCUPairing' => {}} 
				end	
			end
		rescue => e
			puts "Error: #{e}"
			return false
		end	

		checkPointType()
	end
	
	def get_hotel()																	#to get hotel JSON from server
		return @hotel
	end
	
	def save_hotel(hotel) 															#to save and write hotel to JSON
		@hotel = hotel
		
		@data_man.save_file(@hotel_file,@hotel)
		
		checkPointType()
		createFcuObjects()
		checkHotelCurrentStatus()
	end
	
	def checkPointType()															#Check all DI points and their types
		@checkin = []																#Have to reset all arrays, in case there's changes
		@keycard = []
		@sensor = []
		
		begin
			@hotel['type'].each do |key, value|										#loop according to number of devices in "type"
				case value
				when 'hotelcheckin'
					@checkin << key
				when 'hotelkeycard'
					@keycard << key
				when 'hotelsensor'
					@sensor << key
					@windowTimer[key] = Timer.new 									#create window timer object here
					@windowTimer5sec[key] = Timer.new
				end
			end
		rescue => e
			puts "Error: #{e}"
		end	

		if @checkin.empty?
			@checkInExist = false
		else
			@checkInExist = true
		end
	end
	
	def createFcuObjects()
		@fculist = {}
		
		@point_list = @data_man.point_list
		
		@point_list.each do |id,point|
			if(point.is_a?(Fcu) == true)
				@fculist[id] = RoomFcu.new(@hotel, id, @data_man, @checkInExist)
			end	
		end	
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
					@hotel['sensorFCUPairing'].each do |key, value|					#loop according to @hotel['sensorFCUPairing']
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

		pointtype = @hotel['type'][point]
		
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
					
					@fiveSecTimer.one_time(5) do
						@fculist.each do |id, fcu|
							if fcu.nil?
								puts "Fculist object is nil"
							else						
								fcu.unrent(true)
							end
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
							@fiveSecTimer.cancel
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
									
									@fiveSecTimer.one_time(5) do					#rerun unrent() again with 5 seconds delay(overcome setback issue)
										@fculist.each do |id, fcu|
											fcu.unrent(true)
										end	
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
								@hotel['sensorFCUPairing'].each do |key, value|		#loop according to @hotel['sensorFCUPairing']
									if key == point
										value.each do |fcu|
											@fculist[fcu].win_open(true)									
										end
									end
								end
								
								@windowTimer5sec[point].one_time(5) do				#rerun win_open() again with 5 seconds delay(overcome setback issue)
									@hotel['sensorFCUPairing'].each do |key, value|	#loop according to @hotel['sensorFCUPairing']
										if key == point
											value.each do |fcu|
												@fculist[fcu].win_open(true)									
											end
										end
									end
								end
							end
						rescue => e
							puts "Warning: #{e}"
						end
					else															#Window sensor close
						@hotel['sensorFCUPairing'].each do |key, value|				#loop according to @hotel['sensorFCUPairing']
							if key == point
								value.each do |fcu|
									if @fculist[fcu].nil?
										puts "Fculist object is nil"
									else
										@windowTimer[point].cancel											
										@windowTimer5sec[point].cancel										
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

	def get_keycard_id
		return @keycard[0]
	end

	def keycard_registered?
		return false if(@keycard.length == 0)
		return true
	end
end