#coding: utf-8

class Last_stat
	def initialize(stat, sp, mode, fanstep, csp_sb = nil)
		@stat = stat
		@sp = sp
		@mode = mode
		@fanstep = fanstep
		@csp_sb = csp_sb
	end
	
	def set_last_stat(stat, sp, mode, fanstep, csp_sb = nil)
		@stat = stat
		@sp = sp
		@mode = mode
		@fanstep = fanstep
		@csp_sb = csp_sb
	end
	
	def get_last_stat()	
		return @stat, @sp, @mode, @fanstep, @csp_sb
	end
end