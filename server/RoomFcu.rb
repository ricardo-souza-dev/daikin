#coding: utf-8

require_relative 'DataManager'
require_relative 'FcuStat'
require_relative 'Last_stat'

class RoomFcu
	def initialize(hotel, id, data_man, checkInExist)
		@lks_FCU = Last_stat.new('on', hotel['unrentedOMSP'], 'cool', hotel['unrentedfanstep'], nil)
	
		if checkInExist == true		
			@stat = FcuStat1.new(hotel, id, data_man, checkInExist, @lks_FCU, self)
		else
			@stat = FcuStat1nci.new(hotel, id, data_man, checkInExist, @lks_FCU, self)
		end
	end
	
	def rent(command)
		@stat = @stat.rent(command, @lks_FCU)
	end
	
	def unrent(command)
		@stat = @stat.unrent(command, @lks_FCU)
	end
	
	def occupied(command)
		# for DAV special: during occupied, schedule operation is ignored
		$data_man.occ_stat = true

		@stat = @stat.occupied(command, @lks_FCU)
	end
	
	def unoccupied(command)
		# for DAV special: during occupied, schedule operation is ignored
		$data_man.occ_stat = false

		@stat = @stat.unoccupied(command, @lks_FCU)
	end
	
	def win_open(command)
		@stat = @stat.win_open(command, @lks_FCU)
	end
	
	def win_close(command)
		@stat = @stat.win_close(command, @lks_FCU)
	end
end