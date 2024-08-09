#coding: utf-8

class FcuStat
	def initialize(hotel, id, data_man, checkInExist, lks_FCU, roomFcu)
		@roomFcu = roomFcu 
		@hotel = hotel
		@fcuid = id
		@data_man = data_man
		
		@checkInExist = checkInExist
	end
	
	def rent(command, lks_FCU)
		return self
	end
	
	def unrent(command, lks_FCU)
		if command == true
			command = {}
			
			command['stat'] = 'off'
			command['sp'] = @hotel['unrentedOMSP']
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Default Unrent')
		end
		
		return self
	end
	
	def occupied(command, lks_FCU)
		return self
	end
	
	def unoccupied(command, lks_FCU)
		return self
	end
	
	def win_open(command, lks_FCU)
		if command == true
			command = {}
			
			command['stat'] = 'off'
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Default Win_open')
		end
		
		return self
	end
	
	def win_close(command, lks_FCU)
		return self
	end
end 
	
class FcuStat1 < FcuStat
	def unrent(command, lks_FCU)
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Default Unrent')
		end
		
		return self
	end	
	
	def rent(command, lks_FCU)
		if command == true
			command = {}
			
			opMode = @hotel['rentedopMode']
			setback = @hotel['rentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
				command['sp'] = @hotel['rentedOMSP']
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
				command['sp'] = @hotel['rentedOMSP']
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['fanstep'] = @hotel['rentedfanstep']
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Rented')
			return FcuStat2.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		else
			command = {}
			
			kcMode = @hotel['kcMode']
				
			if kcMode == 'keycardsetback'																#FCU off with setback
				command['stat'] = 'off'
				@data_man.operate(@fcuid,command,'hotelinterlock','Rented from status check')
			end	
			
			if @checkInExist == true
				return FcuStat4.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
			else
				return FcuStat4nci.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
			end	
		end	
	end 
	
	def occupied(command, lks_FCU)
		if command == true
			command = {}
			
			command['stat'] = 'off'
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Occupied w/o Rental')
		end	
			
		return FcuStat7.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)	
	end
	
	def win_open(command, lks_FCU)
		if command == true
			command = {}
		
			command['stat'] = 'off'
			command['csp_sb'] = nil
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Win open w/o Rental')
		end
		
		return FcuStat8.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
end

class FcuStat2 < FcuStat
	def occupied(command, lks_FCU)
		if command == true
			command = {}
			
			command['stat'], command['sp'], command['mode'], command['fanstep'], command['csp_sb'] = lks_FCU.get_last_stat()
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Occupied')
		end
		
		return FcuStat3.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def win_open(command, lks_FCU)
		if command == true
			command = {}
		
			command['stat'] = 'off'
			command['csp_sb'] = nil
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
		
			@data_man.operate(@fcuid,command,'hotelinterlock','Win open when unoccupied')
		end
		
		return FcuStat6.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def unrent(command, lks_FCU)
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			command['fanstep'] = @hotel['unrentedfanstep']
			
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unrent without occupied')
		end
		
		lks_FCU.set_last_stat('on', @hotel['unrentedOMSP'], 'cool', @hotel['unrentedfanstep'], nil)
	
		return FcuStat1.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
end

class FcuStat3 < FcuStat
	def unoccupied(command, lks_FCU)		
		if command == true	
			cStatus = @data_man.check_point_status(@fcuid)

			lks_FCU.set_last_stat(cStatus['stat'], cStatus['csp'], cStatus['mode'], cStatus['fanstep'], cStatus['csp_sb'])
		
			command = {}
			
			kcMode = @hotel['kcMode']
			setback = @hotel['KCSB']
			setback = nil if(setback == '---')
			
			case kcMode
			when 'keycardoff'																			#FCU off with no setback
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'keycardsetback'																		#FCU off with setback
				command['stat'] = 'off'
				command['csp_sb'] = setback
			when 'keycardsetpoint'																		#FCU on, sp change to @hotel['KCSP'] settings
				command['stat'] = 'on'
				command['sp'] = @hotel['KCSP']
			end
			
			if @hotel['FSL'] == true
				command['fanstep'] = 'L'
			end	
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unoccupied')
		end
	
		if @checkInExist == true
			return FcuStat4.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		else
			return FcuStat4nci.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		end	
	end
	
	def win_open(command, lks_FCU)
		if command == true
			cStatus = @data_man.check_point_status(@fcuid)
		
			lks_FCU.set_last_stat(cStatus['stat'], cStatus['csp'], cStatus['mode'], cStatus['fanstep'], cStatus['csp_sb'])
		
			command = {}
		
			command['stat'] = 'off'
			command['csp_sb'] = nil
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Window open')
		end	
		
		return FcuStat5.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def unrent(command, lks_FCU)
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			command['fanstep'] = @hotel['unrentedfanstep']
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unrent when occupied')
		end
		
		lks_FCU.set_last_stat('on', @hotel['unrentedOMSP'], 'cool', @hotel['unrentedfanstep'], nil)
	
		return FcuStat7.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
end

class FcuStat4 < FcuStat
	def occupied(command, lks_FCU)	
		if command == true
			command = {}
			
			command['stat'], command['sp'], command['mode'], command['fanstep'], command['csp_sb'] = lks_FCU.get_last_stat()
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Occupied')
		end
		
		return FcuStat3.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def win_open(command, lks_FCU)	
		if command == true
			command = {}
		
			command['stat'] = 'off'
			command['csp_sb'] = nil
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
		
			@data_man.operate(@fcuid,command,'hotelinterlock','Win_open when Unoccupied')
		end
		
		return FcuStat6.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def unrent(command, lks_FCU)	
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			command['fanstep'] = @hotel['unrentedfanstep']
			
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unrented')
		end
		
		lks_FCU.set_last_stat('on', @hotel['unrentedOMSP'], 'cool', @hotel['unrentedfanstep'])
	
		return FcuStat1.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
end

class FcuStat5 < FcuStat
	def unoccupied(command, lks_FCU)
		if command == true
			command = {}

			command['stat'] = 'off'
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit

			@data_man.operate(@fcuid,command,'hotelinterlock','Unoccupied when Win_open')
		end
		
		if @checkInExist == true
			return FcuStat6.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		else
			return FcuStat6nci.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		end
	end
	
	def win_close(command, lks_FCU)
		if command == true
			command = {}
			
			command['stat'], command['sp'], command['mode'], command['fanstep'], command['csp_sb'] = lks_FCU.get_last_stat()
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Window close')
		end
		
		return FcuStat3.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def unrent(command, lks_FCU)		
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			command['fanstep'] = @hotel['unrentedfanstep']
			
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unrent without occupied')
		end
		
		lks_FCU.set_last_stat('on', @hotel['unrentedOMSP'], 'cool', @hotel['unrentedfanstep'], nil)
	
		return FcuStat9.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
end

class FcuStat6 < FcuStat
	def occupied(command, lks_FCU)		
		if command == true
			command = {}

			command['stat'] = 'off'
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Occupied when Win_open')
		end
	
		return FcuStat5.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def win_close(command, lks_FCU)
		if command == true
			command = {}
			
			kcMode = @hotel['kcMode']
			setback = @hotel['KCSB']
			setback = nil if(setback == '---')
			
			case kcMode
			when 'keycardoff'																			#FCU off with no setback
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'keycardsetback'																		#FCU off with setback
				command['stat'] = 'off'
				command['csp_sb'] = setback
			when 'keycardsetpoint'																		#FCU on, sp change to @hotel['KCSP'] settings
				command['stat'] = 'on'
				command['sp'] = @hotel['KCSP']
			end
			
			if @hotel['FSL'] == true
				command['fanstep'] = 'L'
			end	
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Win_close when Unoccupied')
		end
		
		return FcuStat4.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def unrent(command, lks_FCU)
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			command['fanstep'] = @hotel['unrentedfanstep']
			
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unrent without occupied')
		end
		
		lks_FCU.set_last_stat('on', @hotel['unrentedOMSP'], 'cool', @hotel['unrentedfanstep'], nil)
		
		return FcuStat8.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
end

class FcuStat7 < FcuStat
	def unoccupied(command, lks_FCU)
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			command['fanstep'] = @hotel['unrentedfanstep']
			
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unrented')
		end	
		
		lks_FCU.set_last_stat('on', @hotel['unrentedOMSP'], 'cool', @hotel['unrentedfanstep'], nil)
	
		return FcuStat1.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def win_open(command, lks_FCU)
		if command == true
			command = {}
		
			command['stat'] = 'off'
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
		
			@data_man.operate(@fcuid,command,'hotelinterlock','Window open when unrented')
		end
		
		return FcuStat9.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def rent(command, lks_FCU)
		if command == true
			command = {}
			
			command['stat'], command['sp'], command['mode'], command['fanstep'], command['csp_sb'] = lks_FCU.get_last_stat()
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Rented when occupied')
		end
		
		return FcuStat3.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
end

class FcuStat8 < FcuStat
	def occupied(command, lks_FCU)
		if command == true
			command = {}
		
			command['stat'] = 'off'
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
		
			@data_man.operate(@fcuid,command,'hotelinterlock','Occupied when window open')
		end
		
		if @checkInExist == true
			return FcuStat9.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		else
			return FcuStat5.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		end	
	end
	
	def win_close(command, lks_FCU)
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			command['fanstep'] = @hotel['unrentedfanstep']
			
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Win_close when unrented')
		end
		
		lks_FCU.set_last_stat('on', @hotel['unrentedOMSP'], 'cool', @hotel['unrentedfanstep'], nil)
		
		if @checkInExist == true
			return FcuStat1.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		else
			return FcuStat1nci.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
		end	
	end
	
	def rent(command, lks_FCU)
		if command == true
			command = {}
		
			command['stat'] = 'off'
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
		
			@data_man.operate(@fcuid,command,'hotelinterlock','Rented when Win_open')
		end
		
		return FcuStat6.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
end

class FcuStat9 < FcuStat
	def unoccupied(command, lks_FCU)
		if command == true
			command = {}
		
			command['stat'] = 'off'
			
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unoccupied when unrented')
		end
		
		return FcuStat8.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def win_close(command, lks_FCU)
		if command == true
			command = {}
			
			command['stat'] = 'off'
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Window close when unrented')
		end
	
		return FcuStat7.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
	
	def rent(command, lks_FCU)
		if command == true
			command = {}
		
			command['stat'] = 'off'
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Rented when Win_open')
		end
		
		return FcuStat5.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
end

class FcuStat1nci < FcuStat1
	def occupied(command, lks_FCU)
		if command == true
			command = {}
			
			command['stat'], command['sp'], command['mode'], command['fanstep'], command['csp_sb'] = lks_FCU.get_last_stat()
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Occupied')
		end
		
		return FcuStat3.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
end

class FcuStat4nci < FcuStat4	
	def unrent(command, lks_FCU)
		if command == true
			command = {}
			
			opMode = @hotel['unrentedopMode']
			setback = @hotel['unrentedOMSB']
			setback = nil if(setback == '---')
			
			case opMode
			when 'opmodeon'
				command['stat'] = 'on'
				command['csp_sb'] = nil
			when 'opmodeoff'
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'opmodesetback'
				command['stat'] = 'off'
				command['csp_sb'] = setback
			end
			
			command['sp'] = @hotel['unrentedOMSP']
			command['fanstep'] = @hotel['unrentedfanstep']
			
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Unrented')
		end
		
		lks_FCU.set_last_stat('on', @hotel['unrentedOMSP'], 'cool', @hotel['unrentedfanstep'], nil)
	
		return FcuStat1nci.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end 
	
	def win_open(command, lks_FCU)		
		if command == true
			command = {}
		
			command['stat'] = 'off'
			command['csp_sb'] = nil
			command['rc_proh_stat'] = 'proh' if(@hotel['remotecontrol'] == true)						#Remote Control Prohibit
		
			@data_man.operate(@fcuid,command,'hotelinterlock','Win_open when Unoccupied')
		end
		
		return FcuStat6nci.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
end

class FcuStat6nci < FcuStat6	
	def win_close(command, lks_FCU)
		if command == true
			command = {}
			
			kcMode = @hotel['kcMode']
			setback = @hotel['KCSB']
			setback = nil if(setback == '---')
			
			case kcMode
			when 'keycardoff'																			#FCU off with no setback
				command['stat'] = 'off'
				command['csp_sb'] = nil
			when 'keycardsetback'																		#FCU off with setback
				command['stat'] = 'off'
				command['csp_sb'] = setback
			when 'keycardsetpoint'																		#FCU on, sp change to @hotel['KCSP'] settings
				command['stat'] = 'on'
				command['sp'] = @hotel['KCSP']
			end
			
			if @hotel['FSL'] == true
				command['fanstep'] = 'L'
			end	
			
			command['rc_proh_stat'] = 'permit'															#Remote Control Permit
			
			@data_man.operate(@fcuid,command,'hotelinterlock','Win_close when Unoccupied')
		end
	
		return FcuStat4nci.new(@hotel, @fcuid, @data_man, @checkInExist, lks_FCU, @roomFcu)
	end
end